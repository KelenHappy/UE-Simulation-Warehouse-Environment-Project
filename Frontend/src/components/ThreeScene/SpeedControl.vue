<template>
    <div class="speed-control">
        <label>
            速度
            <input
                :value="modelValue"
                @input="$emit('update:modelValue', Number($event.target.value))"
                type="range"
                min="1"
                max="20"
                step="0.5"
            />
            <span class="speed-value">{{ modelValue.toFixed(1) }}</span>
        </label>
    </div>
</template>

<script setup>
defineProps({
    modelValue: {
        type: Number,
        required: true
    }
});

defineEmits(['update:modelValue']);
</script>

<style scoped>
.speed-control {
    position: absolute;
    bottom: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    z-index: 10;
    backdrop-filter: blur(4px);
}

.speed-control input[type="range"] {
    width: 120px;
}

.speed-value {
    min-width: 40px;
    display: inline-block;
    text-align: right;
}
</style>
