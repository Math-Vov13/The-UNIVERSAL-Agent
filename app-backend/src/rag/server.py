from typing import Annotated
from typing_extensions import TypedDict
import requests, json
from langchain.schema import SystemMessage
from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition


from rag.config import llm
from rag.tools.code_sandbox import code_interpreter
from rag.tools.satellites import get_satellite_position, get_tle
from langchain_tavily import TavilySearch

from os import environ as env
from dotenv import load_dotenv
load_dotenv()


tools = [TavilySearch(name="web_search", max_results=7), get_satellite_position, get_tle, code_interpreter]
system_prompt_content = open("src/docs/GEMINI_SYSTEM_PROMPT.md").read().encode("utf-8")


class State(TypedDict):
    messages: Annotated[list, add_messages]


graph_builder = StateGraph(State)
llm_with_tools = llm.bind_tools(tools)

def chatbot(state: State):
    system = [SystemMessage(content=system_prompt_content.decode("utf-8"))]
    #print("system:", system, flush=True)
    return {"messages": [llm_with_tools.invoke(system + state["messages"])]}


def generate_image(state: State):
    url = "https://modelslab.com/api/v7/images/text-to-image"

    headers = {
        "Content-Type": "application/json"
    }

    data = {
        "prompt": "Ultra-realistic image of a professional office man in smart business attire, standing at the front of a modern conference room, giving a presentation to colleagues seated around a table. A large screen behind him displays charts and graphs, while attendees listen attentively with laptops and notebooks open. Bright daylight shines through tall glass windows, city skyline in the background, cinematic corporate atmosphere, hyper-detailed, 8K UHD, professional business setting",
        "model_id": "imagen-4.0-fast-generate",
        "aspect_ratio": "1:1",
        "key": env.get("MODELSLAB_API_KEY")
    }

    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()  # Raises an HTTPError for bad responses (4XX or 5XX)
        result = response.json()
        print("API Response:")
        print(json.dumps(result, indent=2))
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err} - {response.text}")
    except Exception as err:
        print(f"Other error occurred: {err}")
    finally:
        print("Request completed.")
        # return {"messages": [llm_with_tools.invoke(state["messages"] + [SystemMessage(content="Here is the image you requested: " + result.get("image_url", "No image URL found in response."))])]}


graph_builder.add_node("chatbot", chatbot)
graph_builder.add_node("generate_image", generate_image)
tool_node = ToolNode(tools=tools)
graph_builder.add_node("tools", tool_node)

graph_builder.add_conditional_edges("chatbot", tools_condition)
graph_builder.add_edge("tools", "chatbot")
graph_builder.add_edge(START, "chatbot")
graph = graph_builder.compile()