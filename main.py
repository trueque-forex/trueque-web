<<<<<<< HEAD
from fastapi import FastAPI
from backend.routes.recipients import router as recipients_router
=======
import logging
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from backend.routes.recipients import router as recipients_router
from backend.routes.onboarding import router as onboarding_router

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("trueque_debug")
logger.setLevel(logging.INFO)
# Optional: show SQL emitted by SQLAlchemy when debugging
logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)

app = FastAPI(
    title="Trueque API",
    description="Orchestration-grade backend for global remittance",
    version="1.0.0"
)

<<<<<<< HEAD
# Include core routes
app.include_router(recipients_router, prefix="/api", tags=["Recipients"])
=======
# Request logging middleware (adds a request id and logs start/end)
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        import time, uuid
        rid = str(uuid.uuid4())
        request.state.rid = rid
        logger.info("[%s] START %s %s", rid, request.method, request.url.path)
        start = time.time()
        try:
            response = await call_next(request)
        except Exception as exc:
            logger.exception("[%s] ERROR during request: %s", rid, exc)
            raise
        duration_ms = int((time.time() - start) * 1000)
        logger.info("[%s] END %s %s %sms", rid, request.method, request.url.path, duration_ms)
        return response

app.add_middleware(RequestLoggingMiddleware)

# Global exception handler that logs full context and returns a request id
@app.exception_handler(Exception)
async def all_exception_handler(request: Request, exc: Exception):
    rid = getattr(request.state, "rid", "no-rid")
    logger.error("[%s] Unhandled exception: %s", rid, repr(exc))
    logger.error("[%s] Traceback: %s", rid, "".join(traceback.format_exception(type(exc), exc, exc.__traceback__)))
    try:
        body = await request.body()
        logger.debug("[%s] Request body (truncated 1k): %s", rid, body[:1024])
    except Exception:
        logger.debug("[%s] Could not read request body for logging", rid)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error", "request_id": rid})

# Include core routes
app.include_router(recipients_router, prefix="/api", tags=["Recipients"])
app.include_router(onboarding_router, prefix="/api", tags=["Onboarding"])
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
