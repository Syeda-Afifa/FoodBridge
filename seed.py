"""
Seed the JSON datastore with demo data.

Run from the backend/ folder:   python -m scripts.seed

Creates five accounts covering all three roles from docs/09-user-persons.md,
plus listings and a pending request, so every screen has something to show
during a demo or viva. Safe to re-run: it clears the data files first.

    ROLE       EMAIL                        PASSWORD
    ADMIN      admin@foodbridge.org         Admin123
    DONOR      donor@foodbridge.org         Donor123
    DONOR      bakery@foodbridge.org        Donor123
    RECIPIENT  recipient@foodbridge.org     Recipient123
    RECIPIENT  kitchen@foodbridge.org       Recipient123
"""
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.controllers.dependencies import (  # noqa: E402
    auth_service,
    listing_repo,
    listing_service,
    notification_repo,
    refresh_token_repo,
    request_repo,
    request_service,
    user_repo,
)


def reset() -> None:
    for repo in (user_repo, listing_repo, request_repo, notification_repo, refresh_token_repo):
        repo._write_all([])
    print("cleared existing data")


def main() -> None:
    reset()

    # ── Accounts (docs/09-user-persons.md) ───────────────────────────────────
    admin = auth_service.register(
        name="Platform Admin",
        email="admin@foodbridge.org",
        password="Admin123",
        role="ADMIN",
        organization="FoodBridge",
    )
    donor = auth_service.register(
        name="Nadia's Kitchen",
        email="donor@foodbridge.org",
        password="Donor123",
        role="DONOR",
        organization="Nadia's Kitchen",
    )
    bakery = auth_service.register(
        name="Green Leaf Bakery",
        email="bakery@foodbridge.org",
        password="Donor123",
        role="DONOR",
        organization="Green Leaf Bakery",
    )
    recipient = auth_service.register(
        name="Shapla Shelter",
        email="recipient@foodbridge.org",
        password="Recipient123",
        role="RECIPIENT",
        organization="Shapla Shelter",
    )
    kitchen = auth_service.register(
        name="Aloke Community Kitchen",
        email="kitchen@foodbridge.org",
        password="Recipient123",
        role="RECIPIENT",
        organization="Aloke Community Kitchen",
    )

    for user in (admin, donor, bakery, recipient, kitchen):
        print(f"  user: {user.email:<28} {user.role}")

    # ── Listings ─────────────────────────────────────────────────────────────
    now = datetime.now(timezone.utc)
    samples = [
        (donor, {
            "title": "Rice and chicken curry, 12 boxes",
            "description": "Cooked at lunch, refrigerated since. Containers included.",
            "quantity": "12 boxes",
            "food_type": "COOKED",
            "pickup_address": "House 12, Road 5, Dhanmondi",
            "expiry_date": now + timedelta(hours=6),
        }),
        (donor, {
            "title": "Fresh vegetables from wholesale order",
            "description": "Over-ordered. Mixed seasonal produce, all good condition.",
            "quantity": "3 crates",
            "food_type": "PRODUCE",
            "pickup_address": "Karwan Bazar, Gate 2",
            "expiry_date": now + timedelta(days=2),
        }),
        (bakery, {
            "title": "Bakery surplus - bread and rolls",
            "description": "Baked this morning, unsold at close.",
            "quantity": "About 4 kg",
            "food_type": "BAKERY",
            "pickup_address": "Shop 3, Mirpur 10",
            "expiry_date": now + timedelta(hours=20),
        }),
        (bakery, {
            "title": "Sealed packaged snacks",
            "description": "Short-dated stock, all sealed and within date.",
            "quantity": "2 boxes",
            "food_type": "PACKAGED",
            "pickup_address": "Shop 3, Mirpur 10",
            "expiry_date": now + timedelta(days=3),
        }),
    ]

    created = []
    for owner, data in samples:
        listing = listing_service.create(owner.id, data)
        created.append(listing)
        print(f"  listing: {listing.title}  (by {owner.name})")

    # ── A pending request, so the Requests screen is not empty ───────────────
    request_service.create(
        recipient_id=recipient.id,
        listing_id=created[0].id,
        message="We can collect this evening. Shelter serves 40 people.",
    )
    request_service.create(
        recipient_id=kitchen.id,
        listing_id=created[0].id,
        message="Happy to take any amount you can spare.",
    )
    print("  requests: 2 pending on the first listing")

    print("""
Seed complete. Sign in with any of these:

  ADMIN      admin@foodbridge.org       Admin123
  DONOR      donor@foodbridge.org       Donor123
  DONOR      bakery@foodbridge.org      Donor123
  RECIPIENT  recipient@foodbridge.org   Recipient123
  RECIPIENT  kitchen@foodbridge.org     Recipient123
""")


if __name__ == "__main__":
    main()
