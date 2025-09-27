from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from pydantic import BaseModel
from uuid import uuid4
from rag.main import llm
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

    generation = llm.astream_events(messages)

    # return {
    #     "model": llm.model,
    #     "generation_id": "gen-" + generation_id,
    #     "timestamp": time(),
    #     "response": generation.content,
    # }

    async def event_stream():
        async for chunk in generation:
            print("chunk", chunk, flush=True)

            if chunk.get("event") == "on_chat_model_start":
                yield f"event: delta\ndata: {dumps({'model': llm.model})}\n\n"

            elif chunk.get("event") == "on_chat_model_end":
                yield f"event: delta\ndata: [DONE]\n\n"
            
            elif chunk.get("event") == "on_chat_model_stream":
                yield f"data: {chunk.get("data").get("chunk").model_dump_json()}\n\n"

            # if chunk.get("error"):
            #     yield f"data: {chunk['error']}\n\n"
            # elif chunk.get("done"):
            #     yield f"data: [DONE]\n\n"
            # elif chunk.get("input"):
            #     yield f"start: [INPUT] {chunk['input']}\n\n"
                
            # else:
            #     yield f"data: {dumps(chunk)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")