"""Bounded Copilot HTTP interface; the MCP transport runs separately over stdio."""
import logging
from typing import Literal

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from auth.utils import get_current_user
from db.database import get_db
from db.models import User, UserRole
from .copilot_service import TOOL_DECLARATIONS, chat_with_copilot
from .limits import limit_chat, slots

router = APIRouter(prefix="/copilot", tags=["AI Copilot"])
logger = logging.getLogger(__name__)


def get_optional_current_user(authorization: str | None = Header(default=None),
                              db: Session = Depends(get_db)) -> User | None:
    if authorization is None:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(401, "A valid Bearer token is required.")
    user = get_current_user(token=token, db=db)
    if user.must_change_password:
        raise HTTPException(403, "Change your password before using this feature.")
    return user


class ChatTurn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role: Literal["user", "model"]
    text: str = Field(min_length=1, max_length=2000)


class CopilotChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    message: str = Field(min_length=1, max_length=1000)
    role: Literal["facility_manager", "grid_operator", "admin"] | None = None
    conversation_history: list[ChatTurn] = Field(default_factory=list, max_length=6)


@router.post("/chat", summary="Query the Copilot with source-labelled demo tools")
async def copilot_chat_endpoint(body: CopilotChatRequest, request: Request,
                               current_user: User | None = Depends(get_optional_current_user)):
    identity = f"user:{current_user.id}" if current_user else f"ip:{request.client.host if request.client else 'unknown'}"
    limit_chat(identity, current_user is not None)
    if body.role == "admin" and (not current_user or current_user.role != UserRole.admin):
        raise HTTPException(403, "Admin perspective requires an administrator account.")
    role = body.role or (current_user.role.value if current_user else "facility_manager")
    if not slots.acquire(blocking=False):
        raise HTTPException(429, "Copilot is busy. Try again shortly.", headers={"Retry-After": "5"})
    try:
        return await chat_with_copilot(body.message, role,
                                       [turn.model_dump() for turn in body.conversation_history],
                                       allow_llm=current_user is not None)
    except Exception:
        logger.error("Copilot request failed; no request content or credentials logged.")
        raise HTTPException(503, "Copilot is temporarily unavailable. Please retry.")
    finally:
        slots.release()


@router.get("/tools", summary="List shared function tools; this endpoint is not an MCP transport")
def list_mcp_tools():
    return {"status": "success", "protocol": "HTTP tool catalog",
            "mcp_transport": "stdio (python -m agent.mcp_server from backend/)",
            "scope": "Read-only synthetic portfolio previews", "tools": TOOL_DECLARATIONS}
