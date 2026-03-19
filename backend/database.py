import os
import asyncpg

_db_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _db_pool
    if _db_pool is None:
        url = os.environ.get("DATABASE_URL")
        if not url:
            raise RuntimeError("DATABASE_URL is not set")
        # Neon and cloud Postgres typically need SSL (URL often has ?sslmode=require)
        kwargs = {"min_size": 1, "max_size": 10, "command_timeout": 60}
        if "neon.tech" in url or "sslmode=require" in url:
            kwargs["ssl"] = True
        _db_pool = await asyncpg.create_pool(url, **kwargs)
    return _db_pool


async def close_pool():
    global _db_pool
    if _db_pool:
        await _db_pool.close()
        _db_pool = None
