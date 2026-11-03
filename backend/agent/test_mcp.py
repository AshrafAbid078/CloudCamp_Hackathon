"""Exercise the actual MCP initialization, catalog and tool exchange over stdio."""
import asyncio
import os
import sys
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


def test_mcp_stdio_handshake_and_tool():
    async def check():
        server = StdioServerParameters(command=sys.executable,
            args=[str(Path(__file__).resolve().parents[1] / "run_mcp.py")], env=dict(os.environ))
        async with stdio_client(server) as (read, write):
            async with ClientSession(read, write) as session:
                initialized = await session.initialize()
                assert initialized.serverInfo.name == "Meridian Grid Optimizer"
                catalog = await session.list_tools()
                assert {tool.name for tool in catalog.tools} == {
                    "get_solar_forecast", "get_dispatch_schedule", "simulate_whatif", "explain_decision"}
                response = await session.call_tool("get_solar_forecast", {"horizon_hours": 1})
                assert not response.isError
                assert "archived_2020" in response.content[0].text
                invalid = await session.call_tool("get_solar_forecast", {"horizon_hours": 25})
                assert invalid.isError
    asyncio.run(check())
