from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import ToolMessage, HumanMessage, AIMessage, SystemMessage
from langchain_redis import RedisChatMessageHistory
from pydantic import BaseModel
from typing import Optional, Literal

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
from rag.server import ensure_graph
from models.cache_redis.client import client as redis_client
# from models.vc_chroma.client import chroma_client
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
    history_id: Optional[str] = None
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


def _create_event_stream(request_id: str, generation, redis_store: RedisChatMessageHistory):
    async def event_stream():

        yield f"data: {RequestConnect(request_id=request_id).model_dump_json()}\n\n"
        yield f"data: {ContentModeration(request_id=request_id, moderate=None).model_dump_json()}\n\n"

        response_content = ""
        start_time = time.time()
        try:
            async for chunk in generation:
                print("event stream chunk:", chunk.get("event"), flush=True)
                # print("Full chunk data:", chunk, flush=True)

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
                    # Response cached (fetch from redis)
                    if response_content == "" and chunk.get('data', {}).get('output'):
                        # TODO: handle tool calls in cached response
                        delta_chunk = chunk.get('data', {}).get('output').model_dump()
                        yield f"event: delta\ndata: {ChunkMessage(run_id=chunk.get('run_id'), parts=[{"type": "text", "text": delta_chunk.get('content', '')}], tool_calls=delta_chunk.get('tool_calls', []), response_metadata=delta_chunk.get('response_metadata', {}) or {}, usage_metadata=delta_chunk.get('usage_metadata', {}) or {}).model_dump_json()}\n\n"
                    response_content = ""
                    redis_store.add_ai_message(chunk.get('data', {}).get('output'))
                    yield f"event: delta\ndata: {ChunkEnd(run_id=chunk.get('run_id', ''), response_metadata=chunk.get('data', {}).get('output', {}).response_metadata).model_dump_json()}\n\n"

                elif chunk.get("event") == "on_tool_start":
                    pass
                    
                elif chunk.get("event") == "on_tool_end":
                    print("Tool ended:", chunk, flush=True)
                    redis_store.add_message(ToolMessage(content=chunk.get('data', {}).get('output').content, tool_call_id=chunk.get('data', {}).get('output').tool_call_id))
                    yield f"data: {ChunkToolEnd(run_id=chunk.get('run_id'), tool_id=chunk.get('data').get('output').tool_call_id, tool_name=chunk.get('name'), data={
                        "output": chunk.get('data').get('output').content,
                        "input": chunk.get('data').get('input'),
                    }).model_dump_json()}\n\n"
                    print("Yielded tool end for tool:", chunk.get('name'), flush=True)
                    
                elif chunk.get("event") == "on_chat_model_stream":
                    # print("Chat model stream:", chunk, flush=True)
                    delta_chunk = chunk.get("data").get("chunk").model_dump()
                    response_content += delta_chunk.get('content', '')
                    yield f"event: delta\ndata: {ChunkMessage(run_id=chunk.get('run_id'), parts=[{"type": "text", "text": delta_chunk.get('content', '')}], tool_calls=delta_chunk.get('tool_calls', []), response_metadata=delta_chunk.get('response_metadata', {}) or {}, usage_metadata=delta_chunk.get('usage_metadata', {}) or {}).model_dump_json()}\n\n"
            yield f"data: {RequestEnd(request_id=request_id, total_time=time.time() - start_time).model_dump_json()}\n\n"

        except Exception as e:
            print("Error during generation:", str(e), flush=True)
            yield f"data: {ErrorResponse(error=str(e), error_type=type(e).__name__).model_dump_json()}\n\n"
        
        finally:
            # checkpointer.delete_thread(request_id)
            yield f"data: [DONE]\n\n"      
    
    return event_stream



@router.post("/")
async def create_generation_json(request: GenerationRequest) -> StreamingResponse:
    RedisHistory = RedisChatMessageHistory(
        redis_client=redis_client,
        session_id=request.history_id or "temp_session",
        ttl=64800 # 7 days
    )

    print("prompt:", request.prompt, "history:", RedisHistory.messages, flush=True)

    generation_id = "req-" + str(uuid4())
    content = [{"type": "text", "text": request.prompt}]
    content_files = []
    if request.files:
        for file in request.files:
            print("Processing file:", file.name, file.mimeType, flush=True)
            content_files.append({
                "type": "image_url",
                # "image_url": {"url": f"data:{file.mimeType};base64,{file.base64}"}
                "image_url": {"url": file.base64}
            })

        print("Contenu:", HumanMessage(content=content + content_files), flush=True)

    config: RunnableConfig = {
        "configurable": {
            "thread_id": request.history_id or generation_id # TODO: utiliser l'id de l'historique (pour le checkpointer)
        }
    }
    # messages = convert_history(request.history) + [HumanMessage(content=content)]
    graph_instance = await ensure_graph()
    generation = graph_instance.astream_events({"messages": RedisHistory.messages + [HumanMessage(content=content + content_files)]}, config=config)
    RedisHistory.add_user_message(HumanMessage(content=content))
    return StreamingResponse(_create_event_stream(request_id=generation_id, generation=generation, redis_store=RedisHistory)(), media_type="text/event-stream")