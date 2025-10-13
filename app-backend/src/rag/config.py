from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()


### LLM CONFIGURATION ###
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.6,
    max_tokens=7000,
    timeout=None,
    max_retries=2,
)

llm_pro = ChatGoogleGenerativeAI(
    model="gemini-2.5-pro",
    temperature=0.3,
    max_tokens=2000,
    timeout=None,
    max_retries=2,
)