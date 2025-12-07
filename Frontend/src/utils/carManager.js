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
        this.gridMetrics = null;
        this.trackY = 0;
        this.stepX = 0;
        this.stepZ = 0;
    }

    /**
     * 創建軌道上的車子
     * @param {Object} gridMetrics - 網格度量資訊
     */
    createCars(gridMetrics) {
        this.gridMetrics = gridMetrics;
        const loader = new GLTFLoader();

        // 計算軌距（兩條軌道中心之間的距離）
        const laneWidth = Math.max(
            Math.min(gridMetrics.spacingX, gridMetrics.spacingZ) * 0.8,
            gridMetrics.boxWidth * 0.1,
        );
        this.trackGauge = laneWidth * 0.6;
        this.stepX = gridMetrics.boxWidth + gridMetrics.spacingX;
        this.stepZ = gridMetrics.boxDepth + gridMetrics.spacingZ;
        this.trackY = gridMetrics.pillarTopY + gridMetrics.boxHeight * 0.7;

        // 只創建兩台車：一台橫向，一台縱向
        const carConfigs = [
            {
                name: "橫向車",
                rotation: 0,           // 朝右（X軸正方向）
                pathType: "horizontal",
                startOffset: 0,
                startCoord: { x: 0, z: 0 }
            },
            {
                name: "縱向車",
                rotation: Math.PI / 2, // 朝下（Z軸正方向）
                pathType: "vertical",
                startOffset: 0.25,     // 錯開位置
                startCoord: { x: gridMetrics.width - 1, z: 0 }
            }
        ];

        return new Promise((resolve, reject) => {
            loader.load(
                "/car.glb",
                (gltf) => {
                // 車子大小：兩格（兩個箱子的寬度加上間距）
                const carScale = this.stepX * 1.1;

                carConfigs.forEach((config) => {
                    const carClone = gltf.scene.clone();
                    carClone.scale.set(carScale, carScale, carScale);

                    // 設置固定旋轉
                    carClone.rotation.y = config.rotation;

                    carClone.castShadow = true;
                    carClone.receiveShadow = true;

                    const startCoord = config.startCoord || { x: 0, z: 0 };
                    const startPoint = this.gridToWorld(startCoord.x, startCoord.z);
                    const path = [{ position: startPoint, coord: startCoord }];

                    carClone.position.copy(startPoint);

                    this.scene.add(carClone);

                    // 儲存車子資訊
                    this.cars.push({
                        id: `car-${this.cars.length + 1}`,
                        model: carClone,
                        path,
                        pathIndex: 0,
                        name: config.name,
                        fixedRotation: config.rotation,
                        currentCoord: { ...startCoord },
                        targetCoord: null,
                    });

                    console.log(`✓ ${config.name} 已加載，旋轉: ${(config.rotation * 180 / Math.PI).toFixed(0)}°`);
                });

                    console.log(`✓ 總共加載了 ${this.cars.length} 台車`);
                    console.log("  - 軌距:", this.trackGauge.toFixed(3));
                    console.log("  - 車子縮放:", carScale.toFixed(3));
                    console.log("  - 軌道高度:", this.trackY.toFixed(3));

                    resolve(this.getCarOptions());
                },
                (progress) => {
                    console.log(
                        "車子加載進度:",
                        (progress.loaded / progress.total) * 100 + "%",
                    );
                },
                (error) => {
                    console.error("❌ 加載 car.glb 時出錯:", error);
                    reject(error);
                }
            );
        });
    }

    gridToWorld(xIndex, zIndex) {
        if (!this.gridMetrics) return new THREE.Vector3();
        const worldX = this.gridMetrics.startX + xIndex * this.stepX - this.gridMetrics.modelCenter.x;
        const worldZ = this.gridMetrics.startZ + zIndex * this.stepZ - this.gridMetrics.modelCenter.z;
        return new THREE.Vector3(worldX, this.trackY, worldZ);
    }

    getCarOptions() {
        return this.cars.map(car => ({
            id: car.id,
            label: car.name,
        }));
    }

    getDestinationOptions() {
        if (!this.gridMetrics) return [];
        const options = [];
        for (let z = 0; z < this.gridMetrics.depth; z++) {
            for (let x = 0; x < this.gridMetrics.width; x++) {
                const id = `${x}-${z}`;
                options.push({
                    id,
                    label: `X${x + 1} - Z${z + 1}`,
                });
            }
        }
        return options;
    }

    setDestination(carId, destinationId) {
        const car = this.cars.find(c => c.id === carId);
        if (!car || !this.gridMetrics) return { success: false, message: "找不到車子" };

        const [xStr, zStr] = destinationId.split("-");
        const targetCoord = { x: Number(xStr), z: Number(zStr) };

        if (Number.isNaN(targetCoord.x) || Number.isNaN(targetCoord.z)) {
            return { success: false, message: "目的地格式不正確" };
        }

        if (
            targetCoord.x < 0 ||
            targetCoord.x >= this.gridMetrics.width ||
            targetCoord.z < 0 ||
            targetCoord.z >= this.gridMetrics.depth
        ) {
            return { success: false, message: "目的地超出架位範圍" };
        }

        const pathCoords = this.findGridPath(car.currentCoord, targetCoord);
        if (!pathCoords) {
            return { success: false, message: "無法找到路徑" };
        }

        const newPath = pathCoords.map(coord => ({
            coord,
            position: this.gridToWorld(coord.x, coord.z),
        }));

        car.path = newPath;
        car.pathIndex = 0;
        car.targetCoord = targetCoord;

        return { success: true, message: `${car.name} 路線已更新` };
    }

    findGridPath(startCoord, targetCoord) {
        const queue = [startCoord];
        const visited = new Set([`${startCoord.x}-${startCoord.z}`]);
        const parentMap = new Map();

        const directions = [
            { x: 1, z: 0 },
            { x: -1, z: 0 },
            { x: 0, z: 1 },
            { x: 0, z: -1 },
        ];

        while (queue.length > 0) {
            const current = queue.shift();
            if (current.x === targetCoord.x && current.z === targetCoord.z) {
                const path = [];
                let nodeKey = `${current.x}-${current.z}`;
                while (nodeKey) {
                    const [cx, cz] = nodeKey.split("-").map(Number);
                    path.unshift({ x: cx, z: cz });
                    nodeKey = parentMap.get(nodeKey);
                }
                return path;
            }

            for (const dir of directions) {
                const nx = current.x + dir.x;
                const nz = current.z + dir.z;
                const key = `${nx}-${nz}`;

                if (
                    nx < 0 || nx >= this.gridMetrics.width ||
                    nz < 0 || nz >= this.gridMetrics.depth ||
                    visited.has(key)
                ) {
                    continue;
                }

                visited.add(key);
                parentMap.set(key, `${current.x}-${current.z}`);
                queue.push({ x: nx, z: nz });
            }
        }

        return null;
    }

    /**
     * 更新所有車子的位置
     * @param {number} delta - 時間增量
     */
    update(delta) {
        if (this.cars.length === 0) return;

        this.cars.forEach(carData => {
            const { model, path } = carData;

            if (path.length === 0) return;

            // 計算移動距離
            const moveDistance = this.carSpeed * delta;
            let remainingDistance = moveDistance;

            while (remainingDistance > 0 && path.length > 0) {
                const currentPos = model.position;
                const targetPoint = path[carData.pathIndex];
                const direction = new THREE.Vector3()
                    .subVectors(targetPoint.position, currentPos);
                const distanceToTarget = direction.length();

                if (distanceToTarget <= remainingDistance) {
                    model.position.copy(targetPoint.position);
                    carData.currentCoord = { ...targetPoint.coord };
                    remainingDistance -= distanceToTarget;

                    if (carData.pathIndex < path.length - 1) {
                        const nextPoint = path[carData.pathIndex + 1];
                        const nextDir = new THREE.Vector3()
                            .subVectors(nextPoint.position, targetPoint.position)
                            .normalize();
                        model.rotation.y = Math.atan2(nextDir.x, nextDir.z);
                    }

                    if (carData.pathIndex < path.length - 1) {
                        carData.pathIndex += 1;
                    } else {
                        remainingDistance = 0;
                    }
                } else {
                    direction.normalize();
                    model.position.addScaledVector(direction, remainingDistance);
                    model.rotation.y = Math.atan2(direction.x, direction.z);
                    remainingDistance = 0;
                }
            }
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
