import pytest
from auth.utils import hash_password, verify_password


def test_hash_and_verify_roundtrip():
    h = hash_password("admin123")
    assert h.startswith("$2")
    assert verify_password("admin123", h)
    assert not verify_password("wrong", h)


def test_long_password_does_not_crash():
    # Reject excess bytes rather than silently authenticating different suffixes.
    long_pw = "x" * 128
    with pytest.raises(ValueError, match="72 UTF-8 bytes"):
        hash_password(long_pw)


def test_malformed_hash_is_rejected_not_raised():
    assert verify_password("anything", "not-a-bcrypt-hash") is False
