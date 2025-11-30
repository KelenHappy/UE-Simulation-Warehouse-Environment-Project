<template>
  <div class="flex flex-wrap gap-3">
    <button
      @click="$emit('open-guide')"
      class="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition-colors duration-300 font-medium"
    >
      操作說明
    </button>
    <button
      @click="$emit('go-home')"
      class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 transition-colors duration-300 font-medium"
    >
      返回訂單系統
    </button>
  </div>
</template>

<script setup>
defineEmits(['open-guide', 'go-home'])
</script>
