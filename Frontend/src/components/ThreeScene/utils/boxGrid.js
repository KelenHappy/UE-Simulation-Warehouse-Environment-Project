import * as THREE from "three";
import { warehouseGrid } from "../../../utils/warehouseConfig";

export function createBoxGrid({ scene, baseModel, boxes, unloadAreaCells, onComplete }) {
    const { width, depth, height } = warehouseGrid;
    
    const finalBox = new THREE.Box3().setFromObject(baseModel);
    const modelSize = finalBox.getSize(new THREE.Vector3());
    const modelCenter = finalBox.getCenter(new THREE.Vector3());

    const boxWidth = Math.max(Math.abs(modelSize.x), 0.01);
    const boxDepth = Math.max(Math.abs(modelSize.z), 0.01);
    const boxHeight = Math.max(Math.abs(modelSize.y), 0.01);

    const spacingX = boxWidth * 0.2;
    const spacingZ = boxDepth * 0.2;
    const spacingY = boxHeight * 0;

    const totalWidth = width * boxWidth + (width - 1) * spacingX;
    const totalDepth = depth * boxDepth + (depth - 1) * spacingZ;
    const totalHeight = height * boxHeight + (height - 1) * spacingY;

    const startX = -totalWidth / 2 + boxWidth / 2;
    const startZ = -totalDepth / 2 + boxDepth / 2;
    const startY = -totalHeight / 2 + boxHeight / 2;

    const topLayerCenterY = startY + (height - 1) * (boxHeight + spacingY);
    const topY = topLayerCenterY - modelCenter.y + boxHeight / 2;
    const pillarTopY = topY + boxHeight;
    const bottomY = startY - modelCenter.y - boxHeight / 2;

    const shelfMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.3,
        roughness: 0.7,
    });

    const pillarRadius = Math.min(boxWidth, boxDepth) * 0.02;

    for (let x = 0; x < width; x++) {
        for (let z = 0; z < depth; z++) {
            const isUnloadCell = unloadAreaCells.has(`${x}-${z}`);

            for (let y = 0; y < height; y++) {
                if (isUnloadCell) continue;

                const targetCenterX = startX + x * (boxWidth + spacingX);
                const targetCenterZ = startZ + z * (boxDepth + spacingZ);
                const targetCenterY = startY + y * (boxHeight + spacingY);

                const clonedModel = baseModel.clone(true);
                clonedModel.position.set(
                    targetCenterX - modelCenter.x,
                    targetCenterY - modelCenter.y,
                    targetCenterZ - modelCenter.z
                );
                
                const boxId = boxes.length + 1;
                const defaultPosition = clonedModel.position.clone();
                clonedModel.userData = {
                    boxId,
                    productName: `商品 ${boxId}`,
                    gridCoord: { x, y, z },
                    defaultGridCoord: { x, y, z },
                    defaultPosition,
                    isPicked: false,
                    originalScale: clonedModel.scale.clone(),
                    originalWorldScale: (() => {
                        const scale = new THREE.Vector3();
                        clonedModel.getWorldScale(scale);
                        return scale;
                    })(),
                    originalParent: scene,
                };
                
                scene.add(clonedModel);
                boxes.push(clonedModel);
            }
        }
    }

    for (let x = 0; x < width; x++) {
        for (let z = 0; z < depth; z++) {
            const targetCenterX = startX + x * (boxWidth + spacingX);
            const targetCenterZ = startZ + z * (boxDepth + spacingZ);
            const pillarHeight = pillarTopY - bottomY;
            const halfWidth = boxWidth / 2;
            const halfDepth = boxDepth / 2;

            const corners = [
                { x: -halfWidth, z: -halfDepth },
                { x: halfWidth, z: -halfDepth },
                { x: -halfWidth, z: halfDepth },
                { x: halfWidth, z: halfDepth },
            ];

            corners.forEach((corner) => {
                const pillarGeometry = new THREE.CylinderGeometry(pillarRadius, pillarRadius, pillarHeight, 8);
                const pillar = new THREE.Mesh(pillarGeometry, shelfMaterial);
                pillar.position.set(
                    targetCenterX - modelCenter.x + corner.x,
                    bottomY + pillarHeight / 2,
                    targetCenterZ - modelCenter.z + corner.z
                );
                scene.add(pillar);
            });
        }
    }

    const gridMetrics = {
        width, depth, height,
        boxWidth, boxDepth, boxHeight,
        spacingX, spacingZ, spacingY,
        totalWidth, totalDepth, totalHeight,
        startX, startY, startZ,
        topY, pillarTopY, bottomY,
        modelCenter, modelSize
    };

    if (onComplete) onComplete(gridMetrics);
    
    return gridMetrics;
}
