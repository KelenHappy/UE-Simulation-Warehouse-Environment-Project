<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black p-6 text-white">
    <div class="max-w-6xl mx-auto space-y-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold">3D 場景視圖</h1>
          <p class="text-gray-300 mt-1">獨立視窗顯示倉儲 3D 模型，可使用滑鼠拖曳旋轉與縮放</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            @click="openGuide"
            class="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition-colors duration-300 font-medium"
          >
            操作說明
          </button>
          <button
            @click="goHome"
            class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 transition-colors duration-300 font-medium"
          >
            返回訂單系統
          </button>
        </div>
      </div>

      <div class="bg-white/10 backdrop-blur rounded-2xl shadow-2xl p-4 border border-white/10">
        <ThreeScene />
      </div>
    </div>
  </div>
</template>

<script setup>
import ThreeScene from './components/ThreeScene.vue'

const goHome = () => {
  window.open('/', '_self')
}

const openGuide = () => {
  alert('🖱️ 左鍵拖曳旋轉\n🖱️ 滾輪縮放\n建議於桌機上使用以獲得最佳體驗。')
}
</script>

<style scoped>
.three-scene-wrapper {
  min-height: 24rem;
}
</style>
