"""Password hashing helpers (bcrypt).

We use the ``bcrypt`` library directly rather than ``passlib`` — the
latter is unmaintained and incompatible with ``bcrypt>=4.1``.
"""

from __future__ import annotations

import bcrypt

# Cost factor: 12 is a sensible 2024 default (~250ms per hash).
_BCRYPT_ROUNDS = 12
# bcrypt truncates inputs longer than 72 bytes — truncate explicitly
# so we don't depend on the library raising a confusing error.
_MAX_BCRYPT_BYTES = 72


def _truncate(plain: str) -> bytes:
    return plain.encode("utf-8")[:_MAX_BCRYPT_BYTES]


def hash_password(plain: str) -> str:
    """Hash a plaintext password. Returns a self-describing bcrypt hash string."""
    if not plain:
        raise ValueError("Password must not be empty")
    salt = bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)
    return bcrypt.hashpw(_truncate(plain), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Return ``True`` iff ``plain`` matches the previously-hashed ``hashed``."""
    if not plain or not hashed:
        return False
    try:
        return bcrypt.checkpw(_truncate(plain), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False
