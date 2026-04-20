import chromadb
from dotenv import load_dotenv
from os import environ as env
load_dotenv()

chroma_client = chromadb.HttpClient(
    host=env.get("CHROMA_HOST", "localhost"),
    port=env.get("CHROMA_PORT", 8000),
    ssl=False
)

async def create_connection():
    return await chromadb.AsyncHttpClient(
        host=env.get("CHROMA_HOST", "localhost"),
        port=env.get("CHROMA_PORT", 8000),
        ssl=False
    )

print("ChromaDB ping:", chroma_client.heartbeat())  # Test the connection