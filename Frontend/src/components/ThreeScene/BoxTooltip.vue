<template>
    <div 
        class="box-tooltip"
        :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    >
        <div class="tooltip-label">箱子編號</div>
        <div class="tooltip-id">#{{ boxInfo.boxId }}</div>
        <div class="tooltip-label">商品名稱</div>
        <div class="tooltip-name">{{ boxInfo.productName }}</div>
    </div>
</template>

<script setup>
defineProps({
    boxInfo: {
        type: Object,
        required: true
    },
    position: {
        type: Object,
        required: true
    }
});
</script>

<style scoped>
.box-tooltip {
    position: absolute;
    padding: 10px 12px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 8px;
    font-size: 12px;
    pointer-events: none;
    transform: translate(12px, -12px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
    z-index: 12;
    backdrop-filter: blur(6px);
    min-width: 160px;
}

.tooltip-label {
    font-size: 11px;
    color: #cbd5e1;
    letter-spacing: 0.5px;
}

.tooltip-id {
    font-weight: 700;
    font-size: 16px;
    margin-bottom: 6px;
    color: #a5b4fc;
}

.tooltip-name {
    font-weight: 600;
    color: #f9fafb;
}
</style>
