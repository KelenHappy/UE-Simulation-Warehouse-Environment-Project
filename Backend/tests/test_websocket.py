"""
Test script for the WebSocket bridge
"""

import asyncio
import json
import websockets
from datetime import datetime

async def test_websocket_connection():
    """Test WebSocket connection to the server"""
    uri = "ws://localhost:8000/ws/test/client1"

    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket server")

            # Send a test message
            test_message = {
                "type": "test",
                "data": {"message": "Hello from test client"},
                "timestamp": datetime.utcnow().isoformat()
            }

            await websocket.send(json.dumps(test_message))
            print(f"Sent: {test_message}")

            # Wait for response
            response = await websocket.recv()
            print(f"Received: {response}")

    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    print("Testing WebSocket connection...")
    asyncio.run(test_websocket_connection())
