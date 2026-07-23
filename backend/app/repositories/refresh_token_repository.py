from datetime import datetime, timezone

from ..core.config import settings
from ..models.refresh_token import RefreshToken
from .json_repository import JSONRepository


class RefreshTokenRepository(JSONRepository[RefreshToken]):
    """
    Server-side session store.

    Because sessions live here rather than inside the token itself, logout
    can genuinely end a session: delete the row and the next refresh fails.
    """

    def __init__(self, path: str | None = None):
        super().__init__(path or settings.REFRESH_TOKENS_FILE, RefreshToken)

    def delete_for_user(self, user_id: str) -> int:
        """Revoke every session for a user — used on password change or ban."""
        rows = self._read_all()
        remaining = [r for r in rows if r.get("user_id") != user_id]
        removed = len(rows) - len(remaining)
        if removed:
            self._write_all(remaining)
        return removed

    def purge_expired(self) -> int:
        """Housekeeping: drop rows the sliding window has already passed."""
        now = datetime.now(timezone.utc)
        rows = self._read_all()
        remaining = []
        for row in rows:
            try:
                if datetime.fromisoformat(str(row["expires_at"])) > now:
                    remaining.append(row)
            except (KeyError, ValueError):
                continue
        removed = len(rows) - len(remaining)
        if removed:
            self._write_all(remaining)
        return removed
