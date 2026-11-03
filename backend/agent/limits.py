"""Single-process demo limits. Use a shared limiter before adding API workers."""
from collections import OrderedDict, deque
from datetime import datetime, timezone
from threading import BoundedSemaphore, Lock
from time import monotonic

from fastapi import HTTPException
from config import settings

_lock = Lock()
_requests: OrderedDict[str, deque[float]] = OrderedDict()
_paid_day = ""
_paid_calls = 0
slots = BoundedSemaphore(2)


def limit_chat(identity: str, authenticated: bool) -> None:
    now = monotonic()
    with _lock:
        attempts = _requests.pop(identity, deque())
        while attempts and attempts[0] <= now - 60:
            attempts.popleft()
        _requests[identity] = attempts
        while len(_requests) > 4096:
            _requests.popitem(last=False)
        if len(attempts) >= (20 if authenticated else 6):
            raise HTTPException(429, "Copilot request limit reached. Try again shortly.",
                                headers={"Retry-After": str(max(1, int(60 - now + attempts[0])))})
        attempts.append(now)


def reserve_model_call() -> bool:
    global _paid_day, _paid_calls
    today = datetime.now(timezone.utc).date().isoformat()
    with _lock:
        if today != _paid_day:
            _paid_day, _paid_calls = today, 0
        if _paid_calls >= settings.copilot_daily_model_calls:
            return False
        _paid_calls += 1
        return True
