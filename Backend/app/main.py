"""
FastAPI WebSocket Hub for UE4.27 ↔ SvelteKit Communication Bridge
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import json
import asyncio
import logging
from typing import Dict, List
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="UE4.27 WebSocket Bridge",
    description="WebSocket Hub for UE4.27 ↔ SvelteKit Communication",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connection managers
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.ue_connections: Dict[str, WebSocket] = {}
        self.svelte_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_type: str, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

        if client_type == "ue":
            self.ue_connections[client_id] = websocket
            logger.info(f"UE client {client_id} connected")
        elif client_type == "svelte":
            self.svelte_connections[client_id] = websocket
            logger.info(f"Svelte client {client_id} connected")

        # Notify all Svelte clients about new connection
        await self.broadcast_to_svelte({
            "type": "connection_update",
            "client_type": client_type,
            "client_id": client_id,
            "status": "connected",
            "timestamp": datetime.utcnow().isoformat()
        })

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

        if client_id in self.ue_connections:
            del self.ue_connections[client_id]
            logger.info(f"UE client {client_id} disconnected")

        if client_id in self.svelte_connections:
            del self.svelte_connections[client_id]
            logger.info(f"Svelte client {client_id} disconnected")

    async def send_personal_message(self, message: dict, client_id: str):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(message)
            except:
                self.disconnect(client_id)

    async def broadcast_to_svelte(self, message: dict):
        disconnected_clients = []
        for client_id, websocket in self.svelte_connections.items():
            try:
                await websocket.send_json(message)
            except:
                disconnected_clients.append(client_id)

        for client_id in disconnected_clients:
            self.disconnect(client_id)

    async def broadcast_to_ue(self, message: dict):
        disconnected_clients = []
        for client_id, websocket in self.ue_connections.items():
            try:
                await websocket.send_json(message)
            except:
                disconnected_clients.append(client_id)

        for client_id in disconnected_clients:
            self.disconnect(client_id)

# Global connection manager
manager = ConnectionManager()

@app.get("/")
async def get():
    """Root endpoint with connection status"""
    return {
        "status": "running",
        "connections": {
            "total": len(manager.active_connections),
            "ue_clients": len(manager.ue_connections),
            "svelte_clients": len(manager.svelte_connections)
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@app.websocket("/ws/{client_type}/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_type: str, client_id: str):
    """WebSocket endpoint for UE4.27 and SvelteKit clients"""
    await manager.connect(websocket, client_type, client_id)

    try:
        while True:
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                logger.info(f"Received message from {client_type} {client_id}: {message}")

                # Handle different message types
                if message.get("type") == "player_data":
                    # Forward player data from UE to all Svelte clients
                    await manager.broadcast_to_svelte({
                        "type": "player_update",
                        "client_id": client_id,
                        "data": message.get("data"),
                        "timestamp": datetime.utcnow().isoformat()
                    })

                elif message.get("type") == "ping":
                    # Respond to ping
                    await manager.send_personal_message({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    }, client_id)

                elif message.get("type") == "subscribe":
                    # Handle subscription requests from Svelte clients
                    await manager.send_personal_message({
                        "type": "subscribed",
                        "subscriptions": ["player_updates"],
                        "timestamp": datetime.utcnow().isoformat()
                    }, client_id)

            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON received from {client_type} {client_id}: {data}")

    except WebSocketDisconnect:
        manager.disconnect(client_id)
        # Notify remaining clients about disconnection
        await manager.broadcast_to_svelte({
            "type": "connection_update",
            "client_type": client_type,
            "client_id": client_id,
            "status": "disconnected",
            "timestamp": datetime.utcnow().isoformat()
        })

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    import os
    from dotenv import load_dotenv

    load_dotenv()

    host = os.getenv("WS_HOST", "0.0.0.0")
    port = int(os.getenv("WS_PORT", "8000"))

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
