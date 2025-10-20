#!/bin/bash

# UE4.27 WebSocket Bridge Demo Startup Script
# 使用 bun 啟動整個演示環境 (Vue.js 前端版本)

echo "🚀 Starting UE4.27 WebSocket Bridge Demo..."

# 檢查是否安裝了 bun
if ! command -v bun &> /dev/null; then
    echo "❌ Error: bun is not installed!"
    echo "請安裝 bun: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# 檢查 node_modules 是否存在
if [ ! -d "Frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd Frontend && bun install
    cd ..
fi

echo "🔧 Starting FastAPI Backend..."
cd Backend

# 安裝 Python 依賴（如果需要）
if [ ! -d "venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

# 啟動後端服務（在背景執行）
echo "🌐 Starting WebSocket server on port 8000..."
python -m app.main &
BACKEND_PID=$!

cd ..

echo "🎨 Starting Vue.js Frontend..."
cd Frontend

# 啟動前端開發服務器（在背景執行）
echo "⚡ Starting Vue.js development server on port 5173..."
bun run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "✅ Demo is now running!"
echo ""
echo "📋 Access URLs:"
echo "   🌐 Frontend: http://localhost:5173"
echo "   🔌 WebSocket: ws://localhost:8000"
echo ""
echo "📖 Next steps:"
echo "   1. Open UE4.27 project"
echo "   2. Create Blueprint WebSocket client (see UE_Client/README_Blueprint_WebSocket.md)"
echo "   3. Connect UE client to ws://localhost:8000/ws/ue/your_client_id"
echo ""
echo "🛑 To stop demo:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Enjoy the demo! 🎮"
