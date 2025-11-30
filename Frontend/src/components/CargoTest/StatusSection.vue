<template>
  <div class="status-section">
    <h3>狀態</h3>
    <div class="status-grid">
      <div class="status-item">
        <span class="label">載入中:</span>
        <span :class="['value', loading ? 'active' : '']">{{ loading ? '是' : '否' }}</span>
      </div>
      <div class="status-item">
        <span class="label">錯誤:</span>
        <span class="value error">{{ error || '無' }}</span>
      </div>
      <div class="status-item">
        <span class="label">貨物總數:</span>
        <span class="value">{{ cargoCount }}</span>
      </div>
      <div class="status-item">
        <span class="label">最後更新:</span>
        <span class="value">{{ lastUpdate || '未更新' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  loading: Boolean,
  error: String,
  cargoCount: Number,
  lastUpdate: String
})
</script>

<style scoped>
.status-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

h3 {
  color: #34495e;
  margin-bottom: 15px;
  font-size: 18px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.label {
  font-weight: 600;
  color: #555;
}

.value {
  color: #2c3e50;
  font-weight: 500;
}

.value.active {
  color: #3498db;
  font-weight: 700;
}

.value.error {
  color: #e74c3c;
}
</style>
