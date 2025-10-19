from typing import Annotated
from typing_extensions import TypedDict
from pydantic import BaseModel, Field
from langchain.schema import SystemMessage
from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import InMemorySaver

from rag.config import llm, llm_pro
from rag.tools.code_sandbox import code_interpreter
from rag.tools.files_generation import generate_image
from rag.tools.satellites import get_satellite_position, get_tle
from langchain_tavily import TavilySearch

import os
from dotenv import load_dotenv
load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_HOST = os.getenv("POSTGRES_HOST")
POSTGRES_PORT = os.getenv("POSTGRES_PORT")
POSTGRES_DB = os.getenv("POSTGRES_DB")

checkpointer = InMemorySaver()


## TOOLS
tools = [TavilySearch(name="web_search", max_results=7), get_satellite_position, get_tle, code_interpreter, generate_image]
tools_expert = [TavilySearch(name="web_search", max_results=16), code_interpreter]

## Prompts
system_prompt_content = open("src/docs/GEMINI_SYSTEM_PROMPT.md").read()


class State(TypedDict):
    messages: Annotated[list, add_messages]
    reasoning_tasks: Annotated[list[str], Field(default_factory=list)]

class Classification(BaseModel):
    sentiment: str = Field(description="The sentiment of the text")
    reasoning_tasks: list[str] = Field(description="List of advanced reasoning tasks to perform to answer the user's question")


graph_builder = StateGraph(State)
llm_with_tools = llm.bind_tools(tools)
llmpro_with_tools = llm_pro.bind_tools(tools_expert)



def chatbot(state: State):
    system = [SystemMessage(content=system_prompt_content)]
    #print("system:", system, flush=True)
    return {"messages": [llm_with_tools.invoke(system + state["messages"])]}

def reasoning_agent(state: State):
    system = [SystemMessage(content="You are a reasoning agent. You must think step by step to find the best answer.")]
    return {"messages": [llmpro_with_tools.invoke(system + state["messages"])]}



graph_builder.add_node("generation_task", chatbot)
graph_builder.add_node("reasoning_task", reasoning_agent)
tool_node = ToolNode(tools=tools)
# tool_exp_node = ToolNode(tools=tools_expert)
graph_builder.add_node("tools", tool_node)
# graph_builder.add_node("tools_expert", tool_exp_node)

## Graph structure
graph_builder.add_conditional_edges("generation_task", tools_condition)
graph_builder.add_edge("tools", "generation_task")
graph_builder.add_edge(START, "generation_task")
graph = graph_builder.compile(
    checkpointer=checkpointer
    # interrupt_before=["tools"], # TODO: man-in-the-loop for user validation
)