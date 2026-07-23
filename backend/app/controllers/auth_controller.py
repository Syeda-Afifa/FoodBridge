from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from ..core.config import settings
from ..core.jwt import get_current_user_id, require_admin
from ..schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RefreshResponse,
    RegisterRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserResponse,
)
from .dependencies import auth_service

router = APIRouter()

_RT_COOKIE = "refresh_token"


def _set_refresh_cookie(response: Response, token_id: str) -> None:
    """
    Deliver the refresh token as an httpOnly cookie.

    httpOnly  — JavaScript cannot read it, so an XSS payload cannot steal it
    secure    — HTTPS only (disabled in local dev via .env)
    samesite  — "lax" locally; "none" in production for cross-origin requests
    path      — restricted to /api/auth so it is not attached to every call
    """
    response.set_cookie(
        key=_RT_COOKIE,
        value=token_id,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=_RT_COOKIE,
        path="/api/auth",
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, response: Response):
    """FR1 — create the account, then sign the user straight in."""
    auth_service.register(
        name=payload.name,
        email=payload.email,
        password=payload.password,
        role=payload.role.value,
        phone=payload.phone,
        organization=payload.organization,
    )
    user, access_token, refresh_token = auth_service.login(payload.email, payload.password)
    _set_refresh_cookie(response, refresh_token.id)
    return TokenResponse(
        access_token=access_token,
        user_id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        expires_in_minutes=settings.JWT_EXPIRE_MINUTES,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response):
    """FR2 — User Login."""
    user, access_token, refresh_token = auth_service.login(payload.email, payload.password)
    _set_refresh_cookie(response, refresh_token.id)
    return TokenResponse(
        access_token=access_token,
        user_id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        expires_in_minutes=settings.JWT_EXPIRE_MINUTES,
    )


@router.post("/refresh", response_model=RefreshResponse)
def refresh(request: Request, response: Response):
    """
    Silent re-authentication, called by the frontend axios interceptor the
    moment any request comes back 401. The browser attaches the httpOnly
    cookie automatically — the frontend never sees or handles it.
    """
    token_id = request.cookies.get(_RT_COOKIE)
    if not token_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token cookie",
        )
    access_token, _ = auth_service.refresh(token_id)
    _set_refresh_cookie(response, token_id)   # refresh the cookie's max_age too
    return RefreshResponse(
        access_token=access_token,
        expires_in_minutes=settings.JWT_EXPIRE_MINUTES,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response):
    token_id = request.cookies.get(_RT_COOKIE)
    if token_id:
        auth_service.logout(token_id)
    _clear_refresh_cookie(response)


@router.get("/me", response_model=UserResponse)
def me(user_id: str = Depends(get_current_user_id)):
    """Who am I? Used on page load to rehydrate the session."""
    user = auth_service.users.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user.model_dump())


# ── own profile (FR11 — Manage Own Profile) ───────────────────────────────────


@router.put("/me", response_model=UserResponse)
def update_me(payload: UpdateProfileRequest, user_id: str = Depends(get_current_user_id)):
    """
    Update the signed-in user's own details.

    The id comes from the JWT, never from the request body, so a caller can
    only ever edit themselves.
    """
    user = auth_service.update_profile(user_id, payload.model_dump(exclude_unset=True))
    return UserResponse(**user.model_dump())


@router.put("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_my_password(
    payload: ChangePasswordRequest,
    response: Response,
    user_id: str = Depends(get_current_user_id),
):
    """
    Change the signed-in user's password.

    All refresh tokens are revoked inside the service, so the cookie is
    cleared here too and the user signs in again with the new password.
    """
    auth_service.change_password(user_id, payload.current_password, payload.new_password)
    response.delete_cookie(_RT_COOKIE, path="/")


# ── admin endpoints (FR9 — Manage Users) ──────────────────────────────────────


@router.get("/users", response_model=list[UserResponse])
def list_users(_: str = Depends(require_admin)):
    return [UserResponse(**u.model_dump()) for u in auth_service.list_users()]


@router.put("/users/{user_id}/status", response_model=UserResponse)
def set_user_status(user_id: str, is_active: bool, _: str = Depends(require_admin)):
    user = auth_service.set_active(user_id, is_active)
    return UserResponse(**user.model_dump())
