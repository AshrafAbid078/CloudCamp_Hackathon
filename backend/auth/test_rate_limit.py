from fastapi import HTTPException, Request

from auth.rate_limit import _attempts, limit_auth_request


def test_public_login_is_rate_limited_per_client():
    request = Request({"type": "http", "client": ("rate-test-client", 12345)})
    for _ in range(20):
        limit_auth_request(request, "login")
    try:
        limit_auth_request(request, "login")
    except HTTPException as error:
        assert error.status_code == 429
        assert int(error.headers["Retry-After"]) >= 1
    else:
        raise AssertionError("The 21st attempt must be rate limited")
    finally:
        _attempts.pop(("rate-test-client", "login"), None)
