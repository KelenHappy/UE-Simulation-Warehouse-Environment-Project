<template>
  <div class="cargo-item">
    <div class="cargo-header">
      <span class="cargo-id">{{ cargo.id }}</span>
      <span class="cargo-index">#{{ index + 1 }}</span>
    </div>
    <div class="cargo-details">
      <div class="detail-row">
        <span class="detail-label">位置:</span>
        <span class="detail-value">
          X: {{ cargo.position.x.toFixed(2) }},
          Y: {{ cargo.position.y.toFixed(2) }},
          Z: {{ cargo.position.z.toFixed(2) }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">尺寸:</span>
        <span class="detail-value">
          W: {{ cargo.size.x.toFixed(2) }},
          H: {{ cargo.size.y.toFixed(2) }},
          D: {{ cargo.size.z.toFixed(2) }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">時間:</span>
        <span class="detail-value timestamp">{{ formatTime(cargo.timestamp) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  cargo: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
})

function formatTime(timestamp) {
  if (!timestamp) return '未知'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}
</script>

<style scoped>
.cargo-item {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 15px;
  background: #fafafa;
  transition: all 0.2s ease;
}

.cargo-item:hover {
  border-color: #3498db;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
}

.cargo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.cargo-id {
  font-weight: 700;
  color: #2c3e50;
  font-size: 16px;
}

.cargo-index {
  background: #3498db;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.cargo-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  gap: 10px;
}

.detail-label {
  font-weight: 600;
  color: #555;
  min-width: 50px;
}

.detail-value {
  color: #2c3e50;
  font-family: 'Courier New', monospace;
}

.timestamp {
  font-size: 12px;
  color: #7f8c8d;
}
</style>
