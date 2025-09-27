from langchain_core.tools import tool
import os
from dotenv import load_dotenv
load_dotenv()

@tool
async def get_tle(norad_id: int) -> str:
    """Fetch the latest TLE data for a given satellite by its NORAD ID."""
    import aiohttp

    url = f"https://celestrak.com/NORAD/elements/gp.php?CATNR={norad_id}&FORMAT=tle"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                tle_data = await response.text()
                return tle_data.strip()
            else:
                return f"Error fetching TLE data: {response.status}"

@tool
async def get_satellite_position(norad_id: int, observer_lat: float, observer_lon: float, observer_alt: float) -> str:
    """Fetch the current position of a satellite given its NORAD ID and observer's location."""
    import aiohttp

    url = f"https://api.n2yo.com/rest/v1/satellite/positions/{norad_id}/{observer_lat}/{observer_lon}/{observer_alt}/2/&apiKey=" + os.getenv("N2YO_API_KEY")
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                if "positions" in data and len(data["positions"]) > 0:
                    position = data["positions"][0]
                    return f"Latitude: {position['satlatitude']}, Longitude: {position['satlongitude']}, Altitude: {position['sataltitude']} km"
                else:
                    return "No position data available."
            else:
                return f"Error fetching satellite position: {response.status}"