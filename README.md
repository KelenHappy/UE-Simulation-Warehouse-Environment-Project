# UE4.27 ↔ WebSocket ↔ SvelteKit 即時通訊橋接 Demo

這個專案展示了如何建立一個完整的即時通訊橋接系統，讓 UE4.27 客戶端能夠與網頁前端進行雙向通訊。

## 🏗️ 專案架構

```
UE-Simulation-Warehouse-Environment-Project/
├── Backend/                 # FastAPI WebSocket 後端
│   ├── app/
│   │   ├── main.py         # 主要的 FastAPI 應用程式
│   │   ├── models/         # 資料模型定義
│   │   └── services/       # WebSocket 服務層
│   ├── tests/              # 測試腳本
│   ├── requirements.txt    # Python 依賴項
│   └── .env               # 環境設定
├── Frontend/               # SvelteKit 前端應用
│   ├── src/
│   │   ├── routes/         # Svelte 頁面
│   │   └── app.html       # 應用程式入口
│   ├── package.json       # Node.js 依賴項
│   └── vite.config.ts     # Vite 設定
├── UE_Client/             # UE4.27 客戶端範例
│   └── README_Blueprint_WebSocket.md
└── start_demo.sh          # 啟動腳本
```

## 🚀 快速開始

### 1. 安裝依賴項

確保安裝了以下工具：
- **bun**: `curl -fsSL https://bun.sh/install | bash`
- **Python 3.8+**
- **Node.js 18+** (bun 會自動處理)
- **UE4.27** (用於測試 UE 客戶端)

### 2. 啟動演示

運行啟動腳本：
```bash
chmod +x start_demo.sh
./start_demo.sh
```

這會自動：
- 安裝前端依賴項
- 啟動 FastAPI 後端 (port 8000)
- 啟動 SvelteKit 前端 (port 5173)

### 3. 訪問應用程式

- **前端介面**: http://localhost:5173
- **WebSocket 端點**: ws://localhost:8000/ws/{client_type}/{client_id}

## 📡 WebSocket 通訊協定

### 客戶端類型
- `ue`: UE4.27 客戶端
- `svelte`: 網頁客戶端

### 訊息類型

#### UE4.27 → 後端
```json
{
  "type": "player_data",
  "data": {
    "position": {"x": 0.0, "y": 0.0, "z": 0.0},
    "rotation": {"pitch": 0.0, "yaw": 0.0, "roll": 0.0},
    "velocity": {"x": 0.0, "y": 0.0, "z": 0.0}
  },
  "timestamp": "2023-12-07T10:30:00Z"
}
```

#### 後端 → 所有客戶端
```json
{
  "type": "player_update",
  "client_id": "ue_client_01",
  "data": {
    "position": {"x": 0.0, "y": 0.0, "z": 0.0},
    "rotation": {"pitch": 0.0, "yaw": 0.0, "roll": 0.0},
    "velocity": {"x": 0.0, "y": 0.0, "z": 0.0}
  },
  "timestamp": "2023-12-07T10:30:00Z"
}
```

#### 連接狀態更新
```json
{
  "type": "connection_update",
  "client_type": "ue",
  "client_id": "ue_client_01",
  "status": "connected",
  "timestamp": "2023-12-07T10:30:00Z"
}
```

## 🎮 UE4.27 整合指南

### Blueprint-only 方法

請參考 `UE_Client/README_Blueprint_WebSocket.md` 來了解如何在 UE4.27 中創建 WebSocket 客戶端。

關鍵步驟：
1. 創建 Blueprint Actor
2. 使用 UE4.27 的 WebSocket 節點連接到伺服器
3. 定期發送玩家位置和動作資料
4. 處理伺服器的回應訊息

### 重要設定

確保在 UE4.27 專案中啟用了 **WebSocketNetworking** 插件：
- Edit → Project Settings → Plugins
- 搜尋並啟用 "WebSocket Networking"

## 🔧 開發指南

### 後端開發 (FastAPI)

```python
# 啟動開發服務器
cd Backend
python -m app.main
```

### 前端開發 (SvelteKit)

```bash
# 啟動開發服務器
cd Frontend
bun run dev
```

### 測試 WebSocket 連接

```python
# 運行測試腳本
cd Backend
python tests/test_websocket.py
```

## 🔒 安全考量

⚠️ **重要**: 此演示專案僅供開發測試使用！

生產環境請考慮：
- CORS 設定
- 認證和授權
- 速率限制
- 輸入驗證
- HTTPS/WSS 加密

## 🐛 故障排除

### 常見問題

1. **連接失敗**: 確認後端服務正在運行且防火牆設定正確
2. **CORS 錯誤**: 檢查後端 CORS 設定
3. **WebSocket 連線中斷**: 檢查網路連線和防火牆規則

### 除錯技巧

- 檢查瀏覽器開發者工具的 Console
- 查看後端終端機輸出
- 使用 WebSocket 測試工具驗證連線

## 📚 相關技術

- **FastAPI**: 高性能 Python Web 框架
- **SvelteKit**: 全端 Web 框架
- **WebSocket**: 雙向通訊協定
- **UE4.27 Blueprint**: 視覺化腳本系統

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

此專案僅供教育和演示用途。

---

🎮 **享受即時通訊體驗！**
