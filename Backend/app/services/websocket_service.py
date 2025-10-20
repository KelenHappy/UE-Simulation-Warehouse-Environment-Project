"""
WebSocket service layer for managing connections and data flow
"""

import json
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class WebSocketService:
    """Service for managing WebSocket connections and data flow"""

    def __init__(self):
        self.connections: Dict[str, Dict] = {
            "active": {},
            "ue_clients": {},
            "svelte_clients": {}
        }
        self.player_data_history: List[Dict] = []

    def add_connection(self, client_id: str, websocket, client_type: str):
        """Add a new WebSocket connection"""
        self.connections["active"][client_id] = {
            "websocket": websocket,
            "client_type": client_type,
            "connected_at": datetime.utcnow()
        }

        if client_type == "ue":
            self.connections["ue_clients"][client_id] = websocket
        elif client_type == "svelte":
            self.connections["svelte_clients"][client_id] = websocket

        logger.info(f"Added {client_type} connection: {client_id}")

    def remove_connection(self, client_id: str):
        """Remove a WebSocket connection"""
        if client_id in self.connections["active"]:
            client_type = self.connections["active"][client_id]["client_type"]
            del self.connections["active"][client_id]

            if client_type == "ue" and client_id in self.connections["ue_clients"]:
                del self.connections["ue_clients"][client_id]
            elif client_type == "svelte" and client_id in self.connections["svelte_clients"]:
                del self.connections["svelte_clients"][client_id]

            logger.info(f"Removed {client_type} connection: {client_id}")

    def get_connection_stats(self) -> Dict:
        """Get current connection statistics"""
        return {
            "total": len(self.connections["active"]),
            "ue_clients": len(self.connections["ue_clients"]),
            "svelte_clients": len(self.connections["svelte_clients"])
        }

    def store_player_data(self, client_id: str, data: Dict):
        """Store player data from UE clients"""
        player_record = {
            "client_id": client_id,
            "data": data,
            "timestamp": datetime.utcnow()
        }

        self.player_data_history.append(player_record)

        # Keep only last 1000 records to prevent memory issues
        if len(self.player_data_history) > 1000:
            self.player_data_history = self.player_data_history[-1000:]

        logger.info(f"Stored player data from {client_id}")

    def get_recent_player_data(self, limit: int = 100) -> List[Dict]:
        """Get recent player data"""
        return self.player_data_history[-limit:] if self.player_data_history else []
