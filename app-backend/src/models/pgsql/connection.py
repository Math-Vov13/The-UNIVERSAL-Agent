import psycopg
# from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.checkpoint.memory import InMemorySaver

import platform
import asyncio
if platform.system() == "Windows":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import os
from dotenv import load_dotenv
load_dotenv()


POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_HOST = os.getenv("POSTGRES_HOST")
POSTGRES_PORT = os.getenv("POSTGRES_PORT")
POSTGRES_DB = os.getenv("POSTGRES_DB")


# conn = psycopg.connect(f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}")
# checkpointer = PostgresSaver(conn)
# checkpointer = InMemorySaver()

# async def init_checkpointer():
#     async with await psycopg.AsyncConnection.connect(
#         f"dbname={POSTGRES_DB} user={POSTGRES_USER} password={POSTGRES_PASSWORD} host={POSTGRES_HOST} port={POSTGRES_PORT}",
#         autocommit=True
#     ) as conn:
#         print("Connected to PostgreSQL database for checkpointing.")
#         saver = AsyncPostgresSaver(conn)
#         print("Setting up the checkpoint saver...")
#         # asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
#         await saver.setup()
#         print("Checkpoint saver is set up and ready.")
#         return saver

# if __name__ == "__main__":
#     import asyncio
#     asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
#     checkpointer = asyncio.run(init_checkpointer())