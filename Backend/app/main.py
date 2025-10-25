#!/usr/bin/env python3
"""
Simple WebSocket Server for Order Management
使用基本的 WebSocket 和 JSON 處理訂單訊息
"""

import asyncio
import json
import websockets
import logging
from datetime import datetime
import os
from pathlib import Path

# 配置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 數據存儲配置
DATA_DIR = Path("data")
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
        # 先寫入臨時文件，確保數據完整性
        temp_file = DATA_FILE.with_suffix('.tmp')
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        # 替換原文件
        temp_file.replace(DATA_FILE)
        logger.info(f"成功保存數據到 {DATA_FILE}")
        return True
    except Exception as e:
        logger.error(f"保存數據時發生錯誤: {e}")
        return False

# 從文件加載現有數據
orders_db, order_counter = load_data()

# 連線管理
connected_clients = set()

async def handle_client(websocket):
    """處理客戶端連線"""
    global order_counter  # 在函數開頭統一聲明全域變數
    
    client_id = id(websocket)
    connected_clients.add(websocket)
    logger.info(f"Client {client_id} connected. Total clients: {len(connected_clients)}")

    try:
        async for message in websocket:
            try:
                # 解析接收到的訊息
                data = json.loads(message)
                logger.info(f"Received from client {client_id}: {data}")

                # 處理不同類型的訊息
                if data.get("type") == "custom_message":
                    # 處理訂單訊息
                    order_content = data.get("content", "")
                    timestamp = data.get("timestamp", datetime.utcnow().isoformat())

                    # 創建訂單記錄
                    order = {
                        "id": order_counter,
                        "content": order_content,
                        "timestamp": timestamp,
                        "client_id": client_id
                    }

                    orders_db.append(order)
                    order_counter += 1
                    save_data()  # 保存數據到文件

                    logger.info(f"Order saved: {order_content}")

                    # 回傳確認訊息給發送者
                    response = {
                        "type": "order_confirmation",
                        "order_id": order["id"],
                        "content": order_content,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    await websocket.send(json.dumps(response))

                    # 廣播給所有連線的客戶端
                    await broadcast_to_all({
                        "type": "new_order",
                        "order": order
                    })

                elif data.get("type") == "clear_orders":
                    # 清空所有訂單
                    logger.info(f"BEFORE CLEAR - Orders count: {len(orders_db)}, Counter: {order_counter}")
                    logger.info(f"BEFORE CLEAR - Orders: {orders_db}")
                    
                    orders_db.clear()
                    order_counter = 1
                    save_data()  # 保存數據到文件
                    
                    logger.info(f"AFTER CLEAR - Orders count: {len(orders_db)}, Counter: {order_counter}")
                    logger.info(f"AFTER CLEAR - Orders: {orders_db}")

                    # 廣播清空訂單的通知
                    await broadcast_to_all({
                        "type": "orders_cleared",
                        "timestamp": datetime.utcnow().isoformat()
                    })

                elif data.get("type") == "delete_order":
                    # 刪除單個訂單
                    order_id = data.get("order_id")
                    if order_id is None:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "message": "Missing order_id parameter",
                            "timestamp": datetime.utcnow().isoformat()
                        }))
                        continue

                    # 查找並刪除訂單
                    order_to_delete = None
                    for order in orders_db:
                        if order["id"] == order_id:
                            order_to_delete = order
                            break

                    if order_to_delete:
                        orders_db.remove(order_to_delete)
                        save_data()  # 保存數據到文件

                        logger.info(f"Order {order_id} deleted successfully")

                        # 回傳確認訊息給發送者
                        response = {
                            "type": "order_deleted",
                            "order_id": order_id,
                            "timestamp": datetime.utcnow().isoformat()
                        }
                        await websocket.send(json.dumps(response))

                        # 廣播給所有連線的客戶端
                        await broadcast_to_all({
                            "type": "order_deleted",
                            "order_id": order_id,
                            "timestamp": datetime.utcnow().isoformat()
                        })
                    else:
                        # 訂單不存在
                        await websocket.send(json.dumps({
                            "type": "error",
                            "message": f"Order with ID {order_id} not found",
                            "timestamp": datetime.utcnow().isoformat()
                        }))

                elif data.get("type") == "get_orders":
                    # 請求訂單列表
                    logger.info(f"GET_ORDERS - Current orders count: {len(orders_db)}, Counter: {order_counter}")
                    logger.info(f"GET_ORDERS - Orders: {orders_db}")
                    
                    response = {
                        "type": "orders_list",
                        "orders": orders_db[-50:],  # 返回最近50筆訂單
                        "total": len(orders_db),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    await websocket.send(json.dumps(response))

                else:
                    logger.warning(f"Unknown message type: {data.get('type')}")

            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON received from client {client_id}: {message}")
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON format",
                    "timestamp": datetime.utcnow().isoformat()
                }))

    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Client {client_id} disconnected")
    finally:
        connected_clients.discard(websocket)

async def broadcast_to_all(message):
    """廣播訊息給所有連線的客戶端"""
    if connected_clients:
        message_json = json.dumps(message)
        # 創建任務列表來並行發送
        tasks = [client.send(message_json) for client in connected_clients]
        # 等待所有發送完成，忽略連線錯誤
        await asyncio.gather(*tasks, return_exceptions=True)

async def periodic_status_update():
    """定期發送系統狀態更新"""
    while True:
        try:
            await asyncio.sleep(30)  # 每30秒發送一次狀態更新

            status_message = {
                "type": "status_update",
                "total_orders": len(orders_db),
                "connected_clients": len(connected_clients),
                "uptime": "active",
                "timestamp": datetime.utcnow().isoformat()
            }

            await broadcast_to_all(status_message)

        except Exception as e:
            logger.error(f"Error in status update: {e}")

async def main():
    """主函數"""
    # 獲取環境變數或使用預設值
    host = os.getenv("WS_HOST", "0.0.0.0")
    port = int(os.getenv("WS_PORT", "8000"))

    logger.info(f"Starting WebSocket server on {host}:{port}")

    # 啟動狀態更新任務
    asyncio.create_task(periodic_status_update())

    # 啟動 WebSocket 服務器
    async with websockets.serve(handle_client, host, port):
        logger.info("WebSocket server started successfully!")
        await asyncio.Future()  # 保持服務器運行

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
