<template>
  <div class="three-scene-wrapper">
    <div ref="container" class="three-container"></div>
    <div class="controls-hint">
      <span>🖱️ 左鍵拖曳旋轉 | 滾輪縮放</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
let scene, camera, renderer, model, controls
let animationId = null
let handleResize = null

onMounted(() => {
  if (!container.value) return

  // 創建場景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x222222)

  // 創建相機
  camera = new THREE.PerspectiveCamera(
    75,
    container.value.clientWidth / container.value.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0, 0, 5)

  // 創建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  
  // 確保 canvas 可以正確接收滑鼠事件
  renderer.domElement.style.display = 'block'
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.touchAction = 'none'
  
  container.value.appendChild(renderer.domElement)

  // 創建軌道控制器（支持拖曳和旋轉）
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true // 啟用阻尼效果，使旋轉更平滑
  controls.dampingFactor = 0.05 // 阻尼係數
  controls.enableZoom = true // 啟用縮放
  controls.enablePan = false // 禁用平移（不使用右鍵）
  controls.minDistance = 1 // 最小縮放距離
  controls.maxDistance = 100 // 最大縮放距離

  // 添加環境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  // 添加定向光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 5, 5)
  scene.add(directionalLight)

  // 使用 GLTFLoader 加載模型
  const loader = new GLTFLoader()
  loader.load(
    '/blue_box.glb',
    (gltf) => {
      model = gltf.scene
      scene.add(model)

      // 計算模型邊界框並調整相機位置
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      // 將模型居中
      model.position.x = -center.x
      model.position.y = -center.y
      model.position.z = -center.z

      // 調整相機位置以適應模型大小
      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = camera.fov * (Math.PI / 180)
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
      cameraZ *= 1.5 // 添加一些邊距
      camera.position.set(0, 0, cameraZ)

      // 設置控制器目標為模型中心（現在是原點，因為已經居中）
      controls.target.set(0, 0, 0)
      controls.update() // 立即更新控制器

      console.log('模型加載成功:', model)
    },
    (progress) => {
      console.log('加載進度:', (progress.loaded / progress.total * 100) + '%')
    },
    (error) => {
      console.error('加載模型時出錯:', error)
    }
  )

  // 動畫循環
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    
    // 更新控制器（必須在每一幀調用，如果啟用了阻尼）
    if (controls) {
      controls.update()
    }
    
    renderer.render(scene, camera)
  }
  animate()

  // 處理窗口大小變化
  handleResize = () => {
    if (!container.value) return
    camera.aspect = container.value.clientWidth / container.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  }
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 取消動畫循環
  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  // 移除事件監聽器
  if (handleResize) {
    window.removeEventListener('resize', handleResize)
  }

  // 清理控制器
  if (controls) {
    controls.dispose()
  }

  // 清理 Three.js 資源
  if (container.value && renderer && renderer.domElement) {
    container.value.removeChild(renderer.domElement)
  }
  
  // 清理模型資源
  if (model) {
    model.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose())
        } else {
          child.material?.dispose()
        }
      }
    })
  }
  
  if (renderer) renderer.dispose()
})
</script>

<style scoped>
.three-scene-wrapper {
  width: 100%;
  position: relative;
}

.three-container {
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  cursor: grab;
  touch-action: none; /* 禁用默認觸摸行為 */
  background: #222222;
}

.three-container:active {
  cursor: grabbing;
}

.controls-hint {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.controls-hint span {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>

