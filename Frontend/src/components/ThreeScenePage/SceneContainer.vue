<template>
  <div class="bg-white/10 backdrop-blur rounded-2xl shadow-2xl p-4 border border-white/10">
    <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4">
      <ThreeScene ref="threeSceneRef" />
      <OrderExecutionPanel
        :orders="orders"
        :is-executing="isExecuting"
        :execution-status="executionStatus"
        @start-execution="handleStartExecution"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ThreeScene from '../ThreeScene/ThreeScene.vue'
import OrderExecutionPanel from './OrderExecutionPanel.vue'

const props = defineProps({
  orders: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['order-complete'])

const threeSceneRef = ref(null)

const isExecuting = computed(() => threeSceneRef.value?.isExecuting?.value ?? false)
const executionStatus = computed(() => threeSceneRef.value?.executionStatus?.value ?? '')

const parseOrderItems = (content) => {
  if (!content) return []
  return content
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map(item => Number(item))
    .filter(item => !Number.isNaN(item))
}

const handleStartExecution = async () => {
  if (!threeSceneRef.value || isExecuting.value || props.orders.length === 0) return

  const order = props.orders[0]
  const items = parseOrderItems(order.content)
  const result = await threeSceneRef.value.startOrderExecution({ order, items })

  if (result?.success) {
    emit('order-complete', order.id)
  }
}
</script>
