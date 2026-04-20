from chromadb.api.models.Collection import Collection
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction

from models.vc_chroma.client import chroma_client

openai_ef = OpenAIEmbeddingFunction(
    model_name="text-embedding-3-small",
    api_key_env_var="OPENAI_API_KEY",
    dimensions=1536,
)

def get_collection_by_name(collection_name: str, get_or_create: bool = False) -> Collection | None:
    try:
        get_collec_fn = chroma_client.get_collection if not get_or_create else chroma_client.get_or_create_collection

        collection = get_collec_fn(
            name=collection_name,
            embedding_function=openai_ef,
            # metadata={"hnsw:space": "cosine"},
        )
        return collection
    except Exception as e:
        print(f"Error retrieving collection '{collection_name}':", str(e))
        return None