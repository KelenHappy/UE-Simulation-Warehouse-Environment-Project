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

# 配置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 存儲訂單的簡單記憶體資料庫（使用列表作為全域變數）
orders_db = []
order_counter = 1

# 連線管理
connected_clients = set()

async def handle_client(websocket, path):
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
                    
                    logger.info(f"AFTER CLEAR - Orders count: {len(orders_db)}, Counter: {order_counter}")
                    logger.info(f"AFTER CLEAR - Orders: {orders_db}")

                    # 廣播清空訂單的通知
                    await broadcast_to_all({
                        "type": "orders_cleared",
                        "timestamp": datetime.utcnow().isoformat()
                    })

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
