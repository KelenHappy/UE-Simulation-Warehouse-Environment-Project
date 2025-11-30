import * as THREE from "three";

function resetTransform(object) {
    object.position.set(0, 0, 0);
    object.rotation.set(0, 0, 0);
    object.quaternion.set(0, 0, 0, 1);
    object.scale.set(1, 1, 1);
    object.matrix.identity();
    object.matrixWorld.identity();
    object.matrixWorldNeedsUpdate = false;
}

function createTrackSegment({ sizeX, sizeZ, position, gridMetrics, trackThickness, parent, baseModel }) {
    const segment = baseModel.clone(true);
    segment.traverse((child) => {
        if (child.isMesh || child.isGroup || child.isObject3D) {
            resetTransform(child);
        }
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 0.08,
                roughness: 0.3,
                emissive: 0x2a2a2a,
                emissiveIntensity: 0.2,
            });
        }
    });

    resetTransform(segment);
    segment.scale.set(
        sizeX / gridMetrics.boxWidth,
        trackThickness / gridMetrics.boxHeight,
        sizeZ / gridMetrics.boxDepth
    );
    segment.position.copy(position);
    parent.add(segment);
    return segment;
}

export function createTrackSystem({ scene, baseModel, trackPieces, gridMetrics, unloadBays }) {
    if (!baseModel) return;

    const trackGroup = new THREE.Group();
    const laneWidth = Math.max(
        Math.min(gridMetrics.spacingX, gridMetrics.spacingZ) * 0.8,
        gridMetrics.boxWidth * 0.1
    );

    const railWidth = laneWidth * 0.15;
    const trackGauge = laneWidth * 0.6;
    const trackThickness = gridMetrics.boxHeight * 0.08;
    const trackY = gridMetrics.pillarTopY + trackThickness * 0.5;

    const stepX = gridMetrics.boxWidth + gridMetrics.spacingX;
    const stepZ = gridMetrics.boxDepth + gridMetrics.spacingZ;

    const horizontalLength = gridMetrics.totalWidth + laneWidth;
    const verticalLength = gridMetrics.totalDepth + laneWidth;

    // 橫向雙軌道
    for (let z = 0; z < gridMetrics.depth - 1; z++) {
        const zPos = gridMetrics.startZ + (z + 0.5) * stepZ - gridMetrics.modelCenter.z;
        
        trackPieces.push(createTrackSegment({
            sizeX: horizontalLength, sizeZ: railWidth,
            position: new THREE.Vector3(-trackGauge / 2, trackY, zPos),
            gridMetrics, trackThickness, parent: trackGroup, baseModel
        }));
        
        trackPieces.push(createTrackSegment({
            sizeX: horizontalLength, sizeZ: railWidth,
            position: new THREE.Vector3(trackGauge / 2, trackY, zPos),
            gridMetrics, trackThickness, parent: trackGroup, baseModel
        }));
    }

    // 縱向雙軌道
    for (let x = 0; x < gridMetrics.width - 1; x++) {
        const xPos = gridMetrics.startX + (x + 0.5) * stepX - gridMetrics.modelCenter.x;
        
        trackPieces.push(createTrackSegment({
            sizeX: railWidth, sizeZ: verticalLength,
            position: new THREE.Vector3(xPos, trackY, -trackGauge / 2),
            gridMetrics, trackThickness, parent: trackGroup, baseModel
        }));
        
        trackPieces.push(createTrackSegment({
            sizeX: railWidth, sizeZ: verticalLength,
            position: new THREE.Vector3(xPos, trackY, trackGauge / 2),
            gridMetrics, trackThickness, parent: trackGroup, baseModel
        }));
    }

    // 外環軌道
    const leftRingX = gridMetrics.startX - stepX / 2 - gridMetrics.modelCenter.x;
    const rightRingX = gridMetrics.startX + (gridMetrics.width - 1) * stepX + stepX / 2 - gridMetrics.modelCenter.x;
    const topRingZ = gridMetrics.startZ - stepZ / 2 - gridMetrics.modelCenter.z;
    const bottomRingZ = gridMetrics.startZ + (gridMetrics.depth - 1) * stepZ + stepZ / 2 - gridMetrics.modelCenter.z;

    const horizontalRingSpan = rightRingX - leftRingX;
    const verticalRingSpan = bottomRingZ - topRingZ;
    const ringCenterX = (leftRingX + rightRingX) / 2;
    const ringCenterZ = (topRingZ + bottomRingZ) / 2;
    const horizontalRingLength = Math.max(horizontalRingSpan - laneWidth, laneWidth);
    const verticalRingLength = Math.max(verticalRingSpan - laneWidth, laneWidth);

    // 頂部、底部、左側、右側外環
    const outerRings = [
        { sizeX: horizontalRingLength, sizeZ: railWidth, pos: new THREE.Vector3(ringCenterX, trackY, topRingZ - trackGauge / 2) },
        { sizeX: horizontalRingLength, sizeZ: railWidth, pos: new THREE.Vector3(ringCenterX, trackY, topRingZ + trackGauge / 2) },
        { sizeX: horizontalRingLength, sizeZ: railWidth, pos: new THREE.Vector3(ringCenterX, trackY, bottomRingZ - trackGauge / 2) },
        { sizeX: horizontalRingLength, sizeZ: railWidth, pos: new THREE.Vector3(ringCenterX, trackY, bottomRingZ + trackGauge / 2) },
        { sizeX: railWidth, sizeZ: verticalRingLength, pos: new THREE.Vector3(leftRingX - trackGauge / 2, trackY, ringCenterZ) },
        { sizeX: railWidth, sizeZ: verticalRingLength, pos: new THREE.Vector3(leftRingX + trackGauge / 2, trackY, ringCenterZ) },
        { sizeX: railWidth, sizeZ: verticalRingLength, pos: new THREE.Vector3(rightRingX - trackGauge / 2, trackY, ringCenterZ) },
        { sizeX: railWidth, sizeZ: verticalRingLength, pos: new THREE.Vector3(rightRingX + trackGauge / 2, trackY, ringCenterZ) },
    ];

    outerRings.forEach(ring => {
        trackPieces.push(createTrackSegment({
            sizeX: ring.sizeX, sizeZ: ring.sizeZ,
            position: ring.pos,
            gridMetrics, trackThickness, parent: trackGroup, baseModel
        }));
    });

    // 卸貨區軌道
    createUnloadAreas({ scene, baseModel, trackPieces, gridMetrics, unloadBays, trackThickness });

    scene.add(trackGroup);
}

function createUnloadAreas({ scene, baseModel, trackPieces, gridMetrics, unloadBays, trackThickness }) {
    if (!baseModel || unloadBays.length === 0) return;

    const trackY = gridMetrics.bottomY + trackThickness * 0.5;
    const stepX = gridMetrics.boxWidth + gridMetrics.spacingX;
    const stepZ = gridMetrics.boxDepth + gridMetrics.spacingZ;

    unloadBays.forEach((bay) => {
        const unloadCells = bay.cells.map((cellKey) => {
            const [x, z] = cellKey.split("-").map(Number);
            return { x, z };
        });

        const minX = Math.min(...unloadCells.map((cell) => cell.x));
        const maxX = Math.max(...unloadCells.map((cell) => cell.x));
        const minZ = Math.min(...unloadCells.map((cell) => cell.z));
        const maxZ = Math.max(...unloadCells.map((cell) => cell.z));

        const basePadWidth = (maxX - minX + 1) * gridMetrics.boxWidth + (maxX - minX) * gridMetrics.spacingX;
        const basePadDepth = (maxZ - minZ + 1) * gridMetrics.boxDepth + (maxZ - minZ) * gridMetrics.spacingZ;
        const protrudeDepth = Math.max(0, bay.protrudeSteps || 0) * stepZ;
        const padWidth = basePadWidth;
        const padDepth = basePadDepth + protrudeDepth;

        const centerX = gridMetrics.startX + ((minX + maxX) / 2) * stepX - gridMetrics.modelCenter.x;
        const baseCenterZ = gridMetrics.startZ + ((minZ + maxZ) / 2) * stepZ - gridMetrics.modelCenter.z;
        const centerZ = baseCenterZ - protrudeDepth / 2;

        trackPieces.push(createTrackSegment({
            sizeX: padWidth, sizeZ: padDepth,
            position: new THREE.Vector3(centerX, trackY, centerZ),
            gridMetrics, trackThickness, parent: scene, baseModel
        }));
    });
}
