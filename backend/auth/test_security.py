from datetime import datetime, timedelta, timezone

import bcrypt
import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.auth.router import router
from backend.auth.utils import decode_token, hash_password, verify_password
from backend.config import Settings, settings
from backend.db.database import Base, get_db
from backend.db.models import User, UserRole


@pytest.mark.parametrize("suffix", ["a", "ব"])
def test_password_suffix_is_significant(suffix):
    prefix = "x" * 72
    hashed = hash_password(prefix + suffix)
    assert verify_password(prefix + suffix, hashed)
    assert not verify_password(prefix + "z", hashed)
    assert not verify_password(prefix, hashed)


def test_legacy_bcrypt_remains_usable_without_truncation():
    hashed = bcrypt.hashpw(b"old-password", bcrypt.gensalt()).decode()
    assert verify_password("old-password", hashed)
    assert not verify_password("x" * 80, hashed)


@pytest.mark.parametrize("claims", [
    {"sub": "admin", "role": "admin"},
    {"sub": "admin", "role": "wrong", "exp": 9999999999},
    {"sub": "admin", "role": None, "exp": 9999999999},
    {"sub": "", "role": "admin", "exp": 9999999999},
    {"sub": "admin", "role": "admin", "exp": 0},
    {"sub": "admin", "role": "admin", "exp": 9999999999, "ver": "0"},
])
def test_invalid_claims_always_return_401(claims):
    token = jwt.encode(claims, settings.secret_key, algorithm="HS256")
    with pytest.raises(HTTPException) as caught:
        decode_token(token)
    assert caught.value.status_code == 401


def test_no_published_signing_secret():
    first = Settings(_env_file=None, secret_key="", environment="development")
    second = Settings(_env_file=None, secret_key="", environment="development")
    assert len(first.secret_key) >= 32 and first.secret_key != second.secret_key
    with pytest.raises(ValueError):
        Settings(_env_file=None, secret_key="", environment="production")
    with pytest.raises(ValueError):
        Settings(_env_file=None, secret_key="too short")
    token = jwt.encode({"sub": "admin", "role": "admin", "exp": 9999999999},
                       "CHANGE_ME_IN_PRODUCTION_USE_32_CHAR_RANDOM_STRING", algorithm="HS256")
    with pytest.raises(HTTPException):
        decode_token(token)


def test_json_login_swagger_password_change_and_revocation():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine)
    with factory() as db:
        db.add(User(username="admin", hashed_password=hash_password("admin123"),
                    role=UserRole.admin, must_change_password=True))
        db.commit()
    app = FastAPI()
    app.include_router(router)
    def session():
        with factory() as db:
            yield db
    app.dependency_overrides[get_db] = session
    with TestClient(app) as client:
        assert client.get("/auth/me").status_code == 401
        response = client.post("/auth/login", json={"username": "admin", "password": "admin123"})
        assert response.status_code == 200
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        assert client.get("/auth/me", headers=headers).status_code == 200
        assert client.get("/auth/users", headers=headers).status_code == 403
        change = client.put("/auth/me/password", headers=headers,
                            json={"current_password": "admin123", "new_password": "x" * 100})
        assert change.status_code == 200
        assert client.get("/auth/me", headers=headers).status_code == 401
        fresh = client.post("/auth/login", json={"username": "admin", "password": "x" * 100}).json()
        assert not fresh["must_change_password"]
        assert client.get("/auth/users", headers={"Authorization": f"Bearer {fresh['access_token']}"}).status_code == 200
        schemes = client.get("/openapi.json").json()["components"]["securitySchemes"]
        assert schemes["HTTPBearer"]["type"] == "http"
        assert schemes["HTTPBearer"]["scheme"] == "bearer"
    engine.dispose()
