from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition


from rag.config import llm
from rag.tools.basics import code_interpreter
from rag.tools.satellites import get_satellite_position, get_tle
from langchain_tavily import TavilySearch

from dotenv import load_dotenv
load_dotenv()


tools = [TavilySearch(max_results=2), get_satellite_position, get_tle, code_interpreter]



class State(TypedDict):
    messages: Annotated[list, add_messages]


graph_builder = StateGraph(State)
llm_with_tools = llm.bind_tools(tools)

def chatbot(state: State):
    return {"messages": [llm_with_tools.invoke(state["messages"])]}


graph_builder.add_node("chatbot", chatbot)
tool_node = ToolNode(tools=tools)
graph_builder.add_node("tools", tool_node)

graph_builder.add_conditional_edges("chatbot", tools_condition)
graph_builder.add_edge("tools", "chatbot")
graph_builder.add_edge(START, "chatbot")
graph = graph_builder.compile()