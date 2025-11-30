<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black p-6 text-white">
    <div class="max-w-6xl mx-auto space-y-6">
      <PageHeader @open-guide="openGuide" @go-home="goHome" />
      <SceneContainer />
    </div>
  </div>
</template>

<script setup>
import PageHeader from '../components/ThreeScenePage/PageHeader.vue'
import SceneContainer from '../components/ThreeScenePage/SceneContainer.vue'

const goHome = () => {
  window.open('/', '_self')
}

const openGuide = () => {
  alert('🖱️ 左鍵拖曳旋轉\n🖱️ 滾輪縮放\n建議於桌機上使用以獲得最佳體驗。')
}
</script>
