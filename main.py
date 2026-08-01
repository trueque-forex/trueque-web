# main.py — Symmetri FastAPI entrypoint
#
# All 20 route modules passed the import health check (2026-07-31).
# Routers that already define their own prefix= in APIRouter() are included
# with no additional prefix here to avoid double-prefixing.
# Routers with no self-prefix are mounted under /api.
#
# Excluded from mounting (not a router):
#   - backend/routes/audit.py  (utility shim — see backend/utils/audit_utils.py)

import logging
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

# ── Routers with self-defined prefix (do NOT add prefix here) ─────────────────
from backend.routes.admin import router as admin_router                       # /api/admin
from backend.routes.beneficiaries import router as beneficiaries_router       # /api/beneficiaries
from backend.routes.compliance import router as compliance_router             # /api/compliance
from backend.routes.drafts import router as drafts_router                     # /api/drafts
from backend.routes.kyc import router as kyc_router                          # /api/kyc
from backend.routes.offers import router as offers_router                     # /api/offers
from backend.routes.quotes import router as quotes_router                     # /api/quotes
from backend.routes.retailers import router as retailers_router               # /api/retailers
from backend.routes.trades import router as trades_router                     # /api/trades
from backend.routes.transactions import router as transactions_router         # /api/transactions

# ── Routers without self-defined prefix (mounted under /api here) ──────────────
from backend.routes.admin_dashboard import router as admin_dashboard_router   # → /api/admin-dashboard
from backend.routes.advance import router as advance_router                   # → /api/advance
from backend.routes.auth import router as auth_router                         # → /api/auth
from backend.routes.dispute import router as dispute_router                   # → /api/dispute
from backend.routes.history import router as history_router                   # → /api/history
from backend.routes.match import router as match_router                       # → /api/match
from backend.routes.pin import router as pin_router                           # → /api/pin
from backend.routes.rates import router as rates_router                       # → /api/rates
from backend.routes.recipients import router as recipients_router             # → /api/recipients
from backend.routes.settlement import router as settlement_router             # → /api/settle

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("symmetri")
logger.setLevel(logging.INFO)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)  # reduce SQL noise unless debugging

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Symmetri API",
    description=(
        "Orchestration-grade backend for the Symmetri Fair Value Protocol. "
        "Phase 1: Voucher-based remittance. Phase 2: Trustless P2P currency swap."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── Request logging middleware ────────────────────────────────────────────────
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        import time, uuid
        rid = str(uuid.uuid4())[:8]  # short ID for readability
        request.state.rid = rid
        logger.info("[%s] → %s %s", rid, request.method, request.url.path)
        start = time.time()
        try:
            response = await call_next(request)
        except Exception as exc:
            logger.exception("[%s] ERROR: %s", rid, exc)
            raise
        ms = int((time.time() - start) * 1000)
        logger.info("[%s] ← %s %s %dms", rid, request.method, request.url.path, ms)
        return response

app.add_middleware(RequestLoggingMiddleware)

# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def all_exception_handler(request: Request, exc: Exception):
    rid = getattr(request.state, "rid", "no-rid")
    logger.error("[%s] Unhandled exception: %s", rid, repr(exc))
    logger.error("[%s] Traceback:\n%s", rid, "".join(traceback.format_exception(type(exc), exc, exc.__traceback__)))
    try:
        body = await request.body()
        logger.debug("[%s] Request body (truncated): %s", rid, body[:1024])
    except Exception:
        pass
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "request_id": rid},
    )

# ── Mount routers — self-prefixed ─────────────────────────────────────────────
app.include_router(admin_router)                                    # /api/admin
app.include_router(beneficiaries_router)                            # /api/beneficiaries
app.include_router(compliance_router)                               # /api/compliance
app.include_router(drafts_router)                                   # /api/drafts
app.include_router(kyc_router)                                      # /api/kyc
app.include_router(offers_router)                                   # /api/offers
app.include_router(quotes_router)                                   # /api/quotes
app.include_router(retailers_router)                                # /api/retailers
app.include_router(trades_router)                                   # /api/trades
app.include_router(transactions_router)                             # /api/transactions

# ── Mount routers — prefixed here ─────────────────────────────────────────────
app.include_router(admin_dashboard_router, prefix="/api", tags=["Admin"])
app.include_router(advance_router,         prefix="/api", tags=["Advance"])
app.include_router(auth_router,            prefix="/api", tags=["Auth"])
app.include_router(dispute_router,         prefix="/api", tags=["Dispute"])
app.include_router(history_router,         prefix="/api", tags=["History"])
app.include_router(match_router,           prefix="/api", tags=["Match"])
app.include_router(pin_router,             prefix="/api", tags=["PIN"])
app.include_router(rates_router,           prefix="/api", tags=["Rates"])
app.include_router(recipients_router,      prefix="/api", tags=["Recipients"])
app.include_router(settlement_router,      prefix="/api", tags=["Settlement"])

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
def health_check():
    """Lightweight liveness probe."""
    return {"status": "ok", "service": "symmetri-api"}