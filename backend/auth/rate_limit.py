"""Small single-process guard for public authentication requests.

The demo runs one API process. A shared store is needed before scaling to
multiple workers, where this in-memory limiter would be per process.
"""

from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, Request

_WINDOW_SECONDS = 60
_MAX_ATTEMPTS = 20
_lock = Lock()
_attempts: dict[tuple[str, str], deque[float]] = defaultdict(deque)


def limit_auth_request(request: Request, action: str) -> None:
    client = request.client.host if request.client else "unknown"
    key = (client, action)
    now = monotonic()
    with _lock:
        attempts = _attempts[key]
        while attempts and attempts[0] <= now - _WINDOW_SECONDS:
            attempts.popleft()
        if len(attempts) >= _MAX_ATTEMPTS:
            retry_after = max(1, int(_WINDOW_SECONDS - (now - attempts[0])) + 1)
            raise HTTPException(
                status_code=429,
                detail="Too many authentication attempts. Try again shortly.",
                headers={"Retry-After": str(retry_after)},
            )
        attempts.append(now)
