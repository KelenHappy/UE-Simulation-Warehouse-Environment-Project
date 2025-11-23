<template>
    <div class="three-scene-wrapper">
        <div ref="container" class="three-container"></div>
        <div class="controls-hint">
            <span>🖱️ 左鍵拖曳旋轉 | 滾輪縮放</span>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useCargoData } from "../composables/useCargoData.js";
import {
    convertBoxesToCargoData,
    saveCargoDataToBackend,
} from "../utils/cargoStorage.js";

const container = ref(null);
let scene,
    camera,
    renderer,
    boxes = [],
    controls,
    baseModel = null;
let animationId = null;
let handleResize = null;

// 使用 cargo 數據管理
const {
    cargoData,
    loading: cargoLoading,
    error: cargoError,
    startPolling,
    stopPolling,
} = useCargoData({
    apiBaseUrl: "http://localhost:8000",
    pollInterval: 5000,
    autoStart: false, // 手動控制啟動
});

onMounted(() => {
    if (!container.value) return;

    // 創建場景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // 創建相機
    camera = new THREE.PerspectiveCamera(
        75,
        container.value.clientWidth / container.value.clientHeight,
        0.1,
        1000,
    );
    camera.position.set(0, 0, 5);

    // 創建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.value.clientWidth, container.value.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // 確保 canvas 可以正確接收滑鼠事件
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";

    container.value.appendChild(renderer.domElement);

    // 創建軌道控制器（支持拖曳和旋轉）
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // 啟用阻尼效果，使旋轉更平滑
    controls.dampingFactor = 0.05; // 阻尼係數
    controls.enableZoom = true; // 啟用縮放
    controls.enablePan = false; // 禁用平移（不使用右鍵）
    controls.minDistance = 1; // 最小縮放距離
    controls.maxDistance = 100; // 最大縮放距離

    // 添加環境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // 添加定向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // 重置對象所有變換的輔助函數
    function resetTransform(object) {
        object.position.set(0, 0, 0);
        object.rotation.set(0, 0, 0);
        object.quaternion.set(0, 0, 0, 1);
        object.scale.set(1, 1, 1);
        object.matrix.identity();
        object.matrixWorld.identity();
        object.matrixWorldNeedsUpdate = false;
    }

    // 加載 blue_box.glb 模型並創建方塊陣列
    const loader = new GLTFLoader();
    loader.load(
        "/blue_box.glb",
        (gltf) => {
            const originalScene = gltf.scene;

            // 先計算原始模型的邊界框（考慮所有變換）
            originalScene.updateMatrixWorld(true);
            const originalBox = new THREE.Box3().setFromObject(originalScene);
            const originalSize = originalBox.getSize(new THREE.Vector3());
            const originalMin = originalBox.min;
            const originalMax = originalBox.max;
            const originalCenter = new THREE.Vector3(
                (originalMin.x + originalMax.x) / 2,
                (originalMin.y + originalMax.y) / 2,
                (originalMin.z + originalMax.z) / 2,
            );

            // 創建一個新的 Group 來作為標準化的基礎模型
            baseModel = new THREE.Group();

            // 深度遍歷原始場景，提取所有 Mesh 的幾何體和材質
            // 然後創建新的 Mesh，不保留任何變換
            const meshes = [];
            originalScene.traverse((child) => {
                if (child.isMesh) {
                    // 獲取世界矩陣
                    child.updateMatrixWorld(true);
                    const worldMatrix = child.matrixWorld.clone();

                    // 提取幾何體和材質
                    let geometry = child.geometry.clone();
                    const material = child.material.clone();

                    // 應用世界變換到幾何體的頂點
                    geometry.applyMatrix4(worldMatrix);

                    // 創建新的 Mesh，沒有任何變換
                    const newMesh = new THREE.Mesh(geometry, material);
                    resetTransform(newMesh);

                    meshes.push(newMesh);
                }
            });

            // 將所有 Mesh 添加到一個 Group 中
            const normalizedGroup = new THREE.Group();
            meshes.forEach((mesh) => {
                normalizedGroup.add(mesh);
            });

            // 計算標準化後的邊界框
            resetTransform(normalizedGroup);
            normalizedGroup.updateMatrixWorld(true);
            const normalizedBox = new THREE.Box3().setFromObject(
                normalizedGroup,
            );
            const normalizedSize = normalizedBox.getSize(new THREE.Vector3());
            const normalizedMin = normalizedBox.min;
            const normalizedMax = normalizedBox.max;
            const normalizedCenter = new THREE.Vector3(
                (normalizedMin.x + normalizedMax.x) / 2,
                (normalizedMin.y + normalizedMax.y) / 2,
                (normalizedMin.z + normalizedMax.z) / 2,
            );

            // 平移 Group 使模型中心在原點
            normalizedGroup.position.set(
                -normalizedCenter.x,
                -normalizedCenter.y,
                -normalizedCenter.z,
            );

            // 將標準化的 Group 添加到基礎模型
            baseModel.add(normalizedGroup);
            resetTransform(baseModel);
            baseModel.updateMatrixWorld(true);

            // 重新計算最終的邊界框
            const finalBox = new THREE.Box3().setFromObject(baseModel);
            const modelSize = finalBox.getSize(new THREE.Vector3());
            const finalMin = finalBox.min;
            const finalMax = finalBox.max;
            const modelCenter = new THREE.Vector3(
                (finalMin.x + finalMax.x) / 2,
                (finalMin.y + finalMax.y) / 2,
                (finalMin.z + finalMax.z) / 2,
            );

            console.log("模型加載成功!");
            console.log("原始模型尺寸:", originalSize);
            console.log("標準化後模型尺寸:", modelSize);
            console.log("標準化後模型中心:", modelCenter);
            console.log("最終邊界框:", finalMin, "到", finalMax);

            // 創建方塊陣列 (5x10x5 = 250個)
            createBoxGridFromModel(5, 10, 5, modelSize, modelCenter);

            // 調整相機位置
            adjustCamera(5, 10, 5, modelSize);
        },
        (progress) => {
            console.log(
                "加載進度:",
                (progress.loaded / progress.total) * 100 + "%",
            );
        },
        (error) => {
            console.error("加載模型時出錯:", error);
        },
    );

    // 從模型創建方塊網格的函數
    function createBoxGridFromModel(
        width,
        depth,
        height,
        modelSize,
        modelCenter,
    ) {
        // 使用模型的實際尺寸（確保為正數）
        const boxWidth = Math.max(Math.abs(modelSize.x), 0.01);
        const boxDepth = Math.max(Math.abs(modelSize.z), 0.01);
        const boxHeight = Math.max(Math.abs(modelSize.y), 0.01);

        // 方塊之間的間距（模型大小的10%）
        const spacingX = boxWidth * 0.2;
        const spacingZ = boxDepth * 0.2;
        const spacingY = boxHeight * 0;

        // 貨架厚度（細細的）
        const shelfThickness = Math.min(spacingX, spacingZ, spacingY) * 0.15;

        // 計算總尺寸
        const totalWidth = width * boxWidth + (width - 1) * spacingX;
        const totalDepth = depth * boxDepth + (depth - 1) * spacingZ;
        const totalHeight = height * boxHeight + (height - 1) * spacingY;

        // 計算起始位置
        const startX = -totalWidth / 2 + boxWidth / 2;
        const startZ = -totalDepth / 2 + boxDepth / 2;
        const startY = -totalHeight / 2 + boxHeight / 2;

        // 創建白色材質（用於支柱）
        const shelfMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.3,
            roughness: 0.7,
        });

        // 支柱的半徑
        const pillarRadius = Math.min(boxWidth, boxDepth) * 0.02;

        // 創建方塊
        for (let x = 0; x < width; x++) {
            for (let z = 0; z < depth; z++) {
                for (let y = 0; y < height; y++) {
                    const targetCenterX = startX + x * (boxWidth + spacingX);
                    const targetCenterZ = startZ + z * (boxDepth + spacingZ);
                    const targetCenterY = startY + y * (boxHeight + spacingY);

                    const clonedModel = baseModel.clone(true);
                    clonedModel.traverse((child) => {
                        if (child.isMesh || child.isGroup || child.isObject3D) {
                            resetTransform(child);
                        }
                    });

                    resetTransform(clonedModel);
                    clonedModel.position.set(
                        targetCenterX - modelCenter.x,
                        targetCenterY - modelCenter.y,
                        targetCenterZ - modelCenter.z,
                    );
                    clonedModel.updateMatrixWorld(true);
                    scene.add(clonedModel);
                    boxes.push(clonedModel);
                }
            }
        }

        // 在每個 XZ 位置創建支柱（從地面到最高層頂部再往上一格）
        for (let x = 0; x < width; x++) {
            for (let z = 0; z < depth; z++) {
                const targetCenterX = startX + x * (boxWidth + spacingX);
                const targetCenterZ = startZ + z * (boxDepth + spacingZ);

                // 計算最高層方塊的頂部
                const topLayerCenterY =
                    startY + (height - 1) * (boxHeight + spacingY);
                const topY = topLayerCenterY - modelCenter.y + boxHeight / 2;

                // 支柱頂部：最高層頂部 + 再往上一格的高度
                const pillarTopY = topY + boxHeight;

                // 計算最低層方塊的底部（地面）
                const bottomY = startY - modelCenter.y - boxHeight / 2;

                // 支柱高度
                const pillarHeight = pillarTopY - bottomY;

                const halfWidth = boxWidth / 2;
                const halfDepth = boxDepth / 2;

                // 四個角的相對位置
                const corners = [
                    { x: -halfWidth, z: -halfDepth }, // 左前
                    { x: halfWidth, z: -halfDepth }, // 右前
                    { x: -halfWidth, z: halfDepth }, // 左後
                    { x: halfWidth, z: halfDepth }, // 右後
                ];

                corners.forEach((corner) => {
                    const pillarGeometry = new THREE.CylinderGeometry(
                        pillarRadius,
                        pillarRadius,
                        pillarHeight,
                        8,
                    );
                    const pillar = new THREE.Mesh(
                        pillarGeometry,
                        shelfMaterial,
                    );

                    // 設置支柱位置
                    pillar.position.set(
                        targetCenterX - modelCenter.x + corner.x,
                        bottomY + pillarHeight / 2,
                        targetCenterZ - modelCenter.z + corner.z,
                    );

                    scene.add(pillar);
                });
            }
        }

        const firstBoxCenterX = startX - modelCenter.x;
        const firstBoxCenterY = startY - modelCenter.y;
        const firstBoxCenterZ = startZ - modelCenter.z;

        console.log(
            `成功創建 ${boxes.length} 個方塊 (${width}x${depth}x${height} = ${width * depth * height})`,
        );
        console.log(
            `模型尺寸: 寬=${boxWidth.toFixed(2)}, 高=${boxHeight.toFixed(2)}, 深=${boxDepth.toFixed(2)}`,
        );
        console.log(
            `陣列總尺寸: 寬=${totalWidth.toFixed(2)}, 高=${totalHeight.toFixed(2)}, 深=${totalDepth.toFixed(2)}`,
        );
        console.log(
            `第一個方塊中心位置: (${firstBoxCenterX.toFixed(2)}, ${firstBoxCenterY.toFixed(2)}, ${firstBoxCenterZ.toFixed(2)})`,
        );

        // 將方塊數據轉換為貨物數據格式並儲存到後端
        console.log("準備儲存貨物數據...", {
            boxesCount: boxes.length,
            modelSize,
        });

        const cargoDataToSave = convertBoxesToCargoData(boxes, {
            x: boxWidth,
            y: boxHeight,
            z: boxDepth,
        });

        console.log(
            "已轉換貨物數據，準備發送到後端...",
            cargoDataToSave.length,
        );

        saveCargoDataToBackend(cargoDataToSave, {
            apiBaseUrl: "http://localhost:8000",
            onSuccess: (result) => {
                console.log("✓ 貨物數據已成功同步到後端", result);
            },
            onError: (error) => {
                console.error("✗ 同步貨物數據到後端時出錯", error);
            },
        }).catch((err) => {
            console.error("✗ 儲存貨物數據異常:", err);
        });
    }

    // 調整相機位置的函數
    function adjustCamera(width, depth, height, modelSize) {
        const boxWidth = modelSize.x;
        const boxDepth = modelSize.z;
        const boxHeight = modelSize.y;

        const spacingX = boxWidth * 0.1;
        const spacingZ = boxDepth * 0.1;
        const spacingY = boxHeight * 0.1;

        const totalWidth = width * boxWidth + (width - 1) * spacingX;
        const totalDepth = depth * boxDepth + (depth - 1) * spacingZ;
        const totalHeight = height * boxHeight + (height - 1) * spacingY;

        // 調整相機位置以適應所有方塊
        const maxDim = Math.max(totalWidth, totalDepth, totalHeight);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.8; // 添加一些邊距

        // 設置相機位置，從側上方觀看
        camera.position.set(cameraZ * 0.7, cameraZ * 0.7, cameraZ * 0.7);

        // 設置控制器目標為陣列中心（原點）
        controls.target.set(0, 0, 0);
        controls.update();
    }

    // 動畫循環
    const animate = () => {
        animationId = requestAnimationFrame(animate);

        // 更新控制器（必須在每一幀調用，如果啟用了阻尼）
        if (controls) {
            controls.update();
        }

        renderer.render(scene, camera);
    };
    animate();

    // 處理窗口大小變化
    handleResize = () => {
        if (!container.value) return;
        camera.aspect =
            container.value.clientWidth / container.value.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(
            container.value.clientWidth,
            container.value.clientHeight,
        );
    };
    window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
    // 取消動畫循環
    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    // 移除事件監聽器
    if (handleResize) {
        window.removeEventListener("resize", handleResize);
    }

    // 清理控制器
    if (controls) {
        controls.dispose();
    }

    // 清理 Three.js 資源
    if (container.value && renderer && renderer.domElement) {
        container.value.removeChild(renderer.domElement);
    }

    // 清理方塊資源（GLTF 模型）
    boxes.forEach((box) => {
        // 清理 GLTF 模型的所有子對象
        box.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((material) =>
                            material.dispose(),
                        );
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
        scene.remove(box);
    });
    boxes = [];

    // 清理基礎模型
    if (baseModel) {
        baseModel.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((material) =>
                            material.dispose(),
                        );
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
    }

    if (renderer) renderer.dispose();
});
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
