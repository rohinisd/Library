# db

Database schema and migration scripts for Habit.

- **migrations/** – SQL migrations (run in order, e.g. `001_init.sql`).
- **run-sql.js** – Runs a SQL file against `DATABASE_URL`. From repo root:
  ```bash
  node db/run-sql.js db/migrations/001_init.sql
  ```

Ensure `DATABASE_URL` is set in the root `.env` (from Neon or your Postgres provider).
