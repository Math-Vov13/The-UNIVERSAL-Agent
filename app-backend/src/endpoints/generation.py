from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from pydantic import BaseModel
from typing import Optional, Literal
from models.s3.upload_files import upload_files_to_s3
from json import dumps
import base64

from rag.server import llm_with_tools, graph


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


def _create_event_stream(generation, uploaded_files=[]):
    """Shared event stream logic for both endpoints"""
    async def event_stream():
        yield f"event: delta\ndata: {dumps({'model': llm_with_tools.model})}\n\n"
        async for chunk in generation:
            # print("chunk", chunk, flush=True, end="\n\n")
            print("event stream chunk:", chunk.get("event"), flush=True)
            for file in uploaded_files:
                yield f"event: file_uploaded\ndata: {dumps(file)}\n\n"

            if chunk.get("event") == "on_tool_start":
                yield f"event: tool_start\ndata: {dumps({'id': chunk.get('run_id'), 'name': chunk.get('name'), 'input': chunk.get('data').get('input')})}\n\n"
            
            elif chunk.get("event") == "on_tool_end":
                yield f"event: tool_end\ndata: {dumps({'id': chunk.get('run_id'), 'tool_id': chunk.get('data').get('output').tool_call_id, 'name': chunk.get('name'), 'output': chunk.get('data').get('output').content})}\n\n"

            elif chunk.get("event") == "on_chat_model_stream":
                if chunk.get("data").get("chunk").content == "": continue
                yield f"data: {chunk.get("data").get("chunk").model_dump_json()}\n\n"
            
            # elif chunk.get("event") == "on_chain_end":
            #     print("chain ended:", chunk, flush=True)
            
        yield f"event: delta\ndata: [DONE]\n\n"
    return event_stream



@router.post("/")
def create_generation_json(request: GenerationRequest) -> StreamingResponse:
    print("prompt:", request.prompt, "history:", request.history, flush=True)
 
    # generation_id = str(uuid4())
    uploaded_files = []
    content = [{"type": "text", "text": request.prompt}]
    if request.files:
        for file in request.files:
            print("Processing file:", file.name, file.mimeType, flush=True)
            full_content = file.base64.split(f"data:{file.mimeType};base64,")[1]
            print("avant:", file.base64[:30] + "...", flush=True)
            print("après:", full_content[:30] + "...", flush=True)
            if full_content:
                decoded_bytes = base64.b64decode(full_content)
                obj_name = upload_files_to_s3(decoded_bytes, file.name, file.mimeType)
                if obj_name:
                    uploaded_files.append({
                        "name": file.name,
                        "size": file.size,
                        "mimeType": file.mimeType,
                        "type": file.type,
                        "s3_object": obj_name
                    })
            content.append({
                "type": "image_url",
                "image_url": {"url": file.base64}
            })

    messages = convert_history(request.history) + [HumanMessage(content=content)]
    generation = graph.astream_events({"messages": messages})
    return StreamingResponse(_create_event_stream(generation, uploaded_files)(), media_type="text/event-stream")