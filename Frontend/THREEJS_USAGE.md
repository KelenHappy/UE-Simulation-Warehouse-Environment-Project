# Three.js 使用說明

## 導入 Three.js

Three.js 已經安裝在項目中，您可以在 Vue 組件中這樣導入：

### 方法 1: 導入整個 Three.js 庫

```javascript
import * as THREE from 'three'
```

### 方法 2: 按需導入（推薦，可以減少打包體積）

```javascript
import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, Mesh, Color } from 'three'
```

## 在 Vue 組件中使用

### 基本使用範例

```vue
<template>
  <div ref="container" class="three-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const container = ref(null)
let scene, camera, renderer

onMounted(() => {
  // 創建場景
  scene = new THREE.Scene()
  
  // 創建相機
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  
  // 創建渲染器
  renderer = new THREE.WebGLRenderer()
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)
  
  // 創建物體並添加到場景
  const geometry = new THREE.BoxGeometry()
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  const cube = new THREE.Mesh(geometry, material)
  scene.add(cube)
  
  camera.position.z = 5
  renderer.render(scene, camera)
})

onUnmounted(() => {
  // 清理資源
  renderer.dispose()
})
</script>
```

## 使用現成的 ThreeScene 組件

項目中已經創建了一個 `ThreeScene.vue` 組件，您可以直接使用：

```vue
<template>
  <div>
    <ThreeScene />
  </div>
</template>

<script setup>
import ThreeScene from './components/ThreeScene.vue'
</script>
```

## 常用 Three.js 模組

### 幾何體 (Geometry)
- `BoxGeometry` - 立方體
- `SphereGeometry` - 球體
- `PlaneGeometry` - 平面
- `CylinderGeometry` - 圓柱體

### 材質 (Material)
- `MeshBasicMaterial` - 基礎材質
- `MeshStandardMaterial` - 標準材質（支持光照）
- `MeshPhongMaterial` - Phong 材質（支持光照）

### 光源 (Lights)
- `AmbientLight` - 環境光
- `DirectionalLight` - 平行光
- `PointLight` - 點光源
- `SpotLight` - 聚光燈

### 控制器 (Controls)
如果需要控制相機，可以安裝 `three/examples/jsm/controls/OrbitControls`：

```javascript
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const controls = new OrbitControls(camera, renderer.domElement)
```

## 注意事項

1. **資源清理**: 組件卸載時記得清理 Three.js 資源（geometry.dispose(), material.dispose(), renderer.dispose()）
2. **動畫循環**: 使用 `requestAnimationFrame` 來創建動畫循環
3. **響應式**: 記得處理窗口大小變化，更新相機和渲染器
4. **性能**: 對於複雜場景，考慮使用 `three-mesh-bvh`（已安裝）來優化性能

## 已安裝的相關套件

- `three` - Three.js 核心庫
- `@types/three` - TypeScript 類型定義
- `three-mesh-bvh` - BVH 加速結構，用於複雜場景優化
- `dat.gui` - 用於調試和參數調整的 GUI 工具
- `stats.js` - 性能監控工具

