<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- 標題 -->
      <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <h1 class="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          倉儲訂單系統
        </h1>
        <p class="text-center text-gray-600 mt-2">Order Management System</p>
      </div>

      <!-- 主要內容區 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 左側：訊息/訂單歷史 -->
        <div class="bg-white rounded-2xl shadow-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-800">訂單歷史</h2>
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
                <span class="text-xs text-gray-500">{{ order.time }}</span>
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
                :key="index"
                class="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md border-2 border-blue-300"
              >
                <input 
                  v-model.number="numbers[index]"
                  type="number"
                  class="w-20 text-center font-bold text-lg text-blue-600 focus:outline-none"
                  min="0"
                  max="999"
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 數字列表
const numbers = ref([10, 20, 30])

// 訂單列表
const orders = ref([
  { id: 1, content: '10-20-5-3', time: new Date().toLocaleTimeString() }
])

// 訂單計數器
const orderCounter = ref(2)

// 新增數字
const addNumber = () => {
  numbers.value.push(0)
}

// 移除數字
const removeNumber = (index) => {
  numbers.value.splice(index, 1)
}

// 清空數字
const clearNumbers = () => {
  numbers.value = []
}

// 新增多個數字
const addMultipleNumbers = (count) => {
  for (let i = 0; i < count; i++) {
    numbers.value.push(0)
  }
}

// 生成隨機數字
const generateRandom = () => {
  const count = Math.floor(Math.random() * 5) + 3 // 3-7個數字
  numbers.value = []
  for (let i = 0; i < count; i++) {
    numbers.value.push(Math.floor(Math.random() * 100) + 1) // 1-100
  }
}

// 訂單預覽
const orderPreview = computed(() => {
  if (numbers.value.length === 0) return '(空訂單)'
  return numbers.value.join('-')
})

// 送出訂單
const submitOrder = () => {
  if (numbers.value.length === 0) return
  
  const newOrder = {
    id: orderCounter.value++,
    content: numbers.value.join('-'),
    time: new Date().toLocaleTimeString()
  }
  
  orders.value.unshift(newOrder)
  
  // 清空輸入
  numbers.value = []
  
  // 可選：限制訂單歷史數量
  if (orders.value.length > 50) {
    orders.value = orders.value.slice(0, 50)
  }
}

// 清空訂單
const clearOrders = () => {
  if (confirm('確定要清空所有訂單嗎？')) {
    orders.value = []
    orderCounter.value = 1
  }
}
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
