from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from pydantic import BaseModel
from typing import Optional, Literal
from models.s3.upload_files import upload_files_to_s3
from json import dumps
from schema.output_streaming import DeltaMessage, FileUploaded, ToolStart, ToolEnd, StartingResponse, SummaryMessage, ErrorResponse
import base64
import time

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


def _create_event_stream(prompt: str, generation, uploaded_files=[]):
    async def event_stream():
        input_tokens_total = 0
        output_tokens_total = 0
        total_tools_used = set()
        complete_response = ""

        yield f"data: {StartingResponse(timestamp=str(time.time()), model=llm_with_tools.model, settings={}, message=prompt).model_dump_json()}\n\n"
        yield "data: {\"type\": \"moderation\", \"category\": \"safe\"}\n\n"
        for file in uploaded_files: yield f"data: {FileUploaded(name=file['name'], key=file['key_name'], size=file['size'], mimeType=file['mimeType'], type=file['type']).model_dump_json()}\n\n"

        try:
            async for chunk in generation:
                print("event stream chunk:", chunk.get("event"), flush=True)

                if chunk.get("event") == "on_tool_start":
                    print("Tool started:", chunk, flush=True)
                    total_tools_used.add(chunk.get("name"))
                    yield f"data: {ToolStart(id=chunk.get('run_id'), name=chunk.get('name'), input=chunk.get('data').get('input')).model_dump_json()}\n\n"

                elif chunk.get("event") == "on_tool_end":
                    print("Tool ended:", chunk, flush=True)
                    yield f"data: {ToolEnd(id=chunk.get('run_id'), tool_id=chunk.get('data').get('output').tool_call_id, name=chunk.get('name'), output=chunk.get('data').get('output').content).model_dump_json()}\n\n"

                elif chunk.get("event") == "on_chat_model_stream":
                    print("Chat model stream:", chunk, flush=True)
                    # if chunk.get("data").get("chunk").content == "": continue
                    delta_chunk = chunk.get("data").get("chunk").model_dump()
                    tokens_used = delta_chunk.get("usage_metadata", {}).get("output_tokens", 0)

                    complete_response += delta_chunk.get("content", "")
                    input_tokens_total += delta_chunk.get("usage_metadata", {}).get("input_tokens", 0)
                    output_tokens_total += tokens_used

                    yield f"data: {DeltaMessage(tokens=tokens_used, chunk=delta_chunk.get("content", "")).model_dump_json()}\n\n"
        except Exception as e:
            yield f"data: {ErrorResponse(error=str(e), type=type(e).__name__).model_dump_json()}\n\n"
            yield f"data: [DONE]\n\n"
            return

        yield f"data: {SummaryMessage(inp_tokens=input_tokens_total, out_tokens=output_tokens_total, tools=list(total_tools_used), response=complete_response, files=uploaded_files).model_dump_json()}\n\n"
        yield f"data: [DONE]\n\n"
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
    return StreamingResponse(_create_event_stream(request.prompt, generation, uploaded_files)(), media_type="text/event-stream")