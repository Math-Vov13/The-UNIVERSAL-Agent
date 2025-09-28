from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from pydantic import BaseModel
from typing import Optional, Literal
from uuid import uuid4
from json import dumps

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


def _create_event_stream(generation):
    """Shared event stream logic for both endpoints"""
    async def event_stream():
        yield f"event: delta\ndata: {dumps({'model': llm_with_tools.model})}\n\n"
        async for chunk in generation:
            # print("chunk", chunk, flush=True, end="\n\n")
            print("event stream chunk:", chunk.get("event"), flush=True)

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
    content = [{"type": "text", "text": request.prompt}]
    if request.files:
        for file in request.files:
            print("Processing file:", file.name, file.mimeType, flush=True)
            content.append({
                "type": "image_url",
                "image_url": {"url": file.base64}
            })

    messages = convert_history(request.history) + [HumanMessage(content=content)]
    generation = graph.astream_events({"messages": messages})
    return StreamingResponse(_create_event_stream(generation)(), media_type="text/event-stream")