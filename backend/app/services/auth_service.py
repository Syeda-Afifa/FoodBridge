"""
AuthService — registration, login, refresh, logout.

┌─────────────────────────────────────────────────────────────┐
│  SALT + PEPPER PASSWORD STRATEGY                            │
│                                                             │
│  Salt   → random per-password value bcrypt generates and    │
│           embeds inside the stored hash. Two users with the │
│           same password get completely different hashes, so │
│           precomputed rainbow tables are useless.           │
│                                                             │
│  Pepper → one server-side secret from the environment,      │
│           never written to the database. If an attacker     │
│           steals the database alone, every hash is still    │
│           uncrackable because the pepper is missing.        │
│                                                             │
│  register:  bcrypt(password + pepper)          → stored     │
│  login:     bcrypt.verify(password + pepper, stored_hash)   │
└─────────────────────────────────────────────────────────────┘
"""
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from passlib.context import CryptContext

from ..core.config import settings
from ..core.jwt import create_access_token, create_refresh_token_value
from ..models.refresh_token import RefreshToken
from ..models.user import User
from ..repositories.refresh_token_repository import RefreshTokenRepository
from ..repositories.user_repository import UserRepository

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _hash_password(plain: str) -> str:
    """
    bcrypt truncates silently at 72 bytes, so the pepper is appended rather
    than prepended and the combined value is length-checked by the schema
    (max 128 chars) before it ever reaches here.
    """
    return _pwd_context.hash(plain + settings.PASSWORD_PEPPER)


def _verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain + settings.PASSWORD_PEPPER, hashed)


class AuthService:
    def __init__(self, user_repo: UserRepository, rt_repo: RefreshTokenRepository):
        self.users = user_repo
        self.tokens = rt_repo

    # ── registration ─────────────────────────────────────────────────────────

    def register(
        self,
        name: str,
        email: str,
        password: str,
        role: str,
        phone: str | None = None,
        organization: str | None = None,
    ) -> User:
        """FR1 — User Registration."""
        if self.users.get_by_email(email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )

        user = User(
            name=name.strip(),
            email=email.strip().lower(),
            hashed_password=_hash_password(password),
            role=role,
            phone=phone,
            organization=organization,
        )
        return self.users.create(user)

    # ── login ────────────────────────────────────────────────────────────────

    def login(self, email: str, password: str) -> tuple[User, str, RefreshToken]:
        """
        FR2 — User Login.

        The same generic error is returned for an unknown email and a wrong
        password. Distinguishing them would let an attacker enumerate which
        addresses are registered.
        """
        user = self.users.get_by_email(email)
        if not user or not _verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated",
            )

        access_token = create_access_token(
            user_id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
        )
        refresh_token = self.tokens.create(
            RefreshToken(id=create_refresh_token_value(), user_id=user.id)
        )
        return user, access_token, refresh_token

    # ── refresh ──────────────────────────────────────────────────────────────

    def refresh(self, token_id: str) -> tuple[str, RefreshToken]:
        """
        Exchange a valid refresh token for a new access token.

        Two expiry checks apply:
          expires_at          — sliding, pushed forward on every refresh
          absolute_expires_at — hard ceiling, never extended, so a stolen
                                token cannot keep a session alive forever
        """
        stored = self.tokens.get(token_id)
        if not stored:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session not found — please sign in again",
            )

        now = datetime.now(timezone.utc)
        if stored.expires_at <= now or stored.absolute_expires_at <= now:
            self.tokens.delete(token_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired — please sign in again",
            )

        user = self.users.get(stored.user_id)
        if not user or not user.is_active:
            self.tokens.delete(token_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is no longer active",
            )

        # Slide the window forward, but never past the absolute ceiling.
        new_expiry = min(
            now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            stored.absolute_expires_at,
        )
        self.tokens.update(token_id, {"expires_at": new_expiry})

        access_token = create_access_token(
            user_id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
        )
        return access_token, stored

    # ── logout ───────────────────────────────────────────────────────────────

    def logout(self, token_id: str) -> None:
        """Revoke the session. The access token dies on its own at expiry."""
        self.tokens.delete(token_id)

    # ── own profile (FR11) ───────────────────────────────────────────────────

    def update_profile(self, user_id: str, changes: dict) -> User:
        """
        Update the caller's own editable details.

        Only keys the client actually sent are applied, so omitting a field
        leaves it untouched rather than blanking it. Role and email are not
        accepted here — see UpdateProfileRequest for why.
        """
        user = self.users.get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        fields = {k: v for k, v in changes.items() if v is not None}
        if not fields:
            return user

        return self.users.update(user_id, fields)

    def change_password(self, user_id: str, current: str, new: str) -> User:
        """
        Replace the caller's password.

        Two safeguards worth naming in a viva:
          1. The current password is verified first, so a hijacked session
             cannot lock the real owner out.
          2. Every refresh token for the user is revoked afterwards, so any
             other device that was signed in is forced to log in again.
        """
        user = self.users.get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not _verify_password(current, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        if current == new:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from the current one",
            )

        updated = self.users.update(user_id, {"hashed_password": _hash_password(new)})
        self.tokens.delete_for_user(user_id)
        return updated

    # ── admin (FR9) ──────────────────────────────────────────────────────────

    def list_users(self) -> list[User]:
        return sorted(self.users.list_all(), key=lambda u: u.created_at, reverse=True)

    def set_active(self, user_id: str, is_active: bool) -> User:
        user = self.users.get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        updated = self.users.update(user_id, {"is_active": is_active})
        if not is_active:
            # Deactivating must also end any live sessions.
            self.tokens.delete_for_user(user_id)
        return updated
