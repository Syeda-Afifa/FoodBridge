# FoodBridge — Backend (FastAPI)

## Run it

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # Windows: copy .env.example .env
python -m scripts.seed            # optional demo data
uvicorn main:app --reload
```

- API: <http://127.0.0.1:8000>
- Swagger UI: <http://127.0.0.1:8000/docs>
- Health check: <http://127.0.0.1:8000/api/health>

## Layers

```
controllers/   HTTP only — parse the request, choose a status code
services/      business rules — who may do what, and what else changes
repositories/  storage only — read and write rows
models/        what a stored row looks like
schemas/       what crosses the HTTP boundary
core/          settings and JWT helpers
```

Each layer calls only the one directly beneath it. Nothing above
`repositories/` knows data lives in JSON files.

## Where things are

| File | Holds |
|---|---|
| `app/core/jwt.py` | token creation, verification, route guards |
| `app/services/auth_service.py` | salt + pepper hashing, login, refresh, logout |
| `app/services/request_service.py` | FR7 and FR8 — the most interesting rules |
| `app/services/food_listing_service.py` | FR3–FR6 |
| `app/repositories/json_repository.py` | the generic file-backed store |

## Data

`backend/data/*.json`, created on first run and gitignored. Delete them to
start clean, then re-run `python -m scripts.seed`.
