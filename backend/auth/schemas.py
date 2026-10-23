"""
auth/schemas.py — Pydantic Request/Response Models for Auth
============================================================
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

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
    password: str = Field(..., min_length=8, max_length=72)
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

    @field_validator("password")
    @classmethod
    def password_bytes(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password exceeds 72 UTF-8 bytes.")
        return value


class PublicSignup(BaseModel):
    """Public accounts always receive the facility-manager role."""
    username: str = Field(..., min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_.-]+$")
    password: str = Field(..., min_length=8, max_length=72)
    model_config = {"extra": "forbid"}

    @field_validator("password")
    @classmethod
    def password_bytes(cls, value: str) -> str:
        return UserCreate.password_bytes(value)


class PasswordChange(BaseModel):
    """Used by PUT /auth/me/password — current user changes their own password."""
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=72)

    @field_validator("new_password")
    @classmethod
    def password_bytes(cls, value: str) -> str:
        return UserCreate.password_bytes(value)


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
