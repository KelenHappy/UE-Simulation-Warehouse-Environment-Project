<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
    <div class="max-w-7xl mx-auto">
      <HeaderControls
        :is-connected="isConnected"
        :show-three-scene="showThreeScene"
        :error-message="errorMessage"
        @toggle-three="showThreeScene = !showThreeScene"
        @toggle-connection="toggleConnection"
      />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderList
          :orders="orders"
          @clear-orders="handleClearOrders"
          @delete-order="handleDeleteOrder"
        />

        <OrderForm
          :numbers="numbers"
          :order-preview="orderPreview"
          @add-number="addNumber"
          @update-number="handleUpdateNumber"
          @remove-number="removeNumber"
          @clear-numbers="clearNumbers"
          @add-multiple="addMultipleNumbers"
          @validate-number="validateNumber"
          @generate-random="generateRandom"
          @submit-order="submitOrder"
        />
      </div>

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
import { ref, onMounted, onUnmounted } from 'vue'
import ThreeScene from './components/ThreeScene.vue'
import HeaderControls from './components/HeaderControls.vue'
import OrderList from './components/OrderList.vue'
import OrderForm from './components/OrderForm.vue'
import { useOrderNumbers } from './composables/useOrderNumbers'
import { useWebSocket } from './composables/useWebSocket'

const showThreeScene = ref(false)

const {
  numbers,
  orderPreview,
  addNumber,
  updateNumber,
  removeNumber,
  clearNumbers,
  addMultipleNumbers,
  validateNumber,
  generateRandom
} = useOrderNumbers()

const {
  isConnected,
  errorMessage,
  orders,
  connectWebSocket,
  disconnectWebSocket,
  toggleConnection,
  sendOrder,
  requestClearOrders,
  requestDeleteOrder,
  addLocalOrder
} = useWebSocket()

const submitOrder = () => {
  if (numbers.value.length === 0) return

  const orderContent = numbers.value.join('-')

  if (isConnected.value) {
    sendOrder(orderContent)
    clearNumbers()
  } else {
    addLocalOrder(orderContent)
    clearNumbers()
  }
}

const handleClearOrders = () => {
  if (!isConnected.value) {
    errorMessage.value = '請先連線到後端再清空訂單，否則無法刪除後端資料，刷新後訂單會恢復。'
    return
  }

  if (confirm('確定要清空所有訂單嗎？')) {
    requestClearOrders()
  }
}

const handleDeleteOrder = (orderId) => {
  if (!isConnected.value) {
    errorMessage.value = '請先連線到後端再刪除訂單，否則無法刪除後端資料。'
    return
  }

  if (confirm(`確定要刪除訂單 ${orderId} 嗎？`)) {
    requestDeleteOrder(orderId)
  }
}

const handleUpdateNumber = (index, value) => {
  updateNumber(index, value)
}

onMounted(() => {
  connectWebSocket()
})

onUnmounted(() => {
  disconnectWebSocket()
})
</script>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

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
