<template>
  <div class="cargo-test">
    <h2>🧪 Cargo Data 測試工具</h2>

    <div class="status-section">
      <h3>狀態</h3>
      <div class="status-grid">
        <div class="status-item">
          <span class="label">載入中:</span>
          <span :class="['value', loading ? 'active' : '']">{{ loading ? '是' : '否' }}</span>
        </div>
        <div class="status-item">
          <span class="label">錯誤:</span>
          <span class="value error">{{ error || '無' }}</span>
        </div>
        <div class="status-item">
          <span class="label">貨物總數:</span>
          <span class="value">{{ cargoData.length }}</span>
        </div>
        <div class="status-item">
          <span class="label">最後更新:</span>
          <span class="value">{{ lastUpdate || '未更新' }}</span>
        </div>
      </div>
    </div>

    <div class="actions-section">
      <h3>操作</h3>
      <div class="button-grid">
        <button @click="handleFetchCargo" :disabled="loading" class="btn btn-primary">
          📥 獲取貨物數據
        </button>
        <button @click="handleFetchLatest" :disabled="loading" class="btn btn-primary">
          🔄 獲取最新貨物
        </button>
        <button @click="handleClearCargo" :disabled="loading" class="btn btn-danger">
          🗑️ 清空貨物數據
        </button>
        <button @click="handleCreateTestData" :disabled="loading" class="btn btn-success">
          ➕ 創建測試數據
        </button>
        <button @click="isPolling ? stopPolling() : startPolling()" class="btn btn-secondary">
          {{ isPolling ? '⏸️ 停止輪詢' : '▶️ 開始輪詢' }}
        </button>
      </div>
    </div>

    <div class="data-section">
      <h3>貨物數據 (前10個)</h3>
      <div v-if="cargoData.length === 0" class="empty-state">
        <p>📦 暫無貨物數據</p>
        <p class="hint">點擊「創建測試數據」或「獲取貨物數據」來載入數據</p>
      </div>
      <div v-else class="cargo-list">
        <div
          v-for="(cargo, index) in cargoData.slice(0, 10)"
          :key="cargo.id"
          class="cargo-item"
        >
          <div class="cargo-header">
            <span class="cargo-id">{{ cargo.id }}</span>
            <span class="cargo-index">#{{ index + 1 }}</span>
          </div>
          <div class="cargo-details">
            <div class="detail-row">
              <span class="detail-label">位置:</span>
              <span class="detail-value">
                X: {{ cargo.position.x.toFixed(2) }},
                Y: {{ cargo.position.y.toFixed(2) }},
                Z: {{ cargo.position.z.toFixed(2) }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">尺寸:</span>
              <span class="detail-value">
                W: {{ cargo.size.x.toFixed(2) }},
                H: {{ cargo.size.y.toFixed(2) }},
                D: {{ cargo.size.z.toFixed(2) }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">時間:</span>
              <span class="detail-value timestamp">{{ formatTime(cargo.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="cargoData.length > 10" class="more-info">
        還有 {{ cargoData.length - 10 }} 個貨物未顯示...
      </div>
    </div>

    <div class="console-section">
      <h3>控制台輸出</h3>
      <div class="console-output">
        <div
          v-for="(log, index) in consoleLogs"
          :key="index"
          :class="['log-entry', log.type]"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCargoData } from '../composables/useCargoData.js'
import {
  convertBoxesToCargoData,
  saveCargoDataToBackend,
  clearCargoDataFromBackend
} from '../utils/cargoStorage.js'

// 使用 cargo 數據管理
const {
  cargoData,
  loading,
  error,
  lastUpdate,
  fetchCargoData,
  fetchLatestCargo,
  clearCargoData,
  startPolling,
  stopPolling
} = useCargoData({
  apiBaseUrl: 'http://localhost:8000',
  pollInterval: 3000,
  autoStart: false
})

// 控制台日誌
const consoleLogs = ref([])
const isPolling = ref(false)

// 添加日誌
function addLog(message, type = 'info') {
  const now = new Date()
  const time = now.toLocaleTimeString('zh-TW', { hour12: false })
  consoleLogs.value.push({ time, message, type })

  // 限制日誌數量
  if (consoleLogs.value.length > 50) {
    consoleLogs.value.shift()
  }
}

// 格式化時間
function formatTime(timestamp) {
  if (!timestamp) return '未知'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// 獲取貨物數據
async function handleFetchCargo() {
  try {
    addLog('正在獲取貨物數據...', 'info')
    await fetchCargoData(250)
    addLog(`✓ 成功獲取 ${cargoData.value.length} 個貨物數據`, 'success')
  } catch (err) {
    addLog(`✗ 獲取貨物數據失敗: ${err.message}`, 'error')
  }
}

// 獲取最新貨物
async function handleFetchLatest() {
  try {
    addLog('正在獲取最新貨物...', 'info')
    const latest = await fetchLatestCargo()
    if (latest) {
      addLog(`✓ 獲取最新貨物成功: ${latest.id}`, 'success')
    } else {
      addLog('⚠ 目前沒有貨物數據', 'warning')
    }
  } catch (err) {
    addLog(`✗ 獲取最新貨物失敗: ${err.message}`, 'error')
  }
}

// 清空貨物數據
async function handleClearCargo() {
  if (!confirm('確定要清空所有貨物數據嗎？')) {
    return
  }

  try {
    addLog('正在清空貨物數據...', 'info')
    await clearCargoDataFromBackend({
      apiBaseUrl: 'http://localhost:8000',
      onSuccess: () => {
        addLog('✓ 成功清空所有貨物數據', 'success')
      }
    })
    await fetchCargoData() // 重新獲取（應該是空的）
  } catch (err) {
    addLog(`✗ 清空貨物數據失敗: ${err.message}`, 'error')
  }
}

// 創建測試數據
async function handleCreateTestData() {
  try {
    addLog('正在創建測試數據...', 'info')

    // 創建 10 個測試貨物
    const testBoxes = []
    for (let i = 0; i < 10; i++) {
      testBoxes.push({
        position: {
          x: Math.random() * 10 - 5,
          y: Math.random() * 10 - 5,
          z: Math.random() * 10 - 5
        }
      })
    }

    const modelSize = { x: 1.0, y: 1.0, z: 1.0 }
    const testCargoData = convertBoxesToCargoData(testBoxes, modelSize)

    addLog(`已生成 ${testCargoData.length} 個測試貨物，正在發送到後端...`, 'info')

    const result = await saveCargoDataToBackend(testCargoData, {
      apiBaseUrl: 'http://localhost:8000'
    })

    if (result.success) {
      addLog(`✓ 成功創建並儲存 ${testCargoData.length} 個測試貨物`, 'success')
      await fetchCargoData() // 重新獲取數據
    } else {
      addLog(`✗ 儲存測試數據失敗: ${result.error}`, 'error')
    }
  } catch (err) {
    addLog(`✗ 創建測試數據失敗: ${err.message}`, 'error')
  }
}

// 切換輪詢狀態
function togglePolling() {
  if (isPolling.value) {
    stopPolling()
    addLog('⏸️ 已停止輪詢', 'info')
  } else {
    startPolling()
    addLog('▶️ 已開始輪詢（每3秒）', 'info')
  }
  isPolling.value = !isPolling.value
}
</script>

<style scoped>
.cargo-test {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h2 {
  color: #2c3e50;
  border-bottom: 3px solid #3498db;
  padding-bottom: 10px;
  margin-bottom: 30px;
}

h3 {
  color: #34495e;
  margin-bottom: 15px;
  font-size: 18px;
}

.status-section,
.actions-section,
.data-section,
.console-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.label {
  font-weight: 600;
  color: #555;
}

.value {
  color: #2c3e50;
  font-weight: 500;
}

.value.active {
  color: #3498db;
  font-weight: 700;
}

.value.error {
  color: #e74c3c;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
}

.btn-success {
  background: #2ecc71;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #27ae60;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(46, 204, 113, 0.3);
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(149, 165, 166, 0.3);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.empty-state p {
  margin: 10px 0;
}

.hint {
  font-size: 14px;
  color: #95a5a6;
}

.cargo-list {
  display: grid;
  gap: 15px;
}

.cargo-item {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 15px;
  background: #fafafa;
  transition: all 0.2s ease;
}

.cargo-item:hover {
  border-color: #3498db;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
}

.cargo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.cargo-id {
  font-weight: 700;
  color: #2c3e50;
  font-size: 16px;
}

.cargo-index {
  background: #3498db;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.cargo-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  gap: 10px;
}

.detail-label {
  font-weight: 600;
  color: #555;
  min-width: 50px;
}

.detail-value {
  color: #2c3e50;
  font-family: 'Courier New', monospace;
}

.timestamp {
  font-size: 12px;
  color: #7f8c8d;
}

.more-info {
  text-align: center;
  padding: 15px;
  color: #7f8c8d;
  font-style: italic;
}

.console-output {
  max-height: 300px;
  overflow-y: auto;
  background: #1e1e1e;
  padding: 15px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.log-entry {
  margin-bottom: 8px;
  display: flex;
  gap: 10px;
}

.log-time {
  color: #888;
  min-width: 80px;
}

.log-entry.info .log-message {
  color: #61dafb;
}

.log-entry.success .log-message {
  color: #98c379;
}

.log-entry.error .log-message {
  color: #e06c75;
}

.log-entry.warning .log-message {
  color: #e5c07b;
}

/* 滾動條樣式 */
.console-output::-webkit-scrollbar {
  width: 8px;
}

.console-output::-webkit-scrollbar-track {
  background: #2e2e2e;
}

.console-output::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.console-output::-webkit-scrollbar-thumb:hover {
  background: #777;
}
</style>
