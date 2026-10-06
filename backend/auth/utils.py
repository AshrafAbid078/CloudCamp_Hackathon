"""
auth/utils.py — Password Hashing, JWT Signing & FastAPI Dependencies
=====================================================================
Provides:
  - hash_password / verify_password  (bcrypt, used directly)
  - create_access_token / decode_token  (HS256 JWT via python-jose)
  - get_current_user  (FastAPI Depends — validates Bearer token)
  - require_role(*roles)  (FastAPI Depends factory — role guard)
"""

from datetime import datetime, timedelta, timezone
from typing import Sequence

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from config import settings
from db.database import get_db
from db.models import User, UserRole
from auth.schemas import TokenData

# ------------------------------------------------------------------ #
# Password hashing                                                     #
# ------------------------------------------------------------------ #

# bcrypt only uses the first 72 bytes of a password; bcrypt>=5 raises on longer
# input, so we truncate explicitly (same effective behaviour as older versions).
_BCRYPT_MAX_BYTES = 72


def _to_bcrypt_bytes(plain: str) -> bytes:
    return plain.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(plain: str) -> str:
    """Return a bcrypt hash of *plain*."""
    return bcrypt.hashpw(_to_bcrypt_bytes(plain), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if *plain* matches *hashed*."""
    try:
        return bcrypt.checkpw(_to_bcrypt_bytes(plain), hashed.encode("utf-8"))
    except ValueError:
        # Malformed stored hash — treat as a failed login rather than a 500.
        return False


# ------------------------------------------------------------------ #
# JWT creation & decoding                                              #
# ------------------------------------------------------------------ #

def create_access_token(data: dict) -> str:
    """
    Sign a JWT containing *data* plus an 'exp' claim.
    Lifetime is controlled by settings.access_token_expire_minutes.
    """
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload["exp"] = expire
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> TokenData:
    """
    Decode and validate a JWT.
    Raises HTTPException 401 if the token is invalid or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str | None = payload.get("sub")
        role_str: str | None = payload.get("role")
        if username is None:
            raise credentials_exception
        role = UserRole(role_str) if role_str else None
        return TokenData(username=username, role=role)
    except JWTError:
        raise credentials_exception


# ------------------------------------------------------------------ #
# FastAPI OAuth2 scheme (reads Bearer token from Authorization header) #
# ------------------------------------------------------------------ #

_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ------------------------------------------------------------------ #
# Current-user dependency                                              #
# ------------------------------------------------------------------ #

def get_current_user(
    token: str = Depends(_oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency that resolves the Bearer token to a live User row.

    Raises 401 if the token is invalid.
    Raises 403 if the account is deactivated.
    """
    token_data = decode_token(token)
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact an administrator.",
        )
    return user


# ------------------------------------------------------------------ #
# Role-guard dependency factory                                        #
# ------------------------------------------------------------------ #

def require_role(*roles: UserRole):
    """
    Returns a FastAPI dependency that allows the request only if the
    authenticated user holds one of the listed roles.

    Usage:
        @router.get("/admin-only")
        def handler(user: User = Depends(require_role(UserRole.admin))):
            ...

        @router.get("/operators-and-admins")
        def handler(user: User = Depends(require_role(UserRole.grid_operator, UserRole.admin))):
            ...
    """
    allowed: Sequence[UserRole] = roles

    def _guard(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access denied. Required role(s): "
                    f"{', '.join(r.value for r in allowed)}. "
                    f"Your role: {current_user.role.value}."
                ),
            )
        return current_user

    return _guard
