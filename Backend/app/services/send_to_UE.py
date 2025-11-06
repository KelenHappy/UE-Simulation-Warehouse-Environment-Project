from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter(prefix="/ue", tags=["ue4"])

class UEAckRequest(BaseModel):
    order_id: int
    status: str  # e.g. "received" | "in_progress" | "completed" | "failed"
    message: Optional[str] = None


_ack_history: List[Dict[str, Any]] = []
_telemetry_history: List[Dict[str, Any]] = []


@router.get("/ping")
async def ue_ping(request: Request):
    orders_db = getattr(request.app.state, "orders_db", [])
    return {
        "status": "ok",
        "server_time": datetime.now(timezone.utc).isoformat(),
        "total_orders": len(orders_db),
    }


@router.get("/orders")
async def ue_list_orders(request: Request, limit: int = 20):
    orders_db = getattr(request.app.state, "orders_db", [])
    recent = orders_db[-limit:]
    # 回傳精簡結構，方便 VaRest 解析
    result = [
        {
            "id": o.get("id"),
            "content": o.get("content", ""),
            "items": o.get("items"),
            "timestamp": o.get("timestamp"),
        }
        for o in recent
    ]
    return {"orders": result, "total": len(orders_db)}


@router.get("/order/latest")
async def ue_latest_order(request: Request):
    orders_db = getattr(request.app.state, "orders_db", [])
    if not orders_db:
        raise HTTPException(status_code=404, detail="No orders")
    latest = orders_db[-1]
    return {
        "id": latest.get("id"),
        "content": latest.get("content", ""),
        "items": latest.get("items"),
        "timestamp": latest.get("timestamp"),
    }


@router.post("/ack")
async def ue_acknowledge(payload: UEAckRequest):
    record = {
        "order_id": payload.order_id,
        "status": payload.status,
        "message": payload.message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    _ack_history.append(record)
    if len(_ack_history) > 1000:
        del _ack_history[:-500]
    return {"ok": True}


class UETelemetry(BaseModel):
    player_id: Optional[str] = None
    data: Dict[str, Any]


@router.post("/telemetry")
async def ue_telemetry(payload: UETelemetry):
    record = {
        "player_id": payload.player_id,
        "data": payload.data,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    _telemetry_history.append(record)
    if len(_telemetry_history) > 1000:
        del _telemetry_history[:-500]
    return {"ok": True}


@router.get("/acks")
async def ue_list_acks(limit: int = 100):
    return {"acks": _ack_history[-limit:]}


@router.get("/telemetry")
async def ue_list_telemetry(limit: int = 100):
    return {"telemetry": _telemetry_history[-limit:]}

"""
GET /ue/ping - 測試連線
{ "status": "ok", "server_time": "2025-11-06T13:30:00Z", "total_orders": 3 }
GET /ue/orders?limit=20 - 取得最近20筆訂單
    {
      "id": 3,
      "content": "12-34-56",
      "items": [12,34,56],
      "timestamp": "..."
    }
GET /ue/order/latest - 取得最新訂單
    { "id": 3, "content": "12-34-56", "items": [12,34,56], "timestamp": "..." }
POST /ue/ack - 確認訂單
    { "ok": true }
POST /ue/telemetry - 發送玩家位置和動作資料
    { "ok": true }
GET /ue/acks - 取得確認記錄
    { "acks": [{"order_id": 3, "status": "received", "message": "...", "timestamp": "..."}, ...] }
GET /ue/telemetry - 取得玩家位置和動作資料
    { "telemetry": [{"player_id": "player1", "data": {"x": 100, "y": 200}, "timestamp": "..."}, ...] }
"""
