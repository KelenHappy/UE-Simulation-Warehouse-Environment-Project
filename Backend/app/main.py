#!/usr/bin/env python3
"""
FastAPI-based API server with REST and WebSocket endpoints
提供訂單管理的 REST API 與 WebSocket 即時廣播
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
import os
from pathlib import Path
from typing import List, Dict, Any, Optional, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 配置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 數據存儲配置（固定到 Backend/data，與執行目錄無關）
BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
DATA_FILE = DATA_DIR / "app_data.json"

# 創建數據目錄
DATA_DIR.mkdir(parents=True, exist_ok=True)

def load_data():
    """從JSON文件加載數據"""
    if not DATA_FILE.exists():
        logger.info(f"沒有找到現有數據文件，使用空數據啟動")
        return [], 1

    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        orders = data.get('orders', [])
        counter = data.get('order_counter', len(orders) + 1)
        logger.info(f"成功加載 {len(orders)} 筆訂單")
        return orders, counter
    except Exception as e:
        logger.error(f"加載數據時發生錯誤: {e}")
        return [], 1

def save_data():
    """保存數據到JSON文件"""
    try:
        data = {
            "orders": orders_db,
            "order_counter": order_counter
        }
        temp_file = DATA_FILE.with_suffix('.tmp')
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        temp_file.replace(DATA_FILE)
        logger.info(f"成功保存數據到 {DATA_FILE}")
        return True
    except Exception as e:
        logger.error(f"保存數據時發生錯誤: {e}")
        return False

# 狀態
orders_db, order_counter = load_data()
connected_clients: Set[WebSocket] = set()

# FastAPI 應用
app = FastAPI(title="AutoWarehouse API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 掛載 UE4 專用路由（支援以 `python app/main.py` 直接啟動）
try:
    from app.services.send_to_UE import router as ue_router
except ModuleNotFoundError:
    # 當以腳本形式在 `app` 目錄內執行時，將父目錄加入 sys.path
    import sys as _sys
    from pathlib import Path as _Path
    _parent = _Path(__file__).resolve().parents[1]
    if str(_parent) not in _sys.path:
        _sys.path.insert(0, str(_parent))
    from app.services.send_to_UE import router as ue_router
app.include_router(ue_router)

class CreateOrderRequest(BaseModel):
    content: Optional[str] = None
    items: Optional[List[int]] = None
    timestamp: Optional[str] = None

class OrderResponse(BaseModel):
    id: int
    content: str
    timestamp: str
    client_id: Optional[int] = None
    items: Optional[List[int]] = None


def parse_items_from_content(content: str) -> List[int]:
    """將像 '75-12-43' 的內容拆成整數陣列 [75,12,43]，忽略非數字/空白"""
    if not content:
        return []
    items: List[int] = []
    for part in content.split('-'):
        part = part.strip()
        if not part:
            continue
        try:
            items.append(int(part))
        except ValueError:
            # 忽略無法轉為整數的片段
            continue
    return items

async def broadcast_to_all(message: Dict[str, Any]):
    """廣播訊息給所有連線的客戶端"""
    if not connected_clients:
        return
    message_json = json.dumps(message)
    tasks = []
    for client in list(connected_clients):
        try:
            tasks.append(client.send_text(message_json))
        except RuntimeError:
            # 連線已關閉或無效
            connected_clients.discard(client)
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)

async def periodic_status_update():
    """定期發送系統狀態更新"""
    while True:
        try:
            await asyncio.sleep(30)
            status_message = {
                "type": "status_update",
                "total_orders": len(orders_db),
                "connected_clients": len(connected_clients),
                "uptime": "active",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            await broadcast_to_all(status_message)
        except Exception as e:
            logger.error(f"Error in status update: {e}")

@app.on_event("startup")
async def on_startup():
    # 啟動背景任務
    asyncio.create_task(periodic_status_update())
    logger.info("FastAPI server started with background status updater")
    # 對外暴露共用狀態，供 UE 路由使用
    app.state.orders_db = orders_db
    # 列出已註冊路由，便於除錯
    try:
        route_paths = [getattr(r, 'path', str(r)) for r in app.router.routes]
        logger.info(f"Registered routes: {route_paths}")
    except Exception:
        pass

@app.get("/health")
async def health():
    return {"status": "ok", "orders": len(orders_db), "clients": len(connected_clients)}

@app.get("/orders")
async def list_orders(limit: int = 50):
    recent = orders_db[-limit:]
    return {"orders": recent, "total": len(orders_db)}

@app.post("/orders", response_model=OrderResponse)
async def create_order(payload: CreateOrderRequest):
    global order_counter
    # 允許前端以 items 或 content 傳入，互相推導
    if payload.items and not payload.content:
        content = "-".join(str(n) for n in payload.items)
        items = payload.items
    elif payload.content and not payload.items:
        content = payload.content
        items = parse_items_from_content(payload.content)
    elif payload.content and payload.items:
        # 兩者皆提供，以 content 為準並重新解析 items
        content = payload.content
        items = parse_items_from_content(payload.content)
    else:
        content = ""
        items = []

    order = {
        "id": order_counter,
        "content": content,
        "items": items,
        "timestamp": payload.timestamp or datetime.now(timezone.utc).isoformat(),
        "client_id": None,
    }
    orders_db.append(order)
    order_counter += 1
    save_data()

    await broadcast_to_all({"type": "new_order", "order": order})
    return order  # FastAPI 會依 response_model 轉換

@app.delete("/orders/{order_id}")
async def delete_order(order_id: int):
    target = None
    for o in orders_db:
        if o["id"] == order_id:
            target = o
            break
    if not target:
        raise HTTPException(status_code=404, detail="Order not found")

    orders_db.remove(target)
    save_data()
    await broadcast_to_all({"type": "order_deleted", "order_id": order_id, "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"status": "deleted", "order_id": order_id}

@app.delete("/orders")
async def clear_orders():
    global order_counter
    orders_db.clear()
    order_counter = 1
    save_data()
    await broadcast_to_all({"type": "orders_cleared", "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"status": "cleared"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    client_id = id(websocket)
    logger.info(f"WS connected: {client_id}, total={len(connected_clients)}")
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"type": "error", "message": "Invalid JSON"}))
                continue

            msg_type = data.get("type")
            if msg_type == "custom_message":
                # 舊協議相容：透過 WS 新增訂單
                content = data.get("content", "")
                timestamp = data.get("timestamp", datetime.now(timezone.utc).isoformat())
                global order_counter
                order = {
                    "id": order_counter,
                    "content": content,
                    "items": parse_items_from_content(content),
                    "timestamp": timestamp,
                    "client_id": client_id,
                }
                orders_db.append(order)
                order_counter += 1
                save_data()

                await websocket.send_text(json.dumps({
                    "type": "order_confirmation",
                    "order_id": order["id"],
                    "content": content,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }))
                await broadcast_to_all({"type": "new_order", "order": order})

            elif msg_type == "get_orders":
                response = {
                    "type": "orders_list",
                    "orders": orders_db[-50:],
                    "total": len(orders_db),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
                await websocket.send_text(json.dumps(response))

            elif msg_type == "delete_order":
                order_id = data.get("order_id")
                if order_id is None:
                    await websocket.send_text(json.dumps({"type": "error", "message": "Missing order_id"}))
                    continue
                target = None
                for o in orders_db:
                    if o["id"] == order_id:
                        target = o
                        break
                if not target:
                    await websocket.send_text(json.dumps({"type": "error", "message": "Order not found"}))
                    continue
                orders_db.remove(target)
                save_data()
                await websocket.send_text(json.dumps({"type": "order_deleted", "order_id": order_id}))
                await broadcast_to_all({"type": "order_deleted", "order_id": order_id, "timestamp": datetime.now(timezone.utc).isoformat()})

            elif msg_type == "clear_orders":
                orders_db.clear()
                order_counter = 1
                save_data()
                await broadcast_to_all({"type": "orders_cleared", "timestamp": datetime.now(timezone.utc).isoformat()})

            else:
                logger.warning(f"Unknown WS message type: {msg_type}")
    except WebSocketDisconnect:
        logger.info(f"WS disconnected: {client_id}")
    finally:
        connected_clients.discard(websocket)

# 相容舊用法：允許 ws 根路徑連線（ws://host:port）
@app.websocket("/")
async def websocket_root_alias(websocket: WebSocket):
    # 轉接至主要處理邏輯
    await websocket_endpoint(websocket)

if __name__ == "__main__":
    # 提供本地啟動方式： uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    import uvicorn
    host = os.getenv("WS_HOST", "0.0.0.0")
    port = int(os.getenv("WS_PORT", "8000"))
    # 直接以物件啟動，避免字串匯入在不同工作目錄下失敗
    uvicorn.run(app, host=host, port=port, reload=False)
