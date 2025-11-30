export function setupInputHandlers({ renderer, keyState, isDragging, previousPointer, yaw, pitch, getIsDragging, getPreviousPointer, getYaw, getPitch }) {
    const handleKeyDown = (event) => {
        const handledKeys = [
            "KeyW", "KeyA", "KeyS", "KeyD",
            "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
            "Space", "ShiftLeft", "ShiftRight",
        ];

        if (handledKeys.includes(event.code)) {
            event.preventDefault();
            keyState.add(event.code);
        }
    };

    const handleKeyUp = (event) => {
        keyState.delete(event.code);
    };

    const handlePointerDown = (event) => {
        isDragging(true);
        previousPointer({ x: event.clientX, y: event.clientY });
    };

    const handlePointerMove = (event) => {
        if (!getIsDragging()) return;
        
        const deltaX = event.clientX - getPreviousPointer().x;
        const deltaY = event.clientY - getPreviousPointer().y;
        previousPointer({ x: event.clientX, y: event.clientY });

        const sensitivity = 0.005;
        yaw(getYaw() - deltaX * sensitivity);
        pitch(getPitch() - deltaY * sensitivity);
        
        const pitchLimit = Math.PI / 2 - 0.1;
        pitch(Math.max(-pitchLimit, Math.min(pitchLimit, getPitch())));
    };

    const handlePointerUp = () => {
        isDragging(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    renderer.domElement.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);

    return {
        cleanup: () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            renderer.domElement.removeEventListener("mousedown", handlePointerDown);
            window.removeEventListener("mousemove", handlePointerMove);
            window.removeEventListener("mouseup", handlePointerUp);
        }
    };
}
