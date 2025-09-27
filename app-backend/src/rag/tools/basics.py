from langchain_core.tools import tool


### TOOLS ###
# @tool
# def get_current_weather(location: str, unit: str = "celsius") -> str:
#     """Get the current weather in a given location"""
#     # Dummy implementation for illustration
#     return f"The current weather in {location} is 25 degrees {unit} with clear skies."


# @tool
# async def fetch_url(url: str) -> str:
#     """Fetch the content of a URL"""
#     import aiohttp

#     async with aiohttp.ClientSession() as session:
#         async with session.get(url) as response:
#             return await response.text()


@tool
def code_interpreter(code: str) -> str:
    """Execute a piece of Python code and return the result"""
    try:
        # Warning: Using eval can be dangerous. This is for illustration only.
        result = eval(code)
        return str(result)
    except Exception as e:
        return f"Error executing code: {str(e)}"