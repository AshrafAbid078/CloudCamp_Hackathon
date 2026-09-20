"""
auth/router.py — Authentication & User Management Endpoints
===========================================================
Endpoints:
  POST   /auth/login                → get JWT access token
  GET    /auth/me                   → current user profile
  PUT    /auth/me/password          → change own password
  POST   /auth/register             → admin-only: create user
  GET    /auth/users                → admin-only: list all users
  DELETE /auth/users/{user_id}      → admin-only: deactivate user

Role hierarchy enforced via require_role() from auth.utils.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from config import settings
from db.database import get_db
from db.models import User, UserRole
from auth.schemas import LoginRequest, PasswordChange, Token, UserCreate, UserOut
from auth.utils import (
    create_access_token,
    get_current_user,
    hash_password,
    require_role,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


# ------------------------------------------------------------------ #
# POST /auth/login                                                      #
# ------------------------------------------------------------------ #

@router.post("/login", response_model=Token, summary="Obtain a JWT access token")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate with username + password and receive a signed JWT.

    The token must be sent as a **Bearer** header on all protected endpoints:
    ```
    Authorization: Bearer <token>
    ```
    Tokens expire after `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 60 min).
    """
    user = db.query(User).filter(User.username == body.username).first()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact an administrator.",
        )

    token = create_access_token({"sub": user.username, "role": user.role.value})
    return Token(
        access_token=token,
        token_type="bearer",
        expires_in_minutes=settings.access_token_expire_minutes,
        role=user.role,
        must_change_password=user.must_change_password,
    )


# ------------------------------------------------------------------ #
# GET /auth/me                                                          #
# ------------------------------------------------------------------ #

@router.get("/me", response_model=UserOut, summary="Get current user profile")
def get_me(current_user: User = Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    return current_user


# ------------------------------------------------------------------ #
# PUT /auth/me/password                                                 #
# ------------------------------------------------------------------ #

@router.put("/me/password", summary="Change your own password")
def change_password(
    body: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Change the authenticated user's password.
    - Requires the current password for verification.
    - Clears the `must_change_password` flag after success.
    """
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    current_user.hashed_password = hash_password(body.new_password)
    current_user.must_change_password = False
    db.commit()
    return {"detail": "Password updated successfully."}


# ------------------------------------------------------------------ #
# POST /auth/register  (admin only)                                    #
# ------------------------------------------------------------------ #

@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Create a new user",
)
def register(
    body: UserCreate,
    _admin: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    """
    Create a new user account. **Admin role required.**

    The new user will be created with `must_change_password=False`.
    Set to True manually if you want to force a first-login password change.
    """
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{body.username}' is already taken.",
        )

    user = User(
        username=body.username,
        hashed_password=hash_password(body.password),
        role=body.role,
        must_change_password=False,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ------------------------------------------------------------------ #
# GET /auth/users  (admin only)                                        #
# ------------------------------------------------------------------ #

@router.get(
    "/users",
    response_model=list[UserOut],
    summary="[Admin] List all users",
)
def list_users(
    _admin: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    """Return all registered users. **Admin role required.**"""
    return db.query(User).order_by(User.id).all()


# ------------------------------------------------------------------ #
# DELETE /auth/users/{user_id}  (admin only)                          #
# ------------------------------------------------------------------ #

@router.delete(
    "/users/{user_id}",
    summary="[Admin] Deactivate a user",
)
def deactivate_user(
    user_id: int,
    current_admin: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    """
    Soft-delete a user by setting `is_active = False`. **Admin role required.**
    The user can no longer log in but their data is retained.
    Admins cannot deactivate themselves.
    """
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admins cannot deactivate their own account.",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User id={user_id} not found.",
        )

    user.is_active = False
    db.commit()
    return {"detail": f"User '{user.username}' has been deactivated."}
