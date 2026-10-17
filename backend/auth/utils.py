"""
auth/utils.py — Password Hashing, JWT Signing & FastAPI Dependencies
=====================================================================
Provides:
  - hash_password / verify_password (scrypt; existing short bcrypt hashes supported)
  - create_access_token / decode_token  (HS256 JWT via python-jose)
  - get_current_user  (FastAPI Depends — validates Bearer token)
  - require_role(*roles)  (FastAPI Depends factory — role guard)
"""

from datetime import datetime, timedelta, timezone
from typing import Sequence
import hashlib
import secrets

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from backend.config import settings
from backend.db.database import get_db
from backend.db.models import User, UserRole
from backend.auth.schemas import TokenData

# ------------------------------------------------------------------ #
# Password hashing                                                     #
# ------------------------------------------------------------------ #

def hash_password(plain: str) -> str:
    """Hash the full UTF-8 password using scrypt with a random 128-bit salt."""
    salt = secrets.token_bytes(16)
    key = hashlib.scrypt(plain.encode("utf-8"), salt=salt, n=16384, r=8, p=1, dklen=32)
    return f"scrypt$16384$8$1${salt.hex()}${key.hex()}"


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if *plain* matches *hashed*."""
    try:
        if hashed.startswith("scrypt$"):
            algorithm, n, r, p, salt, expected = hashed.split("$")
            if (n, r, p) != ("16384", "8", "1") or len(salt) != 32 or len(expected) != 64:
                return False
            key = hashlib.scrypt(plain.encode("utf-8"), salt=bytes.fromhex(salt), n=16384, r=8, p=1, dklen=32)
            return secrets.compare_digest(key.hex(), expected)
        # Existing short bcrypt passwords remain usable, without truncation.
        encoded = plain.encode("utf-8")
        return len(encoded) <= 72 and bcrypt.checkpw(encoded, hashed.encode("utf-8"))
    except (ValueError, TypeError):
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
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm], options={"require_exp": True, "require_sub": True})
        username: str | None = payload.get("sub")
        role_str: str | None = payload.get("role")
        if not isinstance(username, str) or not username.strip():
            raise credentials_exception
        role = UserRole(role_str)
        version = payload.get("ver", 0)
        if type(version) is not int or version < 0:
            raise ValueError("Invalid token version")
        return TokenData(username=username, role=role, version=version)
    except (JWTError, ValueError, TypeError):
        raise credentials_exception


# ------------------------------------------------------------------ #
# FastAPI OAuth2 scheme (reads Bearer token from Authorization header) #
# ------------------------------------------------------------------ #

_bearer_scheme = HTTPBearer(auto_error=False, description="Paste access_token from POST /auth/login (JSON username and password).")


# ------------------------------------------------------------------ #
# Current-user dependency                                              #
# ------------------------------------------------------------------ #

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency that resolves the Bearer token to a live User row.

    Raises 401 if the token is invalid.
    Raises 403 if the account is deactivated.
    """
    if credentials is None:
        raise HTTPException(status_code=401, detail="Bearer token required.", headers={"WWW-Authenticate": "Bearer"})
    token_data = decode_token(credentials.credentials)
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
    if token_data.version != user.token_version:
        raise HTTPException(status_code=401, detail="Token revoked. Log in again.", headers={"WWW-Authenticate": "Bearer"})
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
            raise HTTPException(status_code=403, detail="Change your password via PUT /auth/me/password before accessing this endpoint.")
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
