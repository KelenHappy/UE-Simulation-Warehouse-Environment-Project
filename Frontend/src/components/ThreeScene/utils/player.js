import * as THREE from "three";

export function createPlayer(scene, modelSize) {
    const playerGeometry = new THREE.CapsuleGeometry(
        modelSize.x * 0.15,
        modelSize.y * 0.2,
        8,
        16
    );
    const playerMaterial = new THREE.MeshStandardMaterial({
        color: 0x54a6ff,
        roughness: 0.4,
        metalness: 0.2,
        emissive: 0x123456,
        emissiveIntensity: 0.25,
    });

    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.castShadow = true;
    player.receiveShadow = true;
    player.position.set(0, modelSize.y * 0.5, Math.max(modelSize.z * 2, 3));
    scene.add(player);
    
    return player;
}
