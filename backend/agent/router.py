"""
backend/agent/router.py
=======================
FastAPI endpoints for the Meridian Grid AI Copilot & MCP Tools.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import User
from .copilot_service import TOOL_DECLARATIONS, chat_with_copilot

router = APIRouter(prefix="/copilot", tags=["AI Copilot"])


async def get_optional_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Resolves authenticated user if Bearer token is provided, or returns None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        from auth.utils import decode_token
        payload = decode_token(token)
        username = payload.get("sub")
        if not username:
            return None
        return db.query(User).filter(User.username == username, User.is_active == True).first()
    except Exception:
        return None


class CopilotChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="User prompt or question")
    role: Optional[str] = Field(default="facility_manager", description="Active role perspective")
    conversation_history: Optional[List[Dict[str, Any]]] = Field(
        default=None, description="Previous messages in the conversation"
    )


class CopilotChatResponse(BaseModel):
    status: str
    role: str
    reply: str
    tool_calls: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/chat", response_model=CopilotChatResponse, summary="Query the grounded AI Copilot")
async def copilot_chat_endpoint(
    body: CopilotChatRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Interacts with the Meridian Grid Copilot.
    Supports both anonymous demo mode and authenticated role-specific sessions.
    Uses Google Gemini with Model Context Protocol (MCP) tool execution.
    """
    effective_role = body.role or "facility_manager"
    if current_user and hasattr(current_user, "role") and not body.role:
        effective_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)

    try:
        response = await chat_with_copilot(
            message=body.message,
            role=effective_role,
            conversation_history=body.conversation_history,
        )
        return response
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Copilot inference error: {str(exc)}")


@router.get("/tools", summary="List exposed Model Context Protocol (MCP) tools")
def list_mcp_tools():
    """Returns the JSON schema of available MCP tools for LLM tool binding."""
    return {
        "status": "success",
        "protocol": "Model Context Protocol (MCP) 1.0",
        "tools": TOOL_DECLARATIONS,
    }
