import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

router = APIRouter(prefix="/vue", tags=["vue"])


class VUEAckRequest(BaseModel):
    order_id: int
    status: str  # e.g. "received" | "in_progress" | "completed" | "failed"
    message: Optional[str] = None


_ack_history: List[Dict[str, Any]] = []
_telemetry_history: List[Dict[str, Any]] = []


# 貨物數據模型
class Cargo(BaseModel):
    id: str
    position: Dict[str, float]
    size: Dict[str, float]
    timestamp: str


# 貨物路徑
CARGO_DATA_FILE = Path(__file__).parent.parent.parent / "data" / "cargo_data.json"

# 貨物數據庫
_cargo_db: List[Dict[str, Any]] = []


# 加載貨物數據
def load_cargo_data():
    global _cargo_db
    try:
        if CARGO_DATA_FILE.exists():
            with open(CARGO_DATA_FILE, "r", encoding="utf-8") as f:
                _cargo_db = json.load(f)
        else:
            _cargo_db = []
    except Exception as e:
        print(f"加載貨物數據失敗: {e}")
        _cargo_db = []


# 保存貨物數據
def save_cargo_data():
    try:
        # 確認目錄是否存在
        CARGO_DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(CARGO_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(_cargo_db, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"保存貨物數據失敗: {e}")
        raise


# 自啟動
load_cargo_data()


@router.get("/ping")
async def Vue_ping(request: Request):
    orders_db = getattr(request.app.state, "orders_db", [])
    return {
        "status": "ok",
        "server_time": datetime.now(timezone.utc).isoformat(),
        "total_orders": len(orders_db),
    }


@router.get("/orders")
async def Vue_list_orders(request: Request, limit: int = 20):
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
async def Vue_latest_order(request: Request):
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
async def Vue_acknowledge(payload: VUEAckRequest):
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


class VUETelemetry(BaseModel):
    player_id: Optional[str] = None
    data: Dict[str, Any]


@router.post("/telemetry")
async def Vue_telemetry(payload: VUETelemetry):
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
async def Vue_list_acks(limit: int = 100):
    return {"acks": _ack_history[-limit:]}


@router.get("/telemetry")
async def Vue_list_telemetry(limit: int = 100):
    return {"telemetry": _telemetry_history[-limit:]}


# 貨物網路功能
@router.post("/cargo")
async def receive_cargo_data(cargo_data: List[Cargo]):
    """接收並儲存（替換現有數據）"""
    global _cargo_db
    try:
        # 清空現有數據，用新數據替換
        _cargo_db = []
        
        # 将货物数据转换为字典格式
        for cargo in cargo_data:
            cargo_dict = cargo.dict()
            _cargo_db.append(cargo_dict)

        # 保存到 JSON 文件
        save_cargo_data()

        return {
            "message": "貨物已儲存",
            "total_cargo": len(_cargo_db),
            "saved_count": len(cargo_data),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"貨物儲存時出錯: {str(e)}")


@router.get("/cargo")
async def get_cargo_data(limit: int = 100):
    """獲取貨物資訊"""
    return {"cargo": _cargo_db[-limit:], "total": len(_cargo_db)}


@router.get("/cargo/latest")
async def get_latest_cargo():
    """獲取貨物最新資訊"""
    if not _cargo_db:
        raise HTTPException(status_code=404, detail="No cargo data")
    return _cargo_db[-1]


@router.delete("/cargo")
async def clear_cargo_data():
    """清空貨物數據"""
    global _cargo_db
    _cargo_db = []
    save_cargo_data()
    return {"message": "貨物數據已清空", "total_cargo": 0}


"""
GET /vue/ping - 測試連線
{ "status": "ok", "server_time": "2025-11-06T13:30:00Z", "total_orders": 3 }
GET /vue/orders?limit=20 - 取得最近20筆訂單
    {
      "id": 3,
      "content": "12-34-56",
      "items": [12,34,56],
      "timestamp": "..."
    }
GET /vue/order/latest - 取得最新訂單
    { "id": 3, "content": "12-34-56", "items": [12,34,56], "timestamp": "..." }
POST /vue/ack - 確認訂單
    { "ok": true }
POST /vue/telemetry - 發送玩家位置和動作資料
    { "ok": true }
GET /vue/acks - 取得確認記錄
    { "acks": [{"order_id": 3, "status": "received", "message": "...", "timestamp": "..."}, ...] }
GET /vue/telemetry - 取得玩家位置和動作資料
    { "telemetry": [{"player_id": "player1", "data": {"x": 100, "y": 200}, "timestamp": "..."}, ...] }

獲取貨物最新資訊:
POST /vue/cargo - 接收貨物數據
    { "message": "貨物已儲存", "total_cargo": 250, "saved_count": 250 }
GET /vue/cargo?limit=100 - 取得貨物數據
    { "cargo": [...], "total": 250 }
GET /vue/cargo/latest - 取得最新貨物數據
    { "id": "case 250", "position": {...}, "size": {...}, "timestamp": "..." }
DELETE /vue/cargo - 清空貨物數據
    { "message": "貨物數據已清空", "total_cargo": 0 }
"""
