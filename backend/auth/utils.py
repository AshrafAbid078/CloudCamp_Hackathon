from __future__ import annotations
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
import hashlib
import hmac
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

# bcrypt only uses the first 72 bytes of a password; reject longer input.
_BCRYPT_MAX_BYTES = 72


def _to_bcrypt_bytes(plain: str) -> bytes:
    encoded = plain.encode("utf-8")
    if len(encoded) > _BCRYPT_MAX_BYTES:
        raise ValueError("Password exceeds 72 UTF-8 bytes.")
    return encoded


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


def password_version(hashed: str) -> str:
    """Opaque credential version for JWT invalidation without exposing the hash."""
    return hmac.new(settings.secret_key.encode(), hashed.encode(), hashlib.sha256).hexdigest()


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
    except (JWTError, ValueError):
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
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials.")
    if payload.get("pwd") != password_version(user.hashed_password) or token_data.role != user.role:
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again.")
    if user.must_change_password:
        # The password endpoint uses get_current_user, so it remains reachable.
        pass
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
        if current_user.must_change_password:
            raise HTTPException(status_code=403, detail="Change your password before using this feature.")
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
