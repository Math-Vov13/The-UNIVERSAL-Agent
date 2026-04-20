import redis
from redis.asyncio import Redis as AsyncRedis
from dotenv import load_dotenv
from os import environ as env

load_dotenv()

redis_url = env.get("REDIS_URL")

client = redis.from_url(redis_url, decode_responses=True) if redis_url else None
cache_client = redis.from_url(redis_url, decode_responses=False) if redis_url else None
async_client = AsyncRedis.from_url(redis_url, decode_responses=False) if redis_url else None

# client = redis.Redis(
#     host=env.get("REDIS_HOST", "localhost"),
#     port=int(env.get("REDIS_PORT", 6379)),
#     password=env.get("REDIS_PASSWORD", None),
#     decode_responses=True
# )

if client:
    print("Redis ping:", client.ping())  # Test the connection