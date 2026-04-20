from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_siliconflow import ChatSiliconFlow

# from langchain_mistralai.chat_models import ChatMistralAI
from langchain_mistralai import MistralAIEmbeddings
from langchain_community.embeddings.spacy_embeddings import SpacyEmbeddings

from langchain_redis import RedisCache, RedisSemanticCache
# from langchain.globals import set_llm_cache
from models.cache_redis.client import client as redis_client

from dotenv import load_dotenv
from os import environ as env
load_dotenv()


# set_llm_cache(RedisCache(redis_client=redis_client, ttl=86400, prefix="llm_cache"))

### LLM CONFIGURATION ###
# llm = ChatGoogleGenerativeAI(
#     model="gemini-2.5-flash",
#     temperature=0.6,
#     max_tokens=7000,
#     timeout=None,
#     max_retries=2,
# )
llm = ChatSiliconFlow(
    model="zai-org/GLM-5V-Turbo",
    name="GLM-5V-Turbo",
    temperature=0.3,
)

llm_pro = ChatGoogleGenerativeAI(
    model="gemini-2.5-pro",
    temperature=0.3,
    max_tokens=2000,
    timeout=None,
    max_retries=2,
)

small_model_embeddings = SpacyEmbeddings(model_name="en_core_web_md")
model_embeddings = MistralAIEmbeddings(api_key=env.get("MISTRAL_API_KEY"))


# class SemanticCacheWrapper:
#     def __init__(self, inner):
#         self.inner = inner
#     def _llm_string(self, prompt: str) -> str:
#         return hashlib.sha256(prompt.encode("utf-8")).hexdigest()
#     def lookup(self, prompt: str):
#         llm_string = self._llm_string(prompt)
#         # many implementations expect (prompt, llm_string)
#         return self.inner.lookup(prompt, llm_string=llm_string)
#     def update(self, prompt: str, return_val):
#         llm_string = self._llm_string(prompt)
#         return self.inner.update(prompt, llm_string=llm_string, return_val=return_val)

# set_llm_cache(SemanticCacheWrapper(RedisSemanticCache(
#     prefix="semantic_cache",
#     # name=hashlib.sha256(question.encode('utf-8')).hexdigest(),
#     distance_threshold=0.1,
#     ttl=86400,
#     embeddings=model_embeddings,
#     redis_client=redis_client,
# )))

semantic_cache = RedisSemanticCache(
    name="semantic_cache",
    distance_threshold=0.2,
    ttl=86400,
    embeddings=model_embeddings,
    redis_client=redis_client,
)

# set_llm_cache(semantic_cache)