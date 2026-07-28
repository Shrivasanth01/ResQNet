from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import time

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests_per_minute: int = 120):
        super().__init__(app)
        self.max_requests = max_requests_per_minute
        self.ip_records = {}

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        
        # Clean up records older than 60 seconds
        if client_ip in self.ip_records:
            self.ip_records[client_ip] = [t for t in self.ip_records[client_ip] if now - t < 60]
        else:
            self.ip_records[client_ip] = []
            
        if len(self.ip_records[client_ip]) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Too many requests per minute from this IP."
            )
            
        self.ip_records[client_ip].append(now)
        return await call_next(request)
