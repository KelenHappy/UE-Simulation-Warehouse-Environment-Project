# UE4.27 Blueprint WebSocket Client

這個範例展示如何在 UE4.27 中使用 Blueprint 創建 WebSocket 客戶端來連接到我們的 FastAPI 後端。

## 步驟 1: 創建新的 Blueprint Actor

1. 在 UE4.27 編輯器中，創建一個新的 Blueprint Class
2. 選擇基類為 `Actor`
3. 命名為 `BP_WebSocketClient`

## 步驟 2: 添加變數

在 Blueprint 中添加以下變數：

### WebSocket 相關變數：
- `ServerURL` (String): WebSocket 伺服器 URL，預設為 "ws://localhost:8000/ws/ue/blueprint_client"
- `ClientID` (String): 客戶端 ID，預設為 "UE_Blueprint_Client"
- `IsConnected` (Boolean): 連接狀態

### 玩家資料變數：
- `PlayerPosition` (Vector): 玩家位置
- `PlayerRotation` (Rotator): 玩家旋轉
- `PlayerVelocity` (Vector): 玩家速度

## 步驟 3: 添加連接管理函數

創建以下 Blueprint 函數：

### ConnectToServer 函數：
```blueprint
// 創建 WebSocket 連接
Create WebSocket (ServerURL)

// 綁定事件處理器
Bind Event to OnWebSocketConnected:
    - Set IsConnected = true
    - Print String: "Connected to WebSocket server"

Bind Event to OnWebSocketConnectionError:
    - Set IsConnected = false
    - Print String: "Connection Error: " + ErrorMessage

Bind Event to OnWebSocketClosed:
    - Set IsConnected = false
    - Print String: "Connection Closed"

Bind Event to OnWebSocketMessageReceived:
    - Print String: "Received: " + MessageString

// 連接
Connect WebSocket
```

### DisconnectFromServer 函數：
```blueprint
// 關閉連接
Close WebSocket
Set IsConnected = false
```

## 步驟 4: 添加資料發送函數

### SendPlayerData 函數：
```blueprint
// 檢查是否已連接
If IsConnected is true:
    // 創建 JSON 資料結構
    Create JSON Object (PositionData)
    Set Number Field (x) = PlayerPosition.X
    Set Number Field (y) = PlayerPosition.Y
    Set Number Field (z) = PlayerPosition.Z

    Create JSON Object (RotationData)
    Set Number Field (pitch) = PlayerRotation.Pitch
    Set Number Field (yaw) = PlayerRotation.Yaw
    Set Number Field (roll) = PlayerRotation.Roll

    Create JSON Object (VelocityData)
    Set Number Field (x) = PlayerVelocity.X
    Set Number Field (y) = PlayerVelocity.Y
    Set Number Field (z) = PlayerVelocity.Z

    // 創建主要訊息物件
    Create JSON Object (MessageData)
    Set Object Field (position) = PositionData
    Set Object Field (rotation) = RotationData
    Set Object Field (velocity) = VelocityData

    // 創建最終訊息
    Create JSON Object (FinalMessage)
    Set String Field (type) = "player_data"
    Set Object Field (data) = MessageData
    Set String Field (timestamp) = Current Timestamp (UTC)

    // 序列化並發送
    Serialize JSON to String (FinalMessage) -> MessageString
    Send Text Message (WebSocket, MessageString)
```

### SendPing 函數：
```blueprint
// 發送 ping 訊息
If IsConnected is true:
    Create JSON Object (PingMessage)
    Set String Field (type) = "ping"
    Set String Field (timestamp) = Current Timestamp (UTC)

    Serialize JSON to String (PingMessage) -> MessageString
    Send Text Message (WebSocket, MessageString)
```

## 步驟 5: 設置自動發送機制

在 BeginPlay 事件中：
```blueprint
// 設置定時器每 0.1 秒發送一次玩家資料
Set Timer by Event (SendPlayerData, 0.1 seconds, true)
```

在 Event Tick 中更新玩家資料：
```blueprint
// 更新玩家資料為當前 Actor 的 Transform
Set PlayerPosition = GetActorLocation
Set PlayerRotation = GetActorRotation
// 注意：Velocity 需要從 Character Movement 或其他地方獲取
```

## 步驟 6: 錯誤處理

添加錯誤處理：
```blueprint
// 在連接失敗時嘗試重新連接
If IsConnected is false:
    Delay (5.0 seconds)
    ConnectToServer
```

## 重要注意事項：

1. **WebSocket 插件**：確保在專案設定中啟用了 "WebSocketNetworking" 插件
2. **網路權限**：確保 UE4.27 有網路訪問權限
3. **測試環境**：先在本地測試，確認 FastAPI 後端正在運行
4. **資料格式**：確保發送的 JSON 格式與後端期望的格式匹配

## 範例使用：

1. 將 BP_WebSocketClient Actor 拖拽到場景中
2. 在 Details 面板中設置 ServerURL 和 ClientID
3. 運行遊戲，Actor 會自動連接到 WebSocket 伺服器
4. 開始移動角色，資料會自動發送到後端並轉發給網頁客戶端

這樣就能實現 UE4.27 Blueprint-only 的 WebSocket 客戶端！
