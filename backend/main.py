import os
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import get_pool, close_pool
from dependencies import get_db_pool
from routers import auth, books, loans, library_public


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await get_pool()
    except Exception:
        pass  # App starts anyway; first request will get 503
    yield
    await close_pool()


def _http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, str):
        msg = detail
    elif isinstance(detail, list) and detail:
        msg = detail[0].get("msg", str(detail))
    else:
        msg = str(detail)
    return JSONResponse(status_code=exc.status_code, content={"error": msg})


app = FastAPI(
    title="Library API",
    description="Backend for Library Management (FastAPI)",
    lifespan=lifespan,
)
app.add_exception_handler(HTTPException, _http_exception_handler)
app.add_exception_handler(RequestValidationError, lambda r, e: JSONResponse(status_code=400, content={"error": e.errors()[0].get("msg", "Validation error") if e.errors() else "Validation error"}))
app.add_exception_handler(Exception, lambda r, e: JSONResponse(status_code=500, content={"error": "Internal server error"}))
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(books.router)
app.include_router(loans.router)
app.include_router(library_public.router)


@app.get("/api/health")
def health():
    return {"ok": True, "message": "Library API (FastAPI / Render)"}


@app.get("/api/health/db")
async def health_db(pool=Depends(get_db_pool)):
    """Check DB connection and users table. Uses FastAPI dependency for pool."""
    row = await pool.fetchrow("SELECT 1 FROM users LIMIT 1")
    return {"ok": True, "db": "connected", "users_table": row is not None}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "10000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
