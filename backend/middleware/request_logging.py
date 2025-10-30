import time, uuid, logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("trueque_debug")

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        rid = str(uuid.uuid4())
        request.state.rid = rid
        logger.info("[%s] START %s %s", rid, request.method, request.url.path)
        start = time.time()
        try:
            response = await call_next(request)
        except Exception as exc:
            logger.exception("[%s] ERROR during request: %s", rid, exc)
            raise
        duration = (time.time() - start) * 1000
        logger.info("[%s] END %s %s %sms", rid, request.method, request.url.path, int(duration))
        return response