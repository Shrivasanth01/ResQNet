from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from app.database.session import get_db
from app.schemas.all_schemas import HealthStatusResponse
from app.websocket.manager import manager
from app.config import settings

router = APIRouter()

@router.get("", response_model=HealthStatusResponse)
def get_health_status(db: Session = Depends(get_db)):
    """
    System diagnostic endpoint evaluating database accessibility and active WebSocket stream counts.
    """
    db_status = "ONLINE_CONNECTIVITY_OK"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"DEGRADED_OR_OFFLINE: {str(e)}"

    return HealthStatusResponse(
        status="HEALTHY_OPERATIONAL",
        version=settings.VERSION,
        database_status=db_status,
        active_websocket_connections=manager.connection_count,
        timestamp=datetime.utcnow().isoformat() + "Z"
    )
