<template>
    <div class="three-scene-wrapper">
        <div ref="container" class="three-container"></div>
        <ControlsHint />
        <RoutePlanner
            class="route-planner"
            :car-options="carOptions"
            :destination-options="destinationOptions"
            v-model:selected-car="selectedCar"
            v-model:selected-destination="selectedDestination"
            :status="routeStatus"
            @assign-route="handleAssignRoute"
            @pick-cargo="handlePickCargo"
            @drop-cargo="handleDropCargo"
        />
        <SpeedControl v-model="moveSpeed" />
        <BoxTooltip
            v-if="hoveredBoxInfo"
            :box-info="hoveredBoxInfo"
            :position="tooltipPosition"
        />
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import ControlsHint from './ControlsHint.vue';
import SpeedControl from './SpeedControl.vue';
import BoxTooltip from './BoxTooltip.vue';
import RoutePlanner from './RoutePlanner.vue';
import { useThreeScene } from './composables/useThreeScene';

const container = ref(null);
const moveSpeed = ref(6.5);
const hoveredBoxInfo = ref(null);
const tooltipPosition = ref({ x: 0, y: 0 });
const selectedCar = ref('');
const selectedDestination = ref('');
const {
    init,
    cleanup,
    carOptions,
    destinationOptions,
    routeStatus,
    setCarDestination,
    pickUpCargo,
    dropCargo,
} = useThreeScene({
    container,
    moveSpeed,
    hoveredBoxInfo,
    tooltipPosition,
});

watch(carOptions, (options) => {
    if (!selectedCar.value && options.length > 0) {
        selectedCar.value = options[0].id;
    }
});

watch(destinationOptions, (options) => {
    if (!selectedDestination.value && options.length > 0) {
        selectedDestination.value = options[0].id;
    }
});

const handleAssignRoute = () => {
    if (!selectedCar.value || !selectedDestination.value) {
        routeStatus.value = "請先選擇車輛與目的地";
        return;
    }
    setCarDestination(selectedCar.value, selectedDestination.value);
};

const handlePickCargo = () => {
    if (!selectedCar.value) {
        routeStatus.value = "請先選擇車輛";
        return;
    }
    pickUpCargo(selectedCar.value);
};

const handleDropCargo = () => {
    if (!selectedCar.value) {
        routeStatus.value = "請先選擇車輛";
        return;
    }
    dropCargo(selectedCar.value);
};

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

.route-planner {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 11;
}
</style>
