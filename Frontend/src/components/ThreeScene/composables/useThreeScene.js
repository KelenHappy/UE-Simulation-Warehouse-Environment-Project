import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ref } from "vue";
import { convertBoxesToCargoData, saveCargoDataToBackend } from "../../../utils/cargoStorage.js";
import { CarManager } from "../../../utils/carManager.js";
import { createScene } from '../utils/sceneSetup';
import { createBoxGrid } from '../utils/boxGrid';
import { createTrackSystem } from '../utils/trackSystem';
import { createPlayer } from '../utils/player';
import { setupInputHandlers } from '../utils/inputHandlers';
import { setupHoverDetection } from '../utils/hoverDetection';

export function useThreeScene({ container, moveSpeed, hoveredBoxInfo, tooltipPosition }) {
    let scene, camera, renderer, boxes = [], baseModel = null, trackPieces = [];
    let player = null, carManager = null;
    let yaw = 0, pitch = -0.3;
    const cameraOffset = new THREE.Vector3(0, 2, 6);
    const keyState = new Set();
    let isDragging = false, previousPointer = { x: 0, y: 0 };
    const clock = new THREE.Clock();
    let animationId = null;
    let eventHandlers = {};
    const carOptions = ref([]);
    const destinationXOptions = ref([]);
    const destinationYOptions = ref([]);
    const routeStatus = ref("選擇車輛與目的地後派送");
    const isExecuting = ref(false);
    const executionStatus = ref("");

    const unloadBays = [
        { cells: ["0-0", "1-0"], protrudeSteps: 1 },
        { cells: ["3-0", "4-0"], protrudeSteps: 1 },
    ];
    const unloadAreaCells = new Set(unloadBays.flatMap((bay) => bay.cells));

    function init() {
        const sceneData = createScene(container.value);
        scene = sceneData.scene;
        camera = sceneData.camera;
        renderer = sceneData.renderer;

        carManager = new CarManager(scene);

        loadModel();
        setupInput();
        animate();
    }

    function loadModel() {
        const loader = new GLTFLoader();
        loader.load("/blue_box.glb", (gltf) => {
            baseModel = processModel(gltf.scene);
            const gridMetrics = createBoxGrid({
                scene,
                baseModel,
                boxes,
                unloadAreaCells,
                onComplete: (metrics) => {
                    adjustCamera(metrics);
                    createTrackSystem({ scene, baseModel, trackPieces, gridMetrics: metrics, unloadBays });
                    player = createPlayer(scene, metrics.modelSize);
                    if (carManager) {
                        carManager.setCargoBoxes(boxes);
                        carManager.createCars(metrics)
                            .then(() => {
                                carOptions.value = carManager.getCarOptions();
                                destinationXOptions.value = Array.from({ length: metrics.width }, (_, i) => ({
                                    id: `${i}`,
                                    label: `X${i + 1}`,
                                }));
                                destinationYOptions.value = Array.from({ length: metrics.depth }, (_, i) => ({
                                    id: `${i}`,
                                    label: `Y${i + 1}`,
                                }));
                                routeStatus.value = "車輛已載入，請選擇目的地";
                            })
                            .catch(() => {
                                routeStatus.value = "車輛載入失敗";
                            });
                    }
                    saveBoxData(boxes, metrics.modelSize);
                }
            });
        });
    }

    function setCarDestination(carId, destinationId) {
        if (!carManager) return false;
        const result = carManager.setDestination(carId, destinationId);
        routeStatus.value = result.message;
        return result.success;
    }

    function pickUpCargo(carId) {
        if (!carManager) return false;
        const result = carManager.pickUpCargo(carId);
        routeStatus.value = result.message;
        return result.success;
    }

    function dropCargo(carId) {
        if (!carManager) return false;
        const result = carManager.dropCargo(carId);
        routeStatus.value = result.message;
        return result.success;
    }

    function getDefaultCarId() {
        return carOptions.value[0]?.id || "";
    }

    function waitForCarReady(carId) {
        return new Promise((resolve) => {
            const checkReady = () => {
                if (!carManager) {
                    resolve(false);
                    return;
                }
                if (carManager.isCarReady(carId)) {
                    resolve(true);
                } else {
                    requestAnimationFrame(checkReady);
                }
            };
            checkReady();
        });
    }

    async function executeOrder({ order, items }) {
        if (isExecuting.value) {
            executionStatus.value = "目前已有訂單執行中，請稍候";
            return { success: false, message: executionStatus.value };
        }

        const carId = getDefaultCarId();
        if (!carManager || !carId) {
            executionStatus.value = "車輛尚未準備完成";
            return { success: false, message: executionStatus.value };
        }

        if (!Array.isArray(items) || items.length === 0) {
            executionStatus.value = "訂單內容為空";
            return { success: false, message: executionStatus.value };
        }

        const shippingTargets = [
            { label: "X1Y1", coord: { x: 0, z: 0 } },
            { label: "X4Y1", coord: { x: 3, z: 0 } },
        ];

        isExecuting.value = true;
        executionStatus.value = `開始執行訂單 ${order?.id ?? ""}`.trim();

        try {
            let targetIndex = 0;
            for (const itemId of items) {
                const cargoBox = boxes.find((box) => {
                    return box.userData?.boxId === itemId && !box.userData?.isPicked;
                });

                if (!cargoBox) {
                    executionStatus.value = `找不到商品 ${itemId}`;
                    continue;
                }

                const { x, z } = cargoBox.userData.gridCoord || {};
                if (x === undefined || z === undefined) {
                    executionStatus.value = `商品 ${itemId} 的位置資訊缺失`;
                    continue;
                }

                const moveResult = setCarDestination(carId, `${x}-${z}`);
                if (!moveResult) {
                    executionStatus.value = `無法前往商品 ${itemId}`;
                    continue;
                }

                await waitForCarReady(carId);

                const pickResult = pickUpCargo(carId);
                if (!pickResult) {
                    executionStatus.value = `商品 ${itemId} 取貨失敗`;
                    continue;
                }

                const shippingTarget = shippingTargets[targetIndex % shippingTargets.length];
                targetIndex += 1;
                setCarDestination(carId, `${shippingTarget.coord.x}-${shippingTarget.coord.z}`);
                await waitForCarReady(carId);

                const dropResult = dropCargo(carId);
                if (!dropResult) {
                    executionStatus.value = `商品 ${itemId} 卸貨失敗`;
                    continue;
                }

                executionStatus.value = `商品 ${itemId} 已送達 ${shippingTarget.label}`;
            }

            executionStatus.value = `訂單 ${order?.id ?? ""} 已完成`.trim();
            return { success: true, message: executionStatus.value };
        } finally {
            isExecuting.value = false;
        }
    }

    function processModel(originalScene) {
        originalScene.updateMatrixWorld(true);
        const originalBox = new THREE.Box3().setFromObject(originalScene);
        const originalSize = originalBox.getSize(new THREE.Vector3());

        const baseModel = new THREE.Group();
        const meshes = [];

        originalScene.traverse((child) => {
            if (child.isMesh) {
                child.updateMatrixWorld(true);
                const worldMatrix = child.matrixWorld.clone();
                let geometry = child.geometry.clone();
                const material = child.material.clone();
                geometry.applyMatrix4(worldMatrix);
                const newMesh = new THREE.Mesh(geometry, material);
                meshes.push(newMesh);
            }
        });

        const normalizedGroup = new THREE.Group();
        meshes.forEach((mesh) => normalizedGroup.add(mesh));
        normalizedGroup.updateMatrixWorld(true);

        const normalizedBox = new THREE.Box3().setFromObject(normalizedGroup);
        const normalizedCenter = normalizedBox.getCenter(new THREE.Vector3());
        normalizedGroup.position.set(-normalizedCenter.x, -normalizedCenter.y, -normalizedCenter.z);
        baseModel.add(normalizedGroup);

        return baseModel;
    }

    function adjustCamera(metrics) {
        const maxDim = Math.max(metrics.totalWidth, metrics.totalDepth, metrics.totalHeight);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.6;
        cameraOffset.set(0, Math.max(1.8, cameraZ * 0.2), cameraZ * 0.6);
    }

    function saveBoxData(boxes, modelSize) {
        const cargoDataToSave = convertBoxesToCargoData(boxes, {
            x: modelSize.x,
            y: modelSize.y,
            z: modelSize.z,
        });

        saveCargoDataToBackend(cargoDataToSave, {
            apiBaseUrl: "http://localhost:8000",
            onSuccess: (result) => console.log("✓ 貨物數據已同步", result),
            onError: (error) => console.error("✗ 同步失敗", error),
        });
    }

    function setupInput() {
        eventHandlers = setupInputHandlers({
            renderer,
            keyState,
            isDragging: (val) => isDragging = val,
            previousPointer: (val) => previousPointer = val,
            yaw: (val) => yaw = val,
            pitch: (val) => pitch = val,
            getIsDragging: () => isDragging,
            getPreviousPointer: () => previousPointer,
            getYaw: () => yaw,
            getPitch: () => pitch,
        });

        setupHoverDetection({
            renderer,
            camera,
            container: container.value,
            boxes,
            hoveredBoxInfo,
            tooltipPosition,
        });
    }

    function updatePlayer(delta) {
        if (!player) return;

        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        const direction = new THREE.Vector3();
        const vertical = new THREE.Vector3(0, 1, 0);
        
        if (keyState.has("KeyW") || keyState.has("ArrowUp")) direction.add(forward);
        if (keyState.has("KeyS") || keyState.has("ArrowDown")) direction.sub(forward);
        if (keyState.has("KeyA") || keyState.has("ArrowLeft")) direction.sub(right);
        if (keyState.has("KeyD") || keyState.has("ArrowRight")) direction.add(right);
        if (keyState.has("Space")) direction.add(vertical);
        if (keyState.has("ShiftLeft") || keyState.has("ShiftRight")) direction.sub(vertical);

        if (direction.lengthSq() > 0) {
            const moveDirection = direction.clone().normalize();
            player.position.addScaledVector(moveDirection, moveSpeed.value * delta);

            const horizontalDirection = moveDirection.clone();
            horizontalDirection.y = 0;

            if (horizontalDirection.lengthSq() > 0.0001) {
                const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(
                    new THREE.Matrix4().lookAt(
                        new THREE.Vector3(0, 0, 0),
                        horizontalDirection,
                        new THREE.Vector3(0, 1, 0),
                    ),
                );
                player.quaternion.slerp(targetQuaternion, 0.2);
            }
        }
    }

    function updateCamera() {
        if (!player) return;

        const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, "YXZ"));
        const rotatedOffset = cameraOffset.clone().applyQuaternion(rotation);

        camera.position.copy(player.position).add(rotatedOffset);
        camera.lookAt(player.position.clone().add(new THREE.Vector3(0, 1, 0)));
    }

    function animate() {
        animationId = requestAnimationFrame(animate);

        const delta = clock.getDelta();
        updatePlayer(delta);
        if (carManager) carManager.update(delta);
        updateCamera();

        renderer.render(scene, camera);
    }

    function cleanup() {
        if (animationId) cancelAnimationFrame(animationId);
        
        Object.values(eventHandlers).forEach(handler => {
            if (handler && handler.cleanup) handler.cleanup();
        });

        if (container.value && renderer?.domElement) {
            container.value.removeChild(renderer.domElement);
        }

        boxes.forEach(box => {
            box.traverse(child => {
                if (child.isMesh) {
                    child.geometry?.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material?.dispose();
                    }
                }
            });
            scene.remove(box);
        });

        trackPieces.forEach(track => {
            track.traverse(child => {
                if (child.isMesh) {
                    child.geometry?.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material?.dispose();
                    }
                }
            });
            scene.remove(track);
        });

        carManager?.dispose();
        renderer?.dispose();
    }

    return {
        init,
        cleanup,
        carOptions,
        destinationXOptions,
        destinationYOptions,
        routeStatus,
        isExecuting,
        executionStatus,
        setCarDestination,
        pickUpCargo,
        dropCargo,
        executeOrder,
    };
}
