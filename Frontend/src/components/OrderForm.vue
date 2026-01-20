<template>
  <div class="bg-white rounded-2xl shadow-xl p-6">
    <h2 class="text-xl font-bold text-gray-800 mb-4">訂單發送</h2>

    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">輸入數字</label>
      <div class="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl border-2 border-gray-300 min-h-[120px]">
        <div
          v-for="(num, index) in numbers"
          :key="`${num}-${index}`"
          class="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md border-2 border-blue-300"
        >
          <input
            :value="num"
            type="number"
            class="w-20 text-center font-bold text-lg text-blue-600 focus:outline-none"
            min="1"
            max="999"
            @input="$emit('update-number', index, $event.target.value ? Number($event.target.value) : 0)"
            @blur="$emit('validate-number', index)"
          />
          <button
            @click="$emit('remove-number', index)"
            class="text-red-500 hover:text-red-700 font-bold"
          >
            ✕
          </button>
        </div>

        <button
          @click="$emit('add-number')"
          class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-300 font-bold shadow-md"
        >
          + 新增
        </button>
      </div>
    </div>

    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">代碼輸入</label>
      <div class="flex flex-col gap-3">
        <div class="flex flex-wrap gap-2">
          <input
            v-model="codeInput"
            type="text"
            class="flex-1 min-w-[220px] px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="例如 60-70-80-90"
          />
          <button
            @click="applyCode(codeInput)"
            class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all duration-300 font-medium"
          >
            套用代碼
          </button>
        </div>
      </div>
    </div>

    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">訂單預覽</label>
      <div class="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl text-center">
        <div class="text-2xl font-mono font-bold text-blue-700">
          {{ orderPreview }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <button
        @click="$emit('generate-random')"
        class="px-6 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl hover:from-orange-600 hover:to-yellow-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-bold text-lg"
      >
        🎲 隨機數字
      </button>

      <button
        @click="$emit('submit-order')"
        :disabled="numbers.length === 0"
        class="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg font-bold text-lg"
      >
        📤 送出訂單
      </button>
    </div>

    <div class="mt-6 pt-6 border-t-2 border-gray-200">
      <label class="block text-sm font-medium text-gray-700 mb-3">快速操作</label>
      <div class="flex gap-2 flex-wrap">
        <button
          @click="$emit('clear-numbers')"
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300 font-medium"
        >
          清空數字
        </button>
        <button
          @click="$emit('add-multiple', 3)"
          class="px-4 py-2 bg-blue-200 text-blue-700 rounded-lg hover:bg-blue-300 transition-all duration-300 font-medium"
        >
          新增3個
        </button>
        <button
          @click="$emit('add-multiple', 5)"
          class="px-4 py-2 bg-purple-200 text-purple-700 rounded-lg hover:bg-purple-300 transition-all duration-300 font-medium"
        >
          新增5個
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  numbers: {
    type: Array,
    default: () => []
  },
  orderPreview: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'add-number',
  'update-number',
  'remove-number',
  'clear-numbers',
  'add-multiple',
  'validate-number',
  'generate-random',
  'apply-code',
  'submit-order'
])

const codeInput = ref('')

const applyCode = (value) => {
  if (!value) return
  emit('apply-code', value)
  codeInput.value = ''
}
</script>
