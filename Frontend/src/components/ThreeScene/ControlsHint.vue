<template>
    <div class="controls-hint">
        <span>🎮 WASD/方向鍵 移動 | 🖱️ 拖曳旋轉鏡頭 | ␣ 上升 / Shift 下降</span>
    </div>
</template>

<style scoped>
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
