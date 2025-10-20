"""
Data models for the WebSocket bridge
"""

from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

class PlayerData(BaseModel):
    """Player position and action data from UE4.27"""
    position: Dict[str, float]  # x, y, z coordinates
    rotation: Dict[str, float]  # pitch, yaw, roll
    velocity: Dict[str, float]  # velocity vector
    actions: Optional[Dict[str, Any]] = None  # Additional action data
    timestamp: datetime

class ConnectionStatus(BaseModel):
    """Connection status information"""
    client_type: str
    client_id: str
    status: str  # connected, disconnected
    timestamp: datetime

class WebSocketMessage(BaseModel):
    """Generic WebSocket message structure"""
    type: str
    data: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None
