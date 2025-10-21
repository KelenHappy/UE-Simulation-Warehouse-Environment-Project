## 🎮 UE4.27 整合指南

### Blueprint-only 方法

請參考 `UE_Client/README_Blueprint_WebSocket.md` 來了解如何在 UE4.27 中創建 WebSocket 客戶端。  
[Content](https://ln5.sync.com/dl/24e7a1010#zij2d27d-xmzrtcty-4k5i63ia-4g6gimfu)  
關鍵步驟：  
1. 創建 Blueprint Actor
2. 使用 UE4.27 的 WebSocket 節點連接到伺服器
3. 定期發送玩家位置和動作資料
4. 處理伺服器的回應訊息

### 重要設定

確保在 UE4.27 專案中啟用了 **WebSocketNetworking** 插件：
- Edit → Project Settings → Plugins
- 搜尋並啟用 "WebSocket Networking"

# UE4.27 ↔ WebSocket ↔ Vue.js 即時通訊橋接 

這個專案展示了如何建立一個完整的即時通訊橋接系統，讓 UE4.27 客戶端能夠與網頁前端進行雙向通訊。現在採用現代化的 Vue.js 前端介面。

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
├── Frontend/               # Vue.js 前端應用
│   ├── src/
│   │   ├── App.vue        # 主要的 Vue 組件
│   │   └── main.js        # 應用程式入口
│   ├── index.html         # HTML 模板
│   ├── package.json       # Node.js 依賴項
│   ├── vite.config.js     # Vite 設定
│   └── .gitignore         # Git 忽略規則
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

### 2. 訪問應用程式

- **前端介面**: http://localhost:5173
- **WebSocket 端點**: ws://localhost:8000/ws/{client_type}/{client_id}

## 🎯 前端功能特色

### 訂單管理系統

Vue.js 前端提供了一個直觀的訂單管理介面：

#### 左側面板 - 訂單歷史
- 顯示所有提交的訂單記錄
- 格式：`訂單 1. 10-20-5-3`
- 包含時間戳記
- 支援清空歷史記錄

#### 右側面板 - 訂單發送

**數字輸入區**:
- 可動態新增/刪除數字輸入框
- 支援數值範圍設定（0-999）
- 即時預覽訂單格式

**操作功能**:
- **🎲 隨機生成**: 自動產生 3-7 個隨機數字
- **📤 送出訂單**: 將數字組合提交為訂單
- **清空數字**: 一鍵清除所有輸入
- **快速新增**: 可選擇新增 3 或 5 個數字框

**設計特點**:
- 現代化漸變背景設計
- 響應式佈局（支援各種螢幕尺寸）
- 流暢的動畫過渡效果
- 使用 TailwindCSS 樣式框架

## 📡 WebSocket 通訊協定

### 客戶端類型
- `ue`: UE4.27 客戶端
- `svelte`: 網頁客戶端（保留相容性）

### 訊息類型

#### UE4.27 → 後端
[Varest](https://github.com/ufna/VaRest/tree/develop?tab=readme-ov-file)  

## 🔧 開發指南

### 後端開發 (FastAPI)

```python
# 啟動開發服務器
cd Backend
python -m app.main
```

### 前端開發 (Vue.js)

```bash
# 啟動開發服務器
cd Frontend
bun run dev
```

### 建置生產版本

```bash
# 前端建置
cd Frontend
bun run build

# 後端部署
cd Backend
# 使用 uvicorn 或 gunicorn 部署
```

### 測試 WebSocket 連接

```python
# 運行測試腳本
cd Backend
python tests/test_websocket.py
```

## 📄 授權

此專案僅供教育和演示用途。

---
