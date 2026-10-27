"""Publishing gate and admin edits are enforced by the API, not just the UI."""

from fastapi.testclient import TestClient
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from auth.utils import create_access_token, hash_password, password_version
from db.database import Base, get_db
from db.models import ShowcaseDocument, User, UserRole
from main import app
from showcase.router import _window


def test_public_window_admin_controls_and_versions():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine)
    with sessions() as db:
        admin = User(username="docs_admin", hashed_password=hash_password("strong-admin-password"), role=UserRole.admin, is_active=True, must_change_password=False)
        manager = User(username="docs_manager", hashed_password=hash_password("strong-manager-password"), role=UserRole.facility_manager, is_active=True, must_change_password=False)
        db.add_all([admin, manager])
        db.commit()
        admin_token = create_access_token({"sub": admin.username, "role": admin.role.value, "pwd": password_version(admin.hashed_password)})
        manager_token = create_access_token({"sub": manager.username, "role": manager.role.value, "pwd": password_version(manager.hashed_password)})

    def test_db():
        with sessions() as db:
            yield db

    app.dependency_overrides[get_db] = test_db
    try:
        client = TestClient(app)
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        manager_headers = {"Authorization": f"Bearer {manager_token}"}

        assert client.get("/showcase/admin").status_code == 401
        assert client.get("/showcase/admin", headers=manager_headers).status_code == 403
        admin_state = client.get("/showcase/admin", headers=admin_headers).json()
        assert admin_state["enabled"] is True
        assert admin_state["version"] == 1
        assert admin_state["draft"]["team"] == []
        with sessions() as db:
            document = db.get(ShowcaseDocument, 1)
            assert not _window(document, datetime(2027, 6, 9, 0, 0, tzinfo=timezone.utc))
            assert _window(document, datetime(2027, 6, 11, 0, 0, tzinfo=timezone.utc))
            assert not _window(document, datetime(2027, 6, 15, 0, 0, tzinfo=timezone.utc))

        invalid = client.put("/showcase/admin/settings", headers=admin_headers, json={"enabled": True, "starts_at": "2027-06-15T00:00:00+06:00", "ends_at": "2027-06-14T00:00:00+06:00"})
        assert invalid.status_code == 422
        assert client.post("/showcase/admin/publish-for", headers=manager_headers, json={"hours": 1}).status_code == 403
        assert client.post("/showcase/admin/publish-for", headers=admin_headers, json={"hours": 1}).status_code == 200

        public = client.get("/showcase/public")
        assert public.status_code == 200, public.text
        assert public.headers["cache-control"].startswith("no-store")
        assert public.json()["live"]["metrics"]["user_accounts"] == 2
        assert any(route["path"] == "/forecast/{region}" for route in public.json()["live"]["api_routes"])
        assert public.json()["plugins"][0]["slug"] == "carbon-ledger"

        draft = admin_state["draft"]
        draft["sections"][0]["body"] = "Verified admin edit."
        draft["sections"][0]["body_html"] = '<p><strong>Verified admin edit.</strong><img src=x onerror=alert(1)><a href="javascript:alert(1)">unsafe link</a></p>'
        assert client.put("/showcase/admin/draft", headers=admin_headers, json=draft).status_code == 200
        assert public.json()["content"]["sections"][0]["body"] != "Verified admin edit."
        assert client.post("/showcase/admin/publish", headers=admin_headers).json()["version"] == 2
        published_section = client.get("/showcase/public").json()["content"]["sections"][0]
        assert published_section["body"] == "Verified admin edit."
        assert "<strong>Verified admin edit.</strong>" in published_section["body_html"]
        assert "onerror" not in published_section["body_html"]
        assert "javascript:" not in published_section["body_html"]
        assert client.post("/showcase/admin/restore/1", headers=admin_headers).status_code == 200
        assert client.get("/showcase/admin", headers=admin_headers).json()["draft"]["sections"][0]["body"] != "Verified admin edit."

        assert client.put("/showcase/admin/settings", headers=admin_headers, json={"enabled": False}).status_code == 200
        assert client.get("/showcase/public").status_code == 403
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()
