"""Trusted server-side extension point for public documentation cards.

Plugins are registered in application code, never uploaded or executed from
admin-authored content. Each returns a small JSON-compatible public snapshot.
"""

import json
import re
from collections.abc import Callable
from sqlalchemy.orm import Session

_REGISTRY: dict[str, tuple[str, Callable[[Session], dict]]] = {}


def register_showcase_plugin(slug: str, title: str, snapshot: Callable[[Session], dict]) -> None:
    if not re.fullmatch(r"[a-z][a-z0-9-]{1,39}", slug):
        raise ValueError("Plugin slug must be a short URL-safe identifier.")
    if not title.strip() or len(title) > 80 or slug in _REGISTRY:
        raise ValueError("Plugin title must be valid and slug unique.")
    _REGISTRY[slug] = (title, snapshot)


def public_plugin_snapshots(db: Session) -> list[dict]:
    cards = []
    for slug, (title, snapshot) in _REGISTRY.items():
        try:
            payload = snapshot(db)
            encoded = json.dumps(payload)
            if len(encoded) > 4000 or not isinstance(payload, dict):
                raise ValueError("Plugin snapshot is too large or not an object.")
            cards.append({"slug": slug, "title": title, "data": payload})
        except Exception:
            cards.append({"slug": slug, "title": title, "unavailable": True})
    return cards
