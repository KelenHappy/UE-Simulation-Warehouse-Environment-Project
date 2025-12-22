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
            <label for="destination-x">前往位置 X</label>
            <select id="destination-x" v-model="localSelectedX">
                <option value="" disabled>請選擇 X</option>
                <option
                    v-for="point in destinationXOptions"
                    :key="point.id"
                    :value="point.id"
                >
                    {{ point.label }}
                </option>
            </select>
        </div>
        <div class="field">
            <label for="destination-y">前往位置 Y</label>
            <select id="destination-y" v-model="localSelectedY">
                <option value="" disabled>請選擇 Y</option>
                <option
                    v-for="point in destinationYOptions"
                    :key="point.id"
                    :value="point.id"
                >
                    {{ point.label }}
                </option>
            </select>
        </div>
        <div class="field">
            <label for="mount-select">攜帶位置</label>
            <select id="mount-select" v-model="localMountPosition">
                <option value="front">車頭</option>
                <option value="back">車尾</option>
            </select>
        </div>
        <div class="actions">
            <button class="assign-btn" @click="$emit('assign-route')">
                派送
            </button>
            <button class="pickup-btn" @click="$emit('pick-cargo')">
                拿取貨物
            </button>
            <button class="drop-btn" @click="$emit('drop-cargo')">
                放下貨物
            </button>
        </div>
    </div>
</template>

<script setup>
import { watch, ref } from 'vue';

const props = defineProps({
    carOptions: {
        type: Array,
        required: true,
    },
    destinationXOptions: {
        type: Array,
        required: true,
    },
    destinationYOptions: {
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
    mountPosition: {
        type: String,
        default: 'front',
    },
});

const emit = defineEmits(['update:selectedCar', 'update:selectedDestination', 'update:mountPosition', 'assign-route', 'pick-cargo', 'drop-cargo']);

const localSelectedCar = ref(props.selectedCar);
const localSelectedDestination = ref(props.selectedDestination);
const localSelectedX = ref('');
const localSelectedY = ref('');
const localMountPosition = ref(props.mountPosition ?? 'front');

watch(() => props.selectedCar, (val) => {
    localSelectedCar.value = val;
});

watch(() => props.selectedDestination, (val) => {
    localSelectedDestination.value = val;
    const [x, y] = val?.split('-') || [];
    localSelectedX.value = x || '';
    localSelectedY.value = y || '';
});

watch(() => props.mountPosition, (val) => {
    localMountPosition.value = val || 'front';
});

watch(() => props.destinationXOptions, (options) => {
    if (!localSelectedX.value && options?.length) {
        localSelectedX.value = options[0].id;
    }
});

watch(() => props.destinationYOptions, (options) => {
    if (!localSelectedY.value && options?.length) {
        localSelectedY.value = options[0].id;
    }
});

watch(localSelectedCar, (val) => emit('update:selectedCar', val));
watch(localSelectedDestination, (val) => emit('update:selectedDestination', val));
watch(localMountPosition, (val) => emit('update:mountPosition', val));

watch([localSelectedX, localSelectedY], ([x, y]) => {
    if (x && y) {
        const combined = `${x}-${y}`;
        localSelectedDestination.value = combined;
        emit('update:selectedDestination', combined);
    } else {
        localSelectedDestination.value = '';
        emit('update:selectedDestination', '');
    }
});
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

.actions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
}

.assign-btn,
.pickup-btn,
.drop-btn {
    background: linear-gradient(135deg, #22d3ee, #6366f1);
    border: none;
    color: white;
    padding: 8px 10px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.1s ease, box-shadow 0.2s ease;
}

.pickup-btn {
    background: linear-gradient(135deg, #f59e0b, #f97316);
}

.drop-btn {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    grid-column: span 2;
}

.assign-btn:hover,
.pickup-btn:hover,
.drop-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(99, 102, 241, 0.35);
}

.assign-btn:active,
.pickup-btn:active,
.drop-btn:active {
    transform: translateY(0);
}
</style>
