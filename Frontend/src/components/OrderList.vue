<template>
  <div class="bg-white rounded-2xl shadow-xl p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-800">訂單列表</h2>
      <button
        @click="$emit('clear-orders')"
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
              @click="$emit('delete-order', order.id)"
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
</template>

<script setup>
defineProps({
  orders: {
    type: Array,
    default: () => []
  }
})

defineEmits(['clear-orders', 'delete-order'])
</script>
