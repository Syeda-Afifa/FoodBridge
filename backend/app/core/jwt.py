"""
JWT utilities — token creation, decoding, and the FastAPI auth dependencies.

┌──────────────────────────────────────────────────────────────────────────┐
│  WHAT IS A JWT?                                                          │
│                                                                          │
│  JSON Web Token — a self-contained string the server hands the client    │
│  after login. The client sends it back on every request so the server     │
│  knows WHO is calling, without a database lookup.                        │
│                                                                          │
│  Three dot-separated parts:                                              │
│                                                                          │
│    eyJhbGciOiJIUzI1NiJ9 . eyJzdWIiOiJ1c2VyMTIzIn0 . SflKxwRJSMeKKF2      │
│    ─────────────────────   ───────────────────────   ───────────────     │
│         HEADER                    PAYLOAD              SIGNATURE         │
│    (algorithm + type)      (user_id, email, role,   (HMAC-SHA256 over    │
│                             issued-at, expiry)       header + payload,   │
│                             base64 — NOT encrypted   signed with the     │
│                             anyone can read it)      secret key)         │
│                                                                          │
│  The signature is what makes it trustworthy. Change one byte of the      │
│  payload and the signature no longer matches, so the server rejects it.  │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  WHY TWO KINDS OF TOKEN?                                                 │
│                                                                          │
│  access_token   — a JWT, short-lived (30 min), sent in the response      │
│                   body and stored by the browser. Stateless: fast to     │
│                   verify, but impossible to revoke before it expires.    │
│                                                                          │
│  refresh_token  — an opaque random string (NOT a JWT), long-lived        │
│                   (7 days), stored in the database and delivered as an   │
│                   httpOnly cookie. Because the server looks it up on     │
│                   every use, it CAN be revoked instantly at logout.      │
│                                                                          │
│  Short access token = small damage window if stolen.                     │
│  Revocable refresh token = the user still stays logged in for a week.    │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  ROLE IN THE PAYLOAD                                                     │
│                                                                          │
│  FoodBridge has three roles: DONOR, RECIPIENT, ADMIN. The role travels   │
│  inside the JWT so route guards can check permission with no DB hit.     │
│                                                                          │
│  Trade-off worth knowing: if an admin demotes a user, that user keeps    │
│  their old role until the access token expires (max 30 min here). That   │
│  is the price of stateless auth, and the reason the expiry is short.     │
└──────────────────────────────────────────────────────────────────────────┘
"""
from datetime import datetime, timedelta, timezone
import secrets

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .config import settings

_bearer_scheme = HTTPBearer()


def create_access_token(user_id: str, email: str, name: str, role: str) -> str:
    """
    Build and sign a short-lived access token.

    Payload:
      sub   → user_id  (the "subject" of the token)
      email → convenience for the UI
      name  → convenience for the UI
      role  → DONOR / RECIPIENT / ADMIN, used by route guards
      iat   → issued at
      exp   → expires at (python-jose rejects the token past this automatically)
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token_value() -> str:
    """
    Generate a cryptographically secure random refresh token.

    Deliberately NOT a JWT: this value is only a lookup key into the
    refresh_tokens store, which means the server can delete it and end the
    session immediately. 32 random bytes → 43 base64url characters.
    """
    return secrets.token_urlsafe(32)


def decode_access_token(token: str) -> dict:
    """Verify the signature and expiry, returning the decoded payload."""
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── FastAPI dependencies ──────────────────────────────────────────────────────
# Any route that declares one of these as a parameter becomes protected:
# FastAPI runs the dependency first, and a missing or bad token means the
# handler never executes.


def get_current_claims(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> dict:
    """Full decoded payload — use when a route needs more than the user id."""
    return decode_access_token(credentials.credentials)


def get_current_user_id(claims: dict = Depends(get_current_claims)) -> str:
    """The most common dependency: just the caller's user id."""
    return claims["sub"]


def get_current_user_role(claims: dict = Depends(get_current_claims)) -> str:
    return claims.get("role", "RECIPIENT")


def require_admin(claims: dict = Depends(get_current_claims)) -> str:
    """Route guard for admin-only endpoints (FR9 — Manage Users)."""
    if claims.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return claims["sub"]
