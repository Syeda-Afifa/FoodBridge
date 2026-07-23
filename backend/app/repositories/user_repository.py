from ..core.config import settings
from ..models.user import User
from .json_repository import JSONRepository


class UserRepository(JSONRepository[User]):
    """Users store. Email is treated as a unique business key."""

    def __init__(self, path: str | None = None):
        super().__init__(path or settings.USERS_FILE, User)

    def get_by_email(self, email: str) -> User | None:
        normalised = email.strip().lower()
        for row in self._read_all():
            if str(row.get("email", "")).strip().lower() == normalised:
                return self._to_model(row)
        return None
