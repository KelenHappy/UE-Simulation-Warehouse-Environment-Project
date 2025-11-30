<template>
  <div class="cargo-test">
    <h2>🧪 Cargo Data 測試工具</h2>
    <StatusSection :loading="loading" :error="error" :cargo-count="cargoData.length" :last-update="lastUpdate" />
    <ActionsSection 
      :loading="loading" 
      :is-polling="isPolling"
      @fetch-cargo="handleFetchCargo"
      @fetch-latest="handleFetchLatest"
      @clear-cargo="handleClearCargo"
      @create-test="handleCreateTestData"
      @toggle-polling="togglePolling"
    />
    <DataSection :cargo-data="cargoData" />
    <ConsoleSection :logs="consoleLogs" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import StatusSection from './StatusSection.vue'
import ActionsSection from './ActionsSection.vue'
import DataSection from './DataSection.vue'
import ConsoleSection from './ConsoleSection.vue'
import { useCargoTest } from './composables/useCargoTest'

const {
  cargoData,
  loading,
  error,
  lastUpdate,
  consoleLogs,
  isPolling,
  handleFetchCargo,
  handleFetchLatest,
  handleClearCargo,
  handleCreateTestData,
  togglePolling
} = useCargoTest()
</script>

<style scoped>
.cargo-test {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h2 {
  color: #2c3e50;
  border-bottom: 3px solid #3498db;
  padding-bottom: 10px;
  margin-bottom: 30px;
}
</style>
