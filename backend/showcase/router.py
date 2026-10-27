"""Public showcase content and admin publishing controls for frontend /docs."""

import json
import bleach
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth.utils import require_role
from db.database import get_db
from db.models import (
    CarbonSnapshot, DispatchPlanDecision, DispatchPlanRecord, ShowcaseDocument,
    ShowcaseVersion, User, UserRole,
)
from showcase.plugins import public_plugin_snapshots, register_showcase_plugin

router = APIRouter(prefix="/showcase", tags=["Showcase docs"])


def _carbon_ledger_plugin(db: Session) -> dict:
    latest = db.query(CarbonSnapshot).order_by(CarbonSnapshot.polled_at.desc()).first()
    return {"latest_recorded_at": latest.polled_at.isoformat() if latest else None,
            "source": latest.source if latest else "No polled reading yet"}


register_showcase_plugin("carbon-ledger", "Carbon ledger", _carbon_ledger_plugin)
_DHAKA = timezone(timedelta(hours=6))
DEFAULT_START = datetime(2027, 6, 10, 0, 0, tzinfo=_DHAKA)
DEFAULT_END = datetime(2027, 6, 14, 23, 59, 59, tzinfo=_DHAKA)


class Section(BaseModel):
    id: str = Field(pattern=r"^[a-z][a-z0-9-]{1,49}$")
    title: str = Field(min_length=2, max_length=100)
    group: Literal["pitch", "technical"]
    body: str = Field(max_length=10000)
    body_html: str | None = Field(default=None, max_length=20000)

    @field_validator("body_html")
    @classmethod
    def sanitize_rich_text(cls, value: str | None) -> str | None:
        if not value:
            return None
        return bleach.clean(
            value,
            tags={"p", "div", "br", "strong", "b", "em", "i", "ul", "ol", "li", "a", "code"},
            attributes={"a": ["href"]},
            protocols={"https", "http", "mailto"},
            strip=True,
        )


class TeamMember(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    role: str = Field(min_length=2, max_length=100)
    email: str = Field(pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$", max_length=254)
    photo_url: str | None = Field(default=None, max_length=500)

    @field_validator("photo_url")
    @classmethod
    def safe_photo_url(cls, value: str | None) -> str | None:
        if value and not (value.startswith("https://") or value.startswith("/")):
            raise ValueError("Photo must use HTTPS or a local path.")
        if value and value.startswith("//"):
            raise ValueError("Protocol-relative URLs are not allowed.")
        return value


class Content(BaseModel):
    team_name: str = Field(default="", max_length=100)
    team: list[TeamMember] = Field(default_factory=list, max_length=30)
    sections: list[Section] = Field(min_length=1, max_length=60)
    architecture_nodes: list[str] = Field(default_factory=lambda: ["Next.js UI", "FastAPI", "Forecast + dispatch", "SQLite"], min_length=2, max_length=8)
    data_flow_nodes: list[str] = Field(default_factory=lambda: ["Regional + synthetic inputs", "Forecast", "PuLP optimization", "Reviewable plan", "Human decision"], min_length=2, max_length=8)

    @field_validator("architecture_nodes", "data_flow_nodes")
    @classmethod
    def check_nodes(cls, nodes: list[str]) -> list[str]:
        if any(not node.strip() or len(node) > 80 for node in nodes):
            raise ValueError("Diagram nodes must contain 1–80 characters.")
        return nodes

    @model_validator(mode="after")
    def unique_sections(self):
        ids = [section.id for section in self.sections]
        if len(ids) != len(set(ids)):
            raise ValueError("Section IDs must be unique.")
        return self


class SettingsUpdate(BaseModel):
    enabled: bool
    starts_at: datetime | None = None
    ends_at: datetime | None = None

    @model_validator(mode="after")
    def valid_window(self):
        for value in (self.starts_at, self.ends_at):
            if value is not None and value.tzinfo is None:
                raise ValueError("Publishing dates must include a timezone.")
        if self.starts_at and self.ends_at and self.starts_at >= self.ends_at:
            raise ValueError("End must be after start.")
        return self


class DurationUpdate(BaseModel):
    hours: int = Field(ge=1, le=24 * 90)


def _section(id: str, title: str, group: str, body: str) -> dict:
    return {"id": id, "title": title, "group": group, "body": body}


DEFAULT_CONTENT = Content.model_validate({
    "team": [],
    "sections": [
        _section("problem", "Problem", "pitch", "Factory managers must schedule flexible processes and batteries while solar and grid conditions change. Fixed schedules make cost, carbon, peak demand, and production deadlines hard to compare."),
        _section("solution", "Solution", "pitch", "Meridian Grid produces a regional solar outlook and a feasible dispatch plan for synthetic industrial processes and batteries. It compares modeled cost and emissions with a run-immediately baseline."),
        _section("why-now", "Why now", "pitch", "Industrial energy decisions face growing pressure from cost and decarbonization. Regional weather and carbon data are increasingly accessible, making a planning prototype practical to test."),
        _section("product-demo", "Product demo", "pitch", "Sign in to inspect the forecast, compare a dispatch plan, change a scenario, and record a review decision. All displayed facility assets are synthetic. Decisions do not control equipment."),
        _section("market", "Market opportunity", "pitch", "Initial users are managers of garment and cold-storage facilities in Bangladesh. Expansion to other regions and asset types is a product hypothesis, not a validated market size or active deployment."),
        _section("business-model", "Business model", "pitch", "Potential future model: subscription software for facilities, with integration and multi-site planning tiers. Pricing and willingness to pay have not been validated."),
        _section("traction", "Traction", "pitch", "Working prototype and internal demo only. No customer pilots, revenue, or measured site savings are claimed."),
        _section("competition", "Competition", "pitch", "Facilities may use manual scheduling, monitoring dashboards, or enterprise energy-management tools. Meridian Grid's proposed advantage is a focused forecast-to-decision workflow for flexible loads and batteries; competitive performance remains to be validated."),
        _section("advantage", "Unique advantage", "pitch", "A single workflow links regional data, constrained optimization, and reviewable results. The prototype makes input provenance and modeled assumptions visible."),
        _section("go-to-market", "Go to market", "pitch", "Next step: interview facility operators, obtain permissioned site data, and run a supervised pilot before any operational integration."),
        _section("vision", "Vision", "pitch", "Help people plan flexible energy use across sites and regions with transparent inputs and constraints. A conversational explainer and broader asset adapters are future work."),
        _section("overview", "Product overview", "technical", "A Next.js workspace presents Bangladesh-focused forecast, dispatch, scenario comparison, and run review. FastAPI provides authenticated forecast and optimization services."),
        _section("feature-matrix", "Feature matrix", "technical", "See the live feature status panel below for current service and data availability. Planned items are separately labelled."),
        _section("architecture", "Architecture", "technical", "The interface calls FastAPI. Forecasting selects current regional weather when available or a labelled archive fallback. PuLP schedules synthetic processes and batteries; SQLite stores users, run history, decisions, and carbon snapshots."),
        _section("data-flow", "Data flow", "technical", "Regional and synthetic inputs feed forecast and constrained optimization. The UI shows a proposed plan and baseline comparison. A human may save or review a plan; there is no equipment actuation or automatic feedback control."),
        _section("stack", "Technology stack", "technical", "Frontend: Next.js, React, TypeScript, Tailwind. Backend: FastAPI, Python, SQLAlchemy, SQLite. Optimization: PuLP. The saved LightGBM solar artifact is disabled in the current runtime pending compatibility validation."),
        _section("api", "API documentation", "technical", "The live endpoint inventory below is derived from registered FastAPI routes. Protected endpoints use bearer JWT authentication; admin functions require the admin role."),
        _section("data-layer", "Data layer", "technical", "Open-Meteo supplies current regional weather when reachable. Historical NREL/NOAA inputs and archived carbon data support fallback and experimentation. Electricity Maps carbon data is available when configured. Facility assets and tariffs are synthetic. No scraper or real facility telemetry is connected."),
        _section("ai-layer", "AI layer", "technical", "Forecasting uses current regional weather or a persistence fallback. The dispatch solver is mathematical optimization. An offline LightGBM experiment exists, but its artifact is disabled at runtime. No active LLM copilot, RAG, GraphRAG, or MCP server is in this build."),
        _section("roadmap", "Product roadmap", "technical", "Short term: validate data freshness and solver behavior. Mid term: permissioned facility pilot and explainable plan review. Long term: broader assets, regions, and a grounded conversational assistant, subject to validation."),
        _section("performance", "Performance & scalability", "technical", "The current build is a local prototype using SQLite and synthetic assets. It has not completed production load testing. Multi-tenant authorization, database migration, monitoring, and capacity testing are needed before wider deployment."),
        _section("security", "Security", "technical", "JWT sign-in and role checks protect application endpoints. The documentation editor is admin-only. Public documentation exposes aggregate counts, not user identities. Demo plan decisions do not control physical assets."),
        _section("analytics", "Analytics", "technical", "The live panel reports database counts and latest timestamps for users, saved plans, decisions, and carbon snapshots. These are application activity counts, not customer traction or impact."),
        _section("team", "Team & contributors", "technical", "Team members are shown only after an admin adds their verified name, role, email, and optional photo."),
        _section("changelog", "Changelog", "technical", "Publication history below records each admin-published version of this documentation."),
    ],
}).model_dump()


def _document(db: Session) -> ShowcaseDocument:
    doc = db.get(ShowcaseDocument, 1)
    if doc is None:
        doc = ShowcaseDocument(
            id=1, enabled=True, starts_at=DEFAULT_START, ends_at=DEFAULT_END,
            draft_json=json.dumps(DEFAULT_CONTENT), published_json=json.dumps(DEFAULT_CONTENT),
            version=1,
        )
        db.add(doc)
        db.add(ShowcaseVersion(version=1, content_json=json.dumps(DEFAULT_CONTENT), published_by="system"))
        db.commit()
        db.refresh(doc)
    return doc


def _window(doc: ShowcaseDocument, now: datetime) -> bool:
    return bool(doc.enabled and doc.published_json and (doc.starts_at is None or now >= doc.starts_at) and (doc.ends_at is None or now <= doc.ends_at))


def _live_state(db: Session, app) -> dict:
    from dispatch.api import _ALL_BATTERIES, _ALL_PROCESSES
    from forecasting.router import _accuracy

    routes = []
    # OpenAPI expands included routers in the installed FastAPI version.
    for path, operations in app.openapi()["paths"].items():
        if path.startswith(("/auth", "/forecast", "/dispatch", "/data", "/health")):
            for method in sorted(set(operations) & {"get", "post", "put", "patch", "delete"}):
                access = "JWT"
                if path in ("/auth/login", "/auth/signup", "/health"):
                    access = "public"
                elif path.startswith("/auth/users") or path == "/auth/register":
                    access = "admin"
                elif path == "/dispatch/history":
                    access = "operator / admin"
                routes.append({"method": method.upper(), "path": path,
                               "summary": operations[method].get("summary", ""),
                               "auth": access})
    latest = db.query(CarbonSnapshot).order_by(CarbonSnapshot.polled_at.desc()).first()
    plans = db.query(DispatchPlanRecord).order_by(DispatchPlanRecord.created_at.desc()).limit(5).all()
    decisions = db.query(DispatchPlanDecision).order_by(DispatchPlanDecision.decided_at.desc()).limit(5).all()
    events = sorted(
        [{"type": "Plan saved", "at": p.created_at.isoformat()} for p in plans]
        + [{"type": "Plan reviewed", "at": d.decided_at.isoformat()} for d in decisions],
        key=lambda event: event["at"], reverse=True,
    )[:5]
    return {
        "as_of": datetime.now(timezone.utc).isoformat(),
        "features": [
            {"name": "Forecast endpoint", "status": "implemented", "detail": f"Archive fallback model: {_accuracy['model']}; live source availability varies"},
            {"name": "Industrial dispatch", "status": "implemented" if _ALL_PROCESSES else "unavailable", "detail": f"{len(_ALL_PROCESSES)} synthetic processes loaded"},
            {"name": "Battery dispatch", "status": "implemented" if _ALL_BATTERIES else "unavailable", "detail": f"{len(_ALL_BATTERIES)} synthetic batteries loaded"},
            {"name": "Conversational copilot", "status": "planned", "detail": "No runtime LLM service"},
            {"name": "MCP integration", "status": "planned", "detail": "No server or client in this build"},
            {"name": "EV fleet adapter", "status": "planned", "detail": "Interface only"},
            {"name": "Permissioned facility pilot", "status": "upcoming", "detail": "No real-site pilot yet"},
        ],
        "metrics": {
            "user_accounts": db.query(func.count(User.id)).scalar() or 0,
            "saved_plans": db.query(func.count(DispatchPlanRecord.id)).scalar() or 0,
            "review_decisions": db.query(func.count(DispatchPlanDecision.run_id)).scalar() or 0,
            "carbon_snapshots": db.query(func.count(CarbonSnapshot.id)).scalar() or 0,
            "latest_carbon_snapshot_at": latest.polled_at.isoformat() if latest else None,
        },
        "api_routes": routes,
        "events": events,
    }


def _no_store(response: Response) -> None:
    response.headers["Cache-Control"] = "no-store, private"


@router.get("/public")
def public_showcase(request: Request, response: Response, db: Session = Depends(get_db)):
    _no_store(response)
    doc = _document(db)
    if not _window(doc, datetime.now(timezone.utc)):
        raise HTTPException(status_code=403, detail="Documentation is not available in this publishing window.", headers={"Cache-Control": "no-store"})
    versions = db.query(ShowcaseVersion).order_by(ShowcaseVersion.version.desc()).limit(10).all()
    return {"content": json.loads(doc.published_json), "version": doc.version,
            "versions": [{"version": v.version, "published_at": v.published_at.isoformat()} for v in versions],
            "live": _live_state(db, request.app), "plugins": public_plugin_snapshots(db)}


@router.get("/admin")
def admin_showcase(response: Response, db: Session = Depends(get_db), _: User = Depends(require_role(UserRole.admin))):
    _no_store(response)
    doc = _document(db)
    return {"enabled": doc.enabled, "starts_at": doc.starts_at, "ends_at": doc.ends_at,
            "visible_now": _window(doc, datetime.now(timezone.utc)), "draft": json.loads(doc.draft_json),
            "published": json.loads(doc.published_json) if doc.published_json else None,
            "version": doc.version,
            "versions": [{"version": v.version, "published_by": v.published_by, "published_at": v.published_at} for v in db.query(ShowcaseVersion).order_by(ShowcaseVersion.version.desc()).limit(20).all()]}


@router.put("/admin/settings")
def update_settings(body: SettingsUpdate, db: Session = Depends(get_db), _: User = Depends(require_role(UserRole.admin))):
    doc = _document(db)
    doc.enabled, doc.starts_at, doc.ends_at = body.enabled, body.starts_at, body.ends_at
    doc.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"enabled": doc.enabled, "starts_at": doc.starts_at, "ends_at": doc.ends_at, "visible_now": _window(doc, datetime.now(timezone.utc))}


@router.post("/admin/publish-for")
def publish_for(body: DurationUpdate, db: Session = Depends(get_db), _: User = Depends(require_role(UserRole.admin))):
    doc = _document(db)
    now = datetime.now(timezone.utc)
    doc.enabled, doc.starts_at, doc.ends_at = True, now, now + timedelta(hours=body.hours)
    doc.updated_at = now
    db.commit()
    return {"starts_at": doc.starts_at, "ends_at": doc.ends_at, "visible_now": True}


@router.put("/admin/draft")
def save_draft(body: Content, db: Session = Depends(get_db), _: User = Depends(require_role(UserRole.admin))):
    doc = _document(db)
    doc.draft_json = body.model_dump_json()
    doc.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"saved": True}


@router.post("/admin/publish")
def publish(db: Session = Depends(get_db), user: User = Depends(require_role(UserRole.admin))):
    doc = _document(db)
    content = Content.model_validate_json(doc.draft_json)
    doc.version += 1
    doc.published_json = content.model_dump_json()
    doc.updated_at = datetime.now(timezone.utc)
    db.add(ShowcaseVersion(version=doc.version, content_json=doc.published_json, published_by=user.username))
    db.commit()
    return {"version": doc.version, "visible_now": _window(doc, datetime.now(timezone.utc))}


@router.post("/admin/restore/{version}")
def restore(version: int, db: Session = Depends(get_db), _: User = Depends(require_role(UserRole.admin))):
    snapshot = db.query(ShowcaseVersion).filter(ShowcaseVersion.version == version).first()
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Version not found.")
    doc = _document(db)
    doc.draft_json = snapshot.content_json
    doc.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"restored_to_draft": version}
