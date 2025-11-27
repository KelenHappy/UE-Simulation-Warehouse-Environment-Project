import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * 車子管理器
 * 負責創建、更新和管理軌道上的車子
 */
export class CarManager {
    constructor(scene) {
        this.scene = scene;
        this.cars = [];
        this.carSpeed = 2.0;
        this.trackGauge = 0; // 軌距
    }

    /**
     * 創建軌道上的車子
     * @param {Object} gridMetrics - 網格度量資訊
     */
    createCars(gridMetrics) {
        const loader = new GLTFLoader();

        // 計算軌距（兩條軌道中心之間的距離）
        const laneWidth = Math.max(
            Math.min(gridMetrics.spacingX, gridMetrics.spacingZ) * 0.8,
            gridMetrics.boxWidth * 0.1,
        );
        this.trackGauge = laneWidth * 0.6;

        // 只創建兩台車：一台橫向，一台縱向
        const carConfigs = [
            {
                name: "橫向車",
                rotation: 0,           // 朝右（X軸正方向）
                pathType: "horizontal",
                startOffset: 0
            },
            {
                name: "縱向車",
                rotation: Math.PI / 2, // 朝下（Z軸正方向）
                pathType: "vertical",
                startOffset: 0.25      // 錯開位置
            }
        ];

        loader.load(
            "/car.glb",
            (gltf) => {
                // 車子應該在軌道高度（抬高一點）
                const trackY = gridMetrics.pillarTopY + gridMetrics.boxHeight * 0.7;

                // 車子大小：兩格（兩個箱子的寬度加上間距）
                const stepX = gridMetrics.boxWidth + gridMetrics.spacingX;
                const carScale = stepX * 1.1;

                carConfigs.forEach((config) => {
                    const carClone = gltf.scene.clone();
                    carClone.scale.set(carScale, carScale, carScale);

                    // 設置固定旋轉
                    carClone.rotation.y = config.rotation;

                    carClone.castShadow = true;
                    carClone.receiveShadow = true;

                    // 生成路徑（車子在軌道上移動）
                    const path = this.generateCarPath(
                        gridMetrics,
                        trackY,
                        config.pathType
                    );
                    const startIndex = Math.floor(path.length * config.startOffset);

                    // 設置初始位置
                    carClone.position.copy(path[startIndex]);

                    this.scene.add(carClone);

                    // 儲存車子資訊
                    this.cars.push({
                        model: carClone,
                        path: path,
                        pathIndex: startIndex,
                        name: config.name,
                        fixedRotation: config.rotation
                    });

                    console.log(`✓ ${config.name} 已加載，旋轉: ${(config.rotation * 180 / Math.PI).toFixed(0)}°`);
                });

                console.log(`✓ 總共加載了 ${this.cars.length} 台車`);
                console.log("  - 軌距:", this.trackGauge.toFixed(3));
                console.log("  - 車子縮放:", carScale.toFixed(3));
                console.log("  - 軌道高度:", trackY.toFixed(3));
            },
            (progress) => {
                console.log(
                    "車子加載進度:",
                    (progress.loaded / progress.total) * 100 + "%",
                );
            },
            (error) => {
                console.error("❌ 加載 car.glb 時出錯:", error);
            }
        );
    }

    /**
     * 生成車子的環形路徑
     * @param {Object} gridMetrics - 網格度量資訊
     * @param {number} trackY - 軌道高度
     * @param {string} pathType - 路徑類型 ("horizontal" 或 "vertical")
     * @returns {Array} 路徑點陣列
     */
    generateCarPath(gridMetrics, trackY, pathType) {
        const path = [];
        const stepX = gridMetrics.boxWidth + gridMetrics.spacingX;
        const stepZ = gridMetrics.boxDepth + gridMetrics.spacingZ;

        const leftRingX = gridMetrics.startX - stepX / 2 - gridMetrics.modelCenter.x;
        const rightRingX = gridMetrics.startX + (gridMetrics.width - 1) * stepX + stepX / 2 - gridMetrics.modelCenter.x;
        const topRingZ = gridMetrics.startZ - stepZ / 2 - gridMetrics.modelCenter.z;
        const bottomRingZ = gridMetrics.startZ + (gridMetrics.depth - 1) * stepZ + stepZ / 2 - gridMetrics.modelCenter.z;

        const segments = 50;

        if (pathType === "horizontal") {
            // 橫向路徑：頂部 -> 右側 -> 底部 -> 左側
            // 頂部邊（從左到右）
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                path.push(new THREE.Vector3(
                    leftRingX + (rightRingX - leftRingX) * t,
                    trackY,
                    topRingZ
                ));
            }

            // 右側邊（從上到下）
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                path.push(new THREE.Vector3(
                    rightRingX,
                    trackY,
                    topRingZ + (bottomRingZ - topRingZ) * t
                ));
            }

            // 底部邊（從右到左）
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                path.push(new THREE.Vector3(
                    rightRingX - (rightRingX - leftRingX) * t,
                    trackY,
                    bottomRingZ
                ));
            }

            // 左側邊（從下到上）
            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                path.push(new THREE.Vector3(
                    leftRingX,
                    trackY,
                    bottomRingZ - (bottomRingZ - topRingZ) * t
                ));
            }
        } else {
            // 縱向路徑：右側 -> 底部 -> 左側 -> 頂部
            // 右側邊（從上到下）
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                path.push(new THREE.Vector3(
                    rightRingX,
                    trackY,
                    topRingZ + (bottomRingZ - topRingZ) * t
                ));
            }

            // 底部邊（從右到左）
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                path.push(new THREE.Vector3(
                    rightRingX - (rightRingX - leftRingX) * t,
                    trackY,
                    bottomRingZ
                ));
            }

            // 左側邊（從下到上）
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                path.push(new THREE.Vector3(
                    leftRingX,
                    trackY,
                    bottomRingZ - (bottomRingZ - topRingZ) * t
                ));
            }

            // 頂部邊（從左到右）
            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                path.push(new THREE.Vector3(
                    leftRingX + (rightRingX - leftRingX) * t,
                    trackY,
                    topRingZ
                ));
            }
        }

        return path;
    }

    /**
     * 更新所有車子的位置
     * @param {number} delta - 時間增量
     */
    update(delta) {
        if (this.cars.length === 0) return;

        this.cars.forEach(carData => {
            const { model, path, fixedRotation } = carData;

            // 計算移動距離
            const moveDistance = this.carSpeed * delta;
            let remainingDistance = moveDistance;

            while (remainingDistance > 0 && path.length > 0) {
                const currentPos = model.position;
                const targetPos = path[carData.pathIndex];

                const direction = new THREE.Vector3()
                    .subVectors(targetPos, currentPos);
                const distanceToTarget = direction.length();

                if (distanceToTarget <= remainingDistance) {
                    // 到達當前目標點，移動到下一個
                    model.position.copy(targetPos);
                    remainingDistance -= distanceToTarget;
                    carData.pathIndex = (carData.pathIndex + 1) % path.length;
                } else {
                    // 向目標點移動
                    direction.normalize();
                    model.position.addScaledVector(direction, remainingDistance);
                    remainingDistance = 0;
                }
            }

            // 保持固定旋轉（不隨移動方向改變）
            model.rotation.y = fixedRotation;
        });
    }

    /**
     * 清理所有車子資源
     */
    dispose() {
        this.cars.forEach(carData => {
            if (carData.model) {
                carData.model.traverse((child) => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach((material) => material.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    }
                });
                this.scene.remove(carData.model);
            }
        });
        this.cars = [];
    }

    /**
     * 設置車子速度
     * @param {number} speed - 新的速度值
     */
    setSpeed(speed) {
        this.carSpeed = speed;
    }

    /**
     * 獲取軌距
     * @returns {number} 軌距值
     */
    getTrackGauge() {
        return this.trackGauge;
    }
}
