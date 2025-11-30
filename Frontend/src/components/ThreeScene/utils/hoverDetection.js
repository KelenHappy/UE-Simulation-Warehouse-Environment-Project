import * as THREE from "three";

export function setupHoverDetection({ renderer, camera, container, boxes, hoveredBoxInfo, tooltipPosition }) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function findParentBox(object) {
        let current = object;
        while (current) {
            if (boxes.includes(current)) return current;
            current = current.parent;
        }
        return null;
    }

    const handleMouseMove = (event) => {
        if (!renderer || !camera || !container) return;

        const rect = renderer.domElement.getBoundingClientRect();
        if (
            event.clientX < rect.left || event.clientX > rect.right ||
            event.clientY < rect.top || event.clientY > rect.bottom
        ) {
            hoveredBoxInfo.value = null;
            return;
        }

        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(boxes, true);

        if (intersects.length > 0) {
            const box = findParentBox(intersects[0].object);

            if (box && box.userData?.boxId) {
                const containerRect = container.getBoundingClientRect();
                hoveredBoxInfo.value = {
                    boxId: box.userData.boxId,
                    productName: box.userData.productName,
                };
                tooltipPosition.value = {
                    x: event.clientX - containerRect.left,
                    y: event.clientY - containerRect.top,
                };
                return;
            }
        }

        hoveredBoxInfo.value = null;
    };

    const handleMouseLeave = () => {
        hoveredBoxInfo.value = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    renderer.domElement.addEventListener("mouseleave", handleMouseLeave);

    return {
        cleanup: () => {
            window.removeEventListener("mousemove", handleMouseMove);
            renderer.domElement.removeEventListener("mouseleave", handleMouseLeave);
        }
    };
}
