"""Portable stdio entry point: python backend/run_mcp.py from the repository root."""
from agent.mcp_server import mcp

if __name__ == "__main__":
    mcp.run()
