<template>
    <div class="route-planner-card">
        <div class="header">
            <span>🚗 車輛派送</span>
            <span class="status">{{ status }}</span>
        </div>
        <div class="field">
            <label for="car-select">選擇車輛</label>
            <select id="car-select" v-model="localSelectedCar">
                <option value="" disabled>請選擇車輛</option>
                <option v-for="car in carOptions" :key="car.id" :value="car.id">
                    {{ car.label }}
                </option>
            </select>
        </div>
        <div class="field">
            <label for="destination-select">前往位置</label>
            <select id="destination-select" v-model="localSelectedDestination">
                <option value="" disabled>請選擇目標點</option>
                <option
                    v-for="point in destinationOptions"
                    :key="point.id"
                    :value="point.id"
                >
                    {{ point.label }}
                </option>
            </select>
        </div>
        <button class="assign-btn" @click="$emit('assign-route')">
            派送
        </button>
    </div>
</template>

<script setup>
import { watch, ref } from 'vue';

const props = defineProps({
    carOptions: {
        type: Array,
        required: true,
    },
    destinationOptions: {
        type: Array,
        required: true,
    },
    selectedCar: {
        type: String,
        default: '',
    },
    selectedDestination: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        default: '',
    },
});

const emit = defineEmits(['update:selectedCar', 'update:selectedDestination', 'assign-route']);

const localSelectedCar = ref(props.selectedCar);
const localSelectedDestination = ref(props.selectedDestination);

watch(() => props.selectedCar, (val) => {
    localSelectedCar.value = val;
});

watch(() => props.selectedDestination, (val) => {
    localSelectedDestination.value = val;
});

watch(localSelectedCar, (val) => emit('update:selectedCar', val));
watch(localSelectedDestination, (val) => emit('update:selectedDestination', val));
</script>

<style scoped>
.route-planner-card {
    background: rgba(0, 0, 0, 0.7);
    color: #e5e7eb;
    padding: 12px;
    border-radius: 10px;
    width: 220px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(6px);
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 14px;
}

.status {
    font-size: 11px;
    color: #a5b4fc;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
}

label {
    color: #cbd5e1;
}

select {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #e5e7eb;
    padding: 6px;
    border-radius: 6px;
    outline: none;
}

select:focus {
    border-color: #818cf8;
    box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.3);
}

.assign-btn {
    background: linear-gradient(135deg, #22d3ee, #6366f1);
    border: none;
    color: white;
    padding: 8px 10px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.1s ease, box-shadow 0.2s ease;
}

.assign-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(99, 102, 241, 0.35);
}

.assign-btn:active {
    transform: translateY(0);
}
</style>
