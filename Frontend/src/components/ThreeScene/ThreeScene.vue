<template>
    <div class="three-scene-wrapper">
        <div ref="container" class="three-container"></div>
        <ControlsHint />
        <SpeedControl v-model="moveSpeed" />
        <BoxTooltip 
            v-if="hoveredBoxInfo" 
            :box-info="hoveredBoxInfo" 
            :position="tooltipPosition" 
        />
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import ControlsHint from './ControlsHint.vue';
import SpeedControl from './SpeedControl.vue';
import BoxTooltip from './BoxTooltip.vue';
import { useThreeScene } from './composables/useThreeScene';

const container = ref(null);
const moveSpeed = ref(6.5);
const hoveredBoxInfo = ref(null);
const tooltipPosition = ref({ x: 0, y: 0 });

const { init, cleanup } = useThreeScene({
    container,
    moveSpeed,
    hoveredBoxInfo,
    tooltipPosition
});

onMounted(() => {
    if (container.value) {
        init();
    }
});

onUnmounted(() => {
    cleanup();
});
</script>

<style scoped>
.three-scene-wrapper {
    width: 100%;
    position: relative;
}

.three-container {
    width: 100%;
    height: 500px;
    border-radius: 8px;
    overflow: hidden;
    cursor: grab;
    touch-action: none;
    background: #222222;
}

.three-container:active {
    cursor: grabbing;
}
</style>
