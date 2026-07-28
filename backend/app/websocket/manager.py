from fastapi import WebSocket
from typing import List, Dict, Any
import json
from app.utils.logger import get_logger

logger = get_logger("ResQNet_WebSocketManager")

import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)
            count = len(self.active_connections)
        logger.info(f"WebSocket client connected. Total active sessions: {count}")

    async def disconnect_async(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
                count = len(self.active_connections)
                logger.info(f"WebSocket client disconnected. Total active sessions: {count}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total active sessions: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        payload = json.dumps(message)
        async with self._lock:
            targets = list(self.active_connections)
        
        dead_connections = []
        for connection in targets:
            try:
                await connection.send_text(payload)
            except Exception as e:
                dead_connections.append(connection)
                logger.warning(f"Error broadcasting over websocket, purging stale socket: {str(e)}")
        
        if dead_connections:
            async with self._lock:
                for dead in dead_connections:
                    if dead in self.active_connections:
                        self.active_connections.remove(dead)

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)

manager = ConnectionManager()
