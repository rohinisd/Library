# Habit backend (FastAPI)

API for the Habit app. Same API shape as the previous Express backend; deploy on Render with **Root Directory** `backend`, **Runtime** Docker.

## Local run

```bash
cd backend
pip install -r requirements.txt
export DATABASE_URL="postgresql://..."
export JWT_SECRET="your-secret"
uvicorn main:app --reload --host 0.0.0.0 --port 10000
```

## Env (Render / local)

- `DATABASE_URL` – Postgres connection string (Neon).
- `JWT_SECRET` – Same value as on Vercel frontend (for token verification).

## Endpoints

- `POST /api/auth/register` – body: `{ username, password, displayName? }` → `{ ok, token }`
- `POST /api/auth/login` – body: `{ username, password }` → `{ ok, token }`
- `GET /api/tasks` – `Authorization: Bearer <token>`, query: `type`, `from`, `to`
- `POST /api/tasks` – body: `{ title, taskType, dueDate?, timeAllotmentMinutes?, reminderAt? }`
- `PATCH /api/tasks/{id}` – body: partial task
- `DELETE /api/tasks/{id}`
- `GET /api/stats`
- `GET /api/health`

OpenAPI docs: **/docs** (when running).
