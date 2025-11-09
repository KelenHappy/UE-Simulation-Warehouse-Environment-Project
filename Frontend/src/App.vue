<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- 標題和連線狀態 -->
      <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              倉儲訂單系統
            </h1>
            <p class="text-center text-gray-600 mt-2">Order Management System</p>
          </div>

          <!-- 連線狀態和功能按鈕 -->
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 rounded-full" :class="isConnected ? 'bg-green-500' : 'bg-red-500'"></div>
              <span class="text-sm font-medium" :class="isConnected ? 'text-green-600' : 'text-red-600'">
                {{ isConnected ? '已連線' : '未連線' }}
              </span>
            </div>
            <button
              @click="showThreeScene = !showThreeScene"
              :class="showThreeScene ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-500 hover:bg-indigo-600'"
              class="px-4 py-2 text-white rounded-lg transition-all duration-300 font-medium flex items-center gap-2"
            >
              <span>🎮</span>
              {{ showThreeScene ? '關閉 3D 場景' : '開啟 3D 場景' }}
            </button>
            <button
              @click="toggleConnection"
              :class="isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'"
              class="px-4 py-2 text-white rounded-lg transition-all duration-300 font-medium"
            >
              {{ isConnected ? '斷開連線' : '連線後端' }}
            </button>
          </div>
        </div>

        <!-- 連線資訊 -->
        <div v-if="errorMessage" class="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
          {{ errorMessage }}
        </div>
      </div>

      <!-- 主要內容區 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 左側：訂單歷史 -->
        <div class="bg-white rounded-2xl shadow-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-800">訂單列表</h2>
            <button
              @click="clearOrders"
              class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 text-sm font-medium"
            >
              清空
            </button>
          </div>

          <div class="space-y-3 max-h-[600px] overflow-y-auto">
            <div
              v-if="orders.length === 0"
              class="text-center py-12 text-gray-400"
            >
              <p class="text-lg">暫無訂單</p>
              <p class="text-sm mt-2">請在右側建立新訂單</p>
            </div>

            <div
              v-for="order in orders"
              :key="order.id"
              class="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="font-bold text-gray-800">訂單 {{ order.id }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500">{{ order.time }}</span>
                  <button
                    @click="deleteOrder(order.id)"
                    class="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-all duration-200"
                    title="刪除訂單"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div class="text-lg font-mono text-blue-700">
                {{ order.content }}
              </div>
            </div>
          </div>
        </div>

        <!-- 右側：訂單發送 -->
        <div class="bg-white rounded-2xl shadow-xl p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">訂單發送</h2>

          <!-- 數字輸入區 -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">輸入數字</label>
            <div class="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl border-2 border-gray-300 min-h-[120px]">
              <div
                v-for="(num, index) in numbers"
                :key="`${num}-${index}`"
                class="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md border-2 border-blue-300"
              >
                <input
                  v-model.number="numbers[index]"
                  type="number"
                  class="w-20 text-center font-bold text-lg text-blue-600 focus:outline-none"
                  min="1"
                  max="999"
                  @input="validateNumber(index)"
                />
                <button
                  @click="removeNumber(index)"
                  class="text-red-500 hover:text-red-700 font-bold"
                >
                  ✕
                </button>
              </div>

              <button
                @click="addNumber"
                class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-300 font-bold shadow-md"
              >
                + 新增
              </button>
            </div>
          </div>

          <!-- 預覽區 -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">訂單預覽</label>
            <div class="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl text-center">
              <div class="text-2xl font-mono font-bold text-blue-700">
                {{ orderPreview }}
              </div>
            </div>
          </div>

          <!-- 操作按鈕 -->
          <div class="grid grid-cols-2 gap-4">
            <button
              @click="generateRandom"
              class="px-6 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl hover:from-orange-600 hover:to-yellow-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-bold text-lg"
            >
              🎲 隨機生成
            </button>

            <button
              @click="submitOrder"
              :disabled="numbers.length === 0"
              class="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg font-bold text-lg"
            >
              📤 送出訂單
            </button>
          </div>

          <!-- 快速操作 -->
          <div class="mt-6 pt-6 border-t-2 border-gray-200">
            <label class="block text-sm font-medium text-gray-700 mb-3">快速操作</label>
            <div class="flex gap-2 flex-wrap">
              <button
                @click="clearNumbers"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300 font-medium"
              >
                清空數字
              </button>
              <button
                @click="addMultipleNumbers(3)"
                class="px-4 py-2 bg-blue-200 text-blue-700 rounded-lg hover:bg-blue-300 transition-all duration-300 font-medium"
              >
                新增3個
              </button>
              <button
                @click="addMultipleNumbers(5)"
                class="px-4 py-2 bg-purple-200 text-purple-700 rounded-lg hover:bg-purple-300 transition-all duration-300 font-medium"
              >
                新增5個
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Three.js 3D 場景區域 -->
      <div v-if="showThreeScene" class="mt-6 bg-white rounded-2xl shadow-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-800">3D 場景視圖</h2>
          <button
            @click="showThreeScene = false"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300 text-sm font-medium"
          >
            關閉
          </button>
        </div>
        <ThreeScene />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import ThreeScene from './components/ThreeScene.vue'

// WebSocket 連線狀態
const isConnected = ref(false)
const errorMessage = ref('')
let websocket = null

// 清空狀態標誌
const isClearing = ref(false)

// 3D 場景顯示狀態
const showThreeScene = ref(false)

// 數字列表
const numbers = ref([10, 20, 30])

// 訂單列表 - 初始化為空數組，完全依賴後端
const orders = ref([])

// 訂單計數器 - 初始化為1，完全依賴後端
const orderCounter = ref(1)

// 保存訂單到 localStorage（保留備用，但前端不會主動調用）
const saveOrders = () => {
  // 不再使用 localStorage，完全依賴後端
  console.log('Frontend no longer uses localStorage for orders')
}

// 監視數字列表變化，自動去重
watch(numbers, (newNumbers) => {
  // 創建一個 Set 來去重，然後轉換回數組
  const uniqueNumbers = [...new Set(newNumbers)]
  // 如果去重後的數組長度不同，說明有重複，更新數組
  if (uniqueNumbers.length !== newNumbers.length) {
    numbers.value = uniqueNumbers
  }
}, { deep: true })

// WebSocket 連線管理
const connectWebSocket = () => {
  try {
    const proto = (typeof window !== 'undefined' && window.location?.protocol === 'https:') ? 'wss' : 'ws'
    const host = (typeof window !== 'undefined' && window.location?.hostname) ? window.location.hostname : 'localhost'
    const fallback = `${proto}://${host}:8000/ws`
    const wsUrl = import.meta?.env?.VITE_WS_URL || fallback
    websocket = new WebSocket(wsUrl)

    websocket.onopen = () => {
      console.log('Connected to WebSocket server')
      isConnected.value = true
      errorMessage.value = ''

      // 如果正在清空過程中，不要請求訂單列表，等待後端確認
      if (!isClearing.value) {
        sendMessage({
          type: 'get_orders',
          timestamp: new Date().toISOString()
        })
      } else {
        // 如果正在清空過程中重新連線，請求訂單列表確認清空狀態
        sendMessage({
          type: 'get_orders',
          timestamp: new Date().toISOString()
        })
      }
    }

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        handleMessage(message)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    websocket.onclose = () => {
      console.log('WebSocket connection closed')
      isConnected.value = false
      errorMessage.value = '連線已斷開'
      isClearing.value = false // 連線斷開時重置清空標誌
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
      errorMessage.value = `連線錯誤：${error?.message || '未知錯誤'}`
      isConnected.value = false
    }

  } catch (error) {
    console.error('Failed to create WebSocket connection:', error)
    errorMessage.value = '無法連接到伺服器'
  }
}

const disconnectWebSocket = () => {
  if (websocket) {
    websocket.close()
    websocket = null
    isConnected.value = false
  }
}

const sendMessage = (message) => {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(message))
  }
}

const handleMessage = (message) => {
  console.log('Received message:', message)

  switch (message.type) {
    case 'order_confirmation':
      console.log('Order confirmed by server:', message.order_id)
      // 可以顯示確認訊息給用戶
      break

    case 'new_order':
      console.log('New order received:', message.order)
      // 將新訂單添加到本地訂單列表
      orders.value.unshift({
        id: message.order.id,
        content: message.order.content,
        time: new Date(message.order.timestamp).toLocaleTimeString()
      })
      break

    case 'orders_list':
      console.log('Orders list received:', message.orders)
      // 更新本地訂單列表
      orders.value = message.orders.map(order => ({
        id: order.id,
        content: order.content,
        time: new Date(order.timestamp).toLocaleTimeString()
      }))
      // 計算下一個訂單 ID（最大訂單 ID + 1）
      orderCounter.value = message.orders.length > 0 ? Math.max(...message.orders.map(o => o.id)) + 1 : 1
      break

    case 'status_update':
      console.log('Status update:', message)
      // 更新連線狀態資訊
      break

    case 'order_deleted':
      console.log('Order deleted:', message.order_id)
      // 從本地訂單列表中移除已刪除的訂單
      orders.value = orders.value.filter(order => order.id !== message.order_id)
      break

    case 'error':
      console.error('Server error:', message.message)
      errorMessage.value = message.message
      // 3秒後自動清除錯誤消息
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
      break

    default:
      console.log('Unhandled message type:', message.type)
  }
}

const toggleConnection = () => {
  if (isConnected.value) {
    disconnectWebSocket()
  } else {
    connectWebSocket()
  }
}

// 訂單管理函數
const addNumber = () => {
  // 檢查是否已經有數字 0 存在，避免重複
  if (!numbers.value.includes(0)) {
    numbers.value.push(0)
  }
}

const removeNumber = (index) => {
  numbers.value.splice(index, 1)
}

const clearNumbers = () => {
  numbers.value = []
}

const addMultipleNumbers = (count) => {
  for (let i = 0; i < count; i++) {
    // 檢查是否已經有數字 0 存在，避免重複
    if (!numbers.value.includes(0)) {
      numbers.value.push(0)
    }
  }
}

const validateNumber = (index) => {
  const num = numbers.value[index]
  // 確保數字在有效範圍內
  if (num < 1) {
    numbers.value[index] = 1
  } else if (num > 999) {
    numbers.value[index] = 999
  }
  // 觸發去重（通過 watch 監視器）
}

const generateRandom = () => {
  const count = Math.floor(Math.random() * 5) + 3 // 3-7個數字
  const usedNumbers = new Set()

  // 生成不重複的隨機數字
  while (usedNumbers.size < count) {
    const randomNum = Math.floor(Math.random() * 100) + 1 // 1-100
    usedNumbers.add(randomNum)
  }

  numbers.value = Array.from(usedNumbers)
}

// 訂單預覽
const orderPreview = computed(() => {
  if (numbers.value.length === 0) return '(空訂單)'
  return numbers.value.join('-')
})

const submitOrder = () => {
  if (numbers.value.length === 0) return

  const orderContent = numbers.value.join('-')

  // 發送訂單訊息到後端
  if (isConnected.value) {
    sendMessage({
      type: 'custom_message',
      content: orderContent,
      timestamp: new Date().toISOString()
    })

    // 清空輸入，但不立即添加到本地列表
    // 後端會通過 new_order 訊息同步回來
    numbers.value = []
  } else {
    // 如果沒有連線，則本地處理（備用模式）
    const newOrder = {
      id: orderCounter.value++,
      content: orderContent,
      time: new Date().toLocaleTimeString()
    }

    orders.value.unshift(newOrder)
    numbers.value = []

    // 可選：限制訂單歷史數量
    if (orders.value.length > 50) {
      orders.value = orders.value.slice(0, 50)
    }
  }
}

const clearOrders = () => {
  if (!isConnected.value) {
    errorMessage.value = '請先連線到後端再清空訂單，否則無法刪除後端資料，刷新後訂單會恢復。';
    return;
  }
  if (confirm('確定要清空所有訂單嗎？')) {
    isClearing.value = true;
    orders.value = [];
    orderCounter.value = 1;
    sendMessage({
      type: 'clear_orders',
      timestamp: new Date().toISOString()
    });
  }
}

const deleteOrder = (orderId) => {
  if (!isConnected.value) {
    errorMessage.value = '請先連線到後端再刪除訂單，否則無法刪除後端資料。';
    return;
  }
  if (confirm(`確定要刪除訂單 ${orderId} 嗎？`)) {
    sendMessage({
      type: 'delete_order',
      order_id: orderId,
      timestamp: new Date().toISOString()
    });
  }
}

// 生命週期鉤子
onMounted(() => {
  connectWebSocket()
})

onUnmounted(() => {
  disconnectWebSocket()
})
</script>

<style scoped>
/* 隱藏數字輸入的上下箭頭 */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* 自定義滾動條 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
