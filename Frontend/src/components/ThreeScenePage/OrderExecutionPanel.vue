<template>
  <div class="bg-white/10 backdrop-blur rounded-2xl border border-white/10 p-4 shadow-xl space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold">訂單清單</h2>
        <p class="text-xs text-white/60">出貨區：X1Y1、X4Y1</p>
      </div>
      <button
        class="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
        :class="buttonClass"
        :disabled="isExecuting || orders.length === 0"
        @click="$emit('start-execution')"
      >
        {{ isExecuting ? '執行中...' : '開始執行' }}
      </button>
    </div>

    <div
      v-if="executionStatus"
      class="rounded-lg bg-white/10 px-3 py-2 text-sm text-white/80"
    >
      {{ executionStatus }}
    </div>

    <div class="space-y-3 max-h-[420px] overflow-y-auto pr-2">
      <div v-if="orders.length === 0" class="text-center text-white/60 py-8">
        暫無訂單
      </div>

      <div
        v-for="order in orders"
        :key="order.id"
        class="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold">訂單 {{ order.id }}</span>
          <span class="text-xs text-white/50">{{ order.time }}</span>
        </div>
        <div class="mt-2 text-lg font-mono text-indigo-100">
          {{ order.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  orders: {
    type: Array,
    default: () => []
  },
  isExecuting: {
    type: Boolean,
    default: false
  },
  executionStatus: {
    type: String,
    default: ''
  }
})

defineEmits(['start-execution'])

const buttonClass = computed(() => {
  if (props.orders.length === 0) {
    return 'bg-white/10 text-white/40 cursor-not-allowed'
  }
  if (props.isExecuting) {
    return 'bg-indigo-500/60 text-white cursor-wait'
  }
  return 'bg-indigo-500 hover:bg-indigo-400 text-white'
})
</script>
