from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.session import engine, Base
from app.api.v1 import incidents, users, health, otp
from app.middleware.logging import StructuredLoggingMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.websocket.manager import manager
from app.utils.logger import get_logger

logger = get_logger("ResQNet_Main_App")

# Ensure all SQLAlchemy models are registered
try:
    from app.models import all_models
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.warning(f"Database initialization deferred: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production FastAPI Cloud Backend & Real-Time Emergency Triage Intake for ResQNet."
)

# Register CORS Middleware for Admin Dashboard Web Accessibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Custom ResQNet Middleware
app.add_middleware(StructuredLoggingMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests_per_minute=240)

# Include API v1 Routers
app.include_router(incidents.router, prefix=f"{settings.API_V1_STR}/incidents", tags=["Incidents & Packets"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["User Medical Vaults"])
app.include_router(health.router, prefix=f"{settings.API_V1_STR}/health", tags=["System Health Diagnostics"])
app.include_router(otp.router, prefix=f"{settings.API_V1_STR}/auth", tags=["OTP Authentication (MSG91)"])

@app.get("/")
def root_endpoint():
    return {
        "status": "online",
        "service": "ResQNet Central Cloud & Emergency Triage API",
        "version": settings.VERSION,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health")
def health_endpoint():
    return {"status": "healthy", "service": "ResQNet Backend"}

@app.websocket(f"{settings.API_V1_STR}/ws/incidents")
async def websocket_incidents_endpoint(websocket: WebSocket):
    """
    Real-Time WebSocket Streaming Hub for Dispatch Operations Center & Emergency Rescue Personnel.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Maintain heartbeat monitoring loop
            data = await websocket.receive_text()
            if data == "PING":
                await websocket.send_text("PONG")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Dispatch operations client disconnected from websocket channel.")

@app.on_event("startup")
async def startup_event():
    logger.info("ResQNet FastAPI Backend Foundation initialized cleanly. Database schema synced and ready for field packet intake.")
