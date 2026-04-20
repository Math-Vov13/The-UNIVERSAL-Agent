import asyncio
from typing import Annotated, Any
from typing_extensions import TypedDict
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.redis.ashallow import AsyncShallowRedisSaver
from langgraph.cache.redis import RedisCache
from langgraph.store.redis import AsyncRedisStore
from langchain_redis.cache import RedisSemanticCache
from langgraph.types import CachePolicy

from rag.config import llm, llm_pro, model_embeddings, small_model_embeddings, semantic_cache
from rag.tools.code_sandbox import code_interpreter
from rag.tools.files_generation import generate_image
from rag.tools.satellites import get_satellite_position, get_tle
from models.cache_redis.client import (
    client as redis_client,
    cache_client as redis_cache_client,
    async_client as async_redis_client,
)
from models.vc_chroma.client import chroma_client
from models.vc_chroma.utils import get_collection_by_name, openai_ef
from langchain_tavily import TavilySearch

# checkpointer = InMemorySaver()


## TOOLS
tools = [TavilySearch(name="web_search", max_results=7), get_satellite_position, get_tle, code_interpreter, generate_image]
tools_expert = [TavilySearch(name="web_search", max_results=16), code_interpreter]

## Prompts
system_prompt_content = open("src/docs/GEMINI_SYSTEM_PROMPT.md").read()
user_docs_context = open("src/docs/USER_MESSAGE_WITH_DOCS_CONTEXT.md").read()


class State(TypedDict):
    messages: Annotated[list, add_messages]
    # reasoning_tasks: Annotated[list[str], Field(default_factory=list)]

class Classification(BaseModel):
    sentiment: str = Field(description="The sentiment of the text")
    reasoning_tasks: list[str] = Field(description="List of advanced reasoning tasks to perform to answer the user's question")


graph_builder = StateGraph(State)
llm_with_tools = llm.bind_tools(tools)
llmpro_with_tools = llm_pro.bind_tools(tools_expert)



def chatbot(state: State, config: RunnableConfig):
    system = [SystemMessage(content=system_prompt_content)]
    print("\n--- Début de l'invocation du LLM dans 'generation_task' ---")
    print(f"Thread ID (pour le checkpointer) : {state.get('metadata', {}).get('thread_id', 'Non spécifié dans l\'état')}")
    
    # Recherche sémantique des documents pertinents
    try:
        collection = get_collection_by_name("1234") #chroma_client.get_collection(name="1234") # TODO: remplacer par l'ID de collection utilisateur approprié
        if collection is None: raise ValueError("Collection introuvable pour la recherche sémantique.")
        
        relevant_docs = collection.query(
            # query_texts=[state["messages"][-1].content],
            query_embeddings=openai_ef(input=state["messages"][-1].content),
            # query_embeddings=model_embeddings.embed_query(state["messages"][-1].content),
            n_results=5,
            include=["metadatas", "documents", "distances", "uris"],
        )
        print("Semantic search results:", relevant_docs)

        if len(relevant_docs.get("documents", [])) > 0:
            raw_documents = relevant_docs.get("documents", [[]])[0]
            docs_content = "\n\n".join(
                doc.decode("utf-8") if isinstance(doc, (bytes, bytearray)) else str(doc)
                for doc in raw_documents
            ).strip()
            context_message = HumanMessage(content=user_docs_context.format(DOCUMENTS_CONTEXT=docs_content, USER_PROMPT=state["messages"][-1].content))
            state["messages"][-1] = context_message  # Remplace le dernier message utilisateur par celui incluant le contexte des documents
            print(f"Documents pertinents trouvés et ajoutés au contexte : {len(relevant_docs.get('documents', [[]])[0])} documents.")

    except Exception as e:
        print(f"Erreur lors de la recherche sémantique des documents : {e}")

    # Ajoute ce print crucial
    print(f"Contenu initial de state['messages'] : {state.get('messages', [])}")

    messages_for_llm = system + state["messages"]

    # for msg in messages_for_llm.copy():
    #     print(f"  Type: {type(msg).__name__}")
    #     print(f"  Content: {msg.content[:200]}...") # Affiche les 200 premiers caractères du contenu
    #     # if hasattr(msg, 'tool_calls') and msg.tool_calls:
    #     #     print(f"  Tool Calls: {json.dumps([tc.dict() for tc in msg.tool_calls], indent=2)}")
    #     # if hasattr(msg, 'tool_call_id') and msg.tool_call_id:
    #     #     print(f"  Tool Call ID: {msg.tool_call_id}")
    #     print("-" * 20) # Séparateur pour chaque message
    # print("--- Fin de l'historique envoyé au LLM ---")

    response = llm_with_tools.invoke(messages_for_llm)
    print("\n--- Réponse du LLM dans 'generation_task' ---")
    print(f"  Type: {type(response).__name__}")
    print(f"  Content: {response.content[:500]}...") # Affiche les 500 premiers caractères de la réponse

    return {"messages": [response]}

def reasoning_agent(state: State, config: RunnableConfig):
    system = [SystemMessage(content="You are a reasoning agent. You must think step by step to find the best answer.")]
    return {"messages": [llmpro_with_tools.invoke(system + state["messages"])]}



graph_builder.add_node("generation_task", chatbot, cache_policy=CachePolicy(ttl=360))
graph_builder.add_node("reasoning_task", reasoning_agent)
tool_node = ToolNode(tools=tools)
# tool_exp_node = ToolNode(tools=tools_expert)
graph_builder.add_node("tools", tool_node)
# graph_builder.add_node("tools_expert", tool_exp_node)

## Graph structure
graph_builder.add_conditional_edges("generation_task", tools_condition)
graph_builder.add_edge("tools", "generation_task")
graph_builder.add_edge(START, "generation_task")

graph: Any | None = None
checkpointer: AsyncShallowRedisSaver | None = None
graph_store: AsyncRedisStore | None = None
graph_cache: RedisCache | None = None
_graph_lock: asyncio.Lock | None = None


async def ensure_graph():
    """Initialize the LangGraph graph once the event loop is running."""
    global graph, checkpointer, graph_store, graph_cache, _graph_lock

    if graph is not None:
        return graph

    if async_redis_client is None:
        raise RuntimeError("Redis async client is not configured")

    cache_backend = redis_cache_client or redis_client
    if cache_backend is None:
        raise RuntimeError("Redis cache client is not configured")

    if _graph_lock is None:
        _graph_lock = asyncio.Lock()
    
    ttl_config = {
        "default_ttl": 120,  # Expire checkpoints after 120 minutes
        "refresh_on_read": True,  # Reset expiration time when reading checkpoints
    }

    async with _graph_lock:
        if graph is None:
            saver = AsyncShallowRedisSaver(redis_client=async_redis_client, ttl=ttl_config)
            await saver.setup()
            checkpointer = saver

            store_ttl_config = {
                "default_ttl": 1440.0,  # minutes (24h)
                "refresh_on_read": True,
            }
            store = AsyncRedisStore(
                redis_client=async_redis_client,
                ttl=store_ttl_config,
                store_prefix="langgraph_store",
            )
            await store.setup()

            # cache = RedisCache(
            #     cache_backend,
            #     prefix="langgraph_cache:",
            # )
            cache = RedisSemanticCache(
                embeddings=model_embeddings,
                redis_client=cache_backend,
                ttl=60,  # minutes (1h)
                distance_threshold=0.2,
            )

            graph = graph_builder.compile(
                name="RAG_Chatbot_Graph",
                # store=store,
                # cache=cache,
                checkpointer=checkpointer,
                # interrupt_before=["tools"], # TODO: man-in-the-loop for user validation
            )
            graph_store = store
            graph_cache = cache

    return graph


async def get_checkpointer() -> AsyncShallowRedisSaver:
    await ensure_graph()
    assert checkpointer is not None
    return checkpointer


async def get_store() -> AsyncRedisStore:
    await ensure_graph()
    assert graph_store is not None
    return graph_store


async def get_cache() -> RedisCache:
    await ensure_graph()
    assert graph_cache is not None
    return graph_cache