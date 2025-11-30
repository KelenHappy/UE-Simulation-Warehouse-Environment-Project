<template>
  <div class="actions-section">
    <h3>操作</h3>
    <div class="button-grid">
      <button @click="$emit('fetch-cargo')" :disabled="loading" class="btn btn-primary">
        📥 獲取貨物數據
      </button>
      <button @click="$emit('fetch-latest')" :disabled="loading" class="btn btn-primary">
        🔄 獲取最新貨物
      </button>
      <button @click="$emit('clear-cargo')" :disabled="loading" class="btn btn-danger">
        🗑️ 清空貨物數據
      </button>
      <button @click="$emit('create-test')" :disabled="loading" class="btn btn-success">
        ➕ 創建測試數據
      </button>
      <button @click="$emit('toggle-polling')" class="btn btn-secondary">
        {{ isPolling ? '⏸️ 停止輪詢' : '▶️ 開始輪詢' }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  loading: Boolean,
  isPolling: Boolean
})

defineEmits(['fetch-cargo', 'fetch-latest', 'clear-cargo', 'create-test', 'toggle-polling'])
</script>

<style scoped>
.actions-section {
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

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
}

.btn-success {
  background: #2ecc71;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #27ae60;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(46, 204, 113, 0.3);
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(149, 165, 166, 0.3);
}
</style>
