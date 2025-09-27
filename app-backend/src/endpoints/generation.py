from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from pydantic import BaseModel
from uuid import uuid4
# from rag.config import llm
from rag.server import llm_with_tools, graph
from json import dumps


router = APIRouter()


class HistoryItem(BaseModel):
    role: str
    content: str

class GenerationRequest(BaseModel):
    prompt: str
    history: list[HistoryItem] = []


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


@router.post("/")
def create_generation(body: GenerationRequest) -> StreamingResponse:
    generation_id = str(uuid4())
    messages = convert_history(body.history) + [HumanMessage(content=body.prompt)]

    generation = graph.astream_events({"messages": messages})

    async def event_stream():
        yield f"event: delta\ndata: {dumps({'model': llm_with_tools.model})}\n\n"
        async for chunk in generation:
            print("chunk", chunk, flush=True, end="\n\n")

            # if chunk.get("event") == "on_chat_model_start":
            #     yield f"event: delta\ndata: {dumps({'model': llm_with_tools.model})}\n\n"

            # elif chunk.get("event") == "on_chat_model_end":
            #     yield f"event: delta\ndata: [DONE]\n\n"

            if chunk.get("event") == "on_tool_start":
                yield f"event: tool_start\ndata: {dumps({'id': chunk.get('run_id'), 'name': chunk.get('name'), 'input': chunk.get('data').get('input')})}\n\n"
            
            elif chunk.get("event") == "on_tool_end":
                yield f"event: tool_end\ndata: {dumps({'id': chunk.get('run_id'), 'tool_id': chunk.get('data').get('output').tool_call_id, 'name': chunk.get('name'), 'output': chunk.get('data').get('output').content})}\n\n"

            elif chunk.get("event") == "on_chat_model_stream":
                if chunk.get("data").get("chunk").content == "": continue
                yield f"data: {chunk.get("data").get("chunk").model_dump_json()}\n\n"
            
        yield f"event: delta\ndata: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")