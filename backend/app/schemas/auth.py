"""
Auth request/response shapes.

Models (app/models) describe what is STORED.
Schemas (app/schemas) describe what crosses the HTTP boundary.

Keeping them separate is what stops hashed_password from ever leaking into
a JSON response — UserResponse simply has no such field.
"""
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from ..models.user import Role


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    role: Role = Role.RECIPIENT
    phone: str | None = None
    organization: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UpdateProfileRequest(BaseModel):
    """
    FR11 — Manage Own Profile.

    Every field is optional: the client sends only what changed, and anything
    left out keeps its current value. Role, email, and is_active are absent on
    purpose — a user must not be able to promote themselves to ADMIN or take
    over another account's address by editing their own profile.
    """
    name: str | None = Field(None, min_length=2, max_length=80)
    phone: str | None = Field(None, max_length=30)
    organization: str | None = Field(None, max_length=120)


class ChangePasswordRequest(BaseModel):
    """
    FR11 — Change Password.

    current_password is required even though the caller is already
    authenticated. It proves the person at the keyboard is the account owner
    and not someone using a screen left unlocked.
    """
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: Role
    phone: str | None = None
    organization: str | None = None
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    name: str
    role: Role
    expires_in_minutes: int


class RefreshResponse(BaseModel):
    """Returned by POST /api/auth/refresh — only a fresh access token."""
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
