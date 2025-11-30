<template>
  <div class="data-section">
    <h3>貨物數據 (前10個)</h3>
    <div v-if="cargoData.length === 0" class="empty-state">
      <p>📦 暫無貨物數據</p>
      <p class="hint">點擊「創建測試數據」或「獲取貨物數據」來載入數據</p>
    </div>
    <div v-else class="cargo-list">
      <CargoItem 
        v-for="(cargo, index) in cargoData.slice(0, 10)"
        :key="cargo.id"
        :cargo="cargo"
        :index="index"
      />
    </div>
    <div v-if="cargoData.length > 10" class="more-info">
      還有 {{ cargoData.length - 10 }} 個貨物未顯示...
    </div>
  </div>
</template>

<script setup>
import CargoItem from './CargoItem.vue'

defineProps({
  cargoData: {
    type: Array,
    required: true
  }
})
</script>

<style scoped>
.data-section {
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

.empty-state {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.empty-state p {
  margin: 10px 0;
}

.hint {
  font-size: 14px;
  color: #95a5a6;
}

.cargo-list {
  display: grid;
  gap: 15px;
}

.more-info {
  text-align: center;
  padding: 15px;
  color: #7f8c8d;
  font-style: italic;
}
</style>
