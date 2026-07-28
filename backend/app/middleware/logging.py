import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.logger import get_logger

logger = get_logger("ResQNet_Ingest_Middleware")

class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        request_id = request.headers.get("X-Request-ID", f"REQ-{uuid.uuid4().hex[:8].upper()}")
        gateway_id = request.headers.get("X-Gateway-ID", "DIRECT_HTTP_CLIENT")
        packet_id = request.headers.get("X-Packet-ID", "N/A")
        
        response = await call_next(request)
        
        latency_ms = int((time.time() - start_time) * 1000)
        response.headers["X-Request-ID"] = request_id
        
        logger.info(
            f"{request.method} {request.url.path} returned {response.status_code} in {latency_ms}ms",
            extra={
                "request_id": request_id,
                "gateway_id": gateway_id,
                "packet_id": packet_id,
                "latency_ms": latency_ms,
                "result": "SUCCESS" if response.status_code < 400 else "FAILURE"
            }
        )
        return response
