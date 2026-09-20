"""
auth/schemas.py — Pydantic Request/Response Models for Auth
============================================================
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from db.models import UserRole


# ------------------------------------------------------------------ #
# Request bodies                                                       #
# ------------------------------------------------------------------ #

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=64)
    password: str = Field(..., min_length=1)

    model_config = {"json_schema_extra": {"example": {"username": "admin", "password": "admin123"}}}


class UserCreate(BaseModel):
    """Admin-only: create a new user account."""
    username: str = Field(..., min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_.-]+$")
    password: str = Field(..., min_length=8, max_length=128)
    role: UserRole = UserRole.facility_manager

    model_config = {
        "json_schema_extra": {
            "example": {
                "username": "grid_op_01",
                "password": "securepassword",
                "role": "grid_operator",
            }
        }
    }


class PasswordChange(BaseModel):
    """Used by PUT /auth/me/password — current user changes their own password."""
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)


# ------------------------------------------------------------------ #
# Response models                                                      #
# ------------------------------------------------------------------ #

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    role: UserRole
    must_change_password: bool


class UserOut(BaseModel):
    """Safe user representation — never exposes hashed_password."""
    id: int
    username: str
    role: UserRole
    is_active: bool
    must_change_password: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenData(BaseModel):
    """Claims decoded from a valid JWT."""
    username: Optional[str] = None
    role: Optional[UserRole] = None
