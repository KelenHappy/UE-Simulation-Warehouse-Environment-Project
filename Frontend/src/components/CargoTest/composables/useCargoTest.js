import { ref } from 'vue'
import { useCargoData } from '../../../composables/useCargoData.js'
import {
  convertBoxesToCargoData,
  saveCargoDataToBackend,
  clearCargoDataFromBackend
} from '../../../utils/cargoStorage.js'

export function useCargoTest() {
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

  const consoleLogs = ref([])
  const isPolling = ref(false)

  function addLog(message, type = 'info') {
    const now = new Date()
    const time = now.toLocaleTimeString('zh-TW', { hour12: false })
    consoleLogs.value.push({ time, message, type })

    if (consoleLogs.value.length > 50) {
      consoleLogs.value.shift()
    }
  }

  async function handleFetchCargo() {
    try {
      addLog('正在獲取貨物數據...', 'info')
      await fetchCargoData(250)
      addLog(`✓ 成功獲取 ${cargoData.value.length} 個貨物數據`, 'success')
    } catch (err) {
      addLog(`✗ 獲取貨物數據失敗: ${err.message}`, 'error')
    }
  }

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
      await fetchCargoData()
    } catch (err) {
      addLog(`✗ 清空貨物數據失敗: ${err.message}`, 'error')
    }
  }

  async function handleCreateTestData() {
    try {
      addLog('正在創建測試數據...', 'info')

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
        await fetchCargoData()
      } else {
        addLog(`✗ 儲存測試數據失敗: ${result.error}`, 'error')
      }
    } catch (err) {
      addLog(`✗ 創建測試數據失敗: ${err.message}`, 'error')
    }
  }

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

  return {
    cargoData,
    loading,
    error,
    lastUpdate,
    consoleLogs,
    isPolling,
    handleFetchCargo,
    handleFetchLatest,
    handleClearCargo,
    handleCreateTestData,
    togglePolling
  }
}
