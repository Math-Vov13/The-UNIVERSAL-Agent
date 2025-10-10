from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from pydantic import BaseModel
from typing import Optional, Literal
from models.s3.upload_files import upload_files_to_s3

from schema.generation_streaming import ( 
    ChunkMessage,
    ChunkStart,
    ChunkEnd,
    RequestConnect,
    RequestEnd,
    ContentModeration,
    ChunkToolEnd,
    ErrorResponse
)

import base64
from rag.server import graph
from uuid import uuid4
import time


router = APIRouter()


class HistoryItem(BaseModel):
    role: Literal["user", "assistant", "system"] = "system"
    content: str

class FileItem(BaseModel):
    name: str
    size: int
    mimeType: str
    type: str
    base64: str

class GenerationRequest(BaseModel):
    prompt: str
    history: list[HistoryItem] = []
    files: Optional[list[FileItem]] = None


role_map = {
    "user": HumanMessage,
    "assistant": AIMessage,
    "system": SystemMessage,
}

def convert_history(history_items):
    messages = []
    for item in history_items:
        cls = role_map.get(item.role, HumanMessage)  # fallback user
        messages.append(cls(content=item.content))
    return messages


def _create_event_stream(request_id: str, generation, uploaded_files=[]):
    async def event_stream():

        yield f"data: {RequestConnect(request_id=request_id).model_dump_json()}\n\n"
        yield f"data: {ContentModeration(request_id=request_id, moderate=None).model_dump_json()}\n\n"

        start_time = time.time()
        try:
            async for chunk in generation:
                print("event stream chunk:", chunk.get("event"), flush=True)

                if chunk.get("event") == "on_chat_model_start":
                    # print("Chat model started:", chunk, flush=True)
                    yield f"event: delta\ndata: {ChunkStart(
                        run_id=chunk.get('run_id', ''),
                        graph_node={
                            "step": chunk.get('metadata', {}).get('langgraph_step', 0),
                            "node": chunk.get('metadata', {}).get('langgraph_node', ''),
                            "_provider": chunk.get('metadata', {}).get('ls_provider', ''),
                            "_name": chunk.get('metadata', {}).get('ls_model_name', ''),
                            "_type": chunk.get('metadata', {}).get('ls_model_type', ''),
                        },
                        params={
                            "temperature": 0,
                            "max_tokens": 0,
                            "top_p": 0,
                            "presence_penalty": 0,
                            "frequency_penalty": 0,
                        }
                        ).model_dump_json()}\n\n"

                elif chunk.get("event") == "on_chat_model_end":
                    # print("Chat model ended:", chunk, flush=True)
                    yield f"event: delta\ndata: {ChunkEnd(run_id=chunk.get('run_id', ''), response_metadata=chunk.get('data', {}).get('output', {}).response_metadata).model_dump_json()}\n\n"

                elif chunk.get("event") == "on_tool_start":
                    pass
                    
                elif chunk.get("event") == "on_tool_end":
                    # print("Tool ended:", chunk, flush=True)
                    yield f"data: {ChunkToolEnd(run_id=chunk.get('run_id'), tool_id=chunk.get('data').get('output').tool_call_id, tool_name=chunk.get('name'), data={
                        "output": chunk.get('data').get('output').content,
                        "input": chunk.get('data').get('input'),
                    }).model_dump_json()}\n\n"
                    
                elif chunk.get("event") == "on_chat_model_stream":
                    # print("Chat model stream:", chunk, flush=True)
                    delta_chunk = chunk.get("data").get("chunk").model_dump()
                    yield f"event: delta\ndata: {ChunkMessage(run_id=chunk.get('run_id'), parts=[{"type": "text", "text": delta_chunk.get('content', '')}], tool_calls=delta_chunk.get('tool_calls', []), response_metadata=delta_chunk.get('response_metadata', {}), usage_metadata=delta_chunk.get('usage_metadata', {})).model_dump_json()}\n\n"

        except Exception as e:
            yield f"data: {ErrorResponse(error=str(e), error_type=type(e).__name__).model_dump_json()}\n\n"
            yield f"data: [DONE]\n\n"
            return

        yield f"data: {RequestEnd(request_id=request_id, total_time=time.time() - start_time).model_dump_json()}\n\n"
        yield f"data: [DONE]\n\n"
    return event_stream



@router.post("/")
def create_generation_json(request: GenerationRequest) -> StreamingResponse:
    print("prompt:", request.prompt, "history:", request.history, flush=True)

    generation_id = "req-" + str(uuid4())
    uploaded_files = []
    content = [{"type": "text", "text": request.prompt}]
    if request.files:
        for file in request.files:
            print("Processing file:", file.name, file.mimeType, flush=True)
            full_content = file.base64.split(f"data:{file.mimeType};base64,")[1]
            if full_content:
                decoded_bytes = base64.b64decode(full_content)
                obj_name = upload_files_to_s3(decoded_bytes, file.name, file.mimeType)
                if obj_name:
                    uploaded_files.append({
                        "name": file.name,
                        "size": file.size,
                        "mimeType": file.mimeType,
                        "type": file.type,
                        "key_name": obj_name
                    })
            content.append({
                "type": "image_url",
                "image_url": {"url": file.base64}
            })

    messages = convert_history(request.history) + [HumanMessage(content=content)]
    generation = graph.astream_events({"messages": messages})
    return StreamingResponse(_create_event_stream(request_id=generation_id, generation=generation, uploaded_files=uploaded_files)(), media_type="text/event-stream")