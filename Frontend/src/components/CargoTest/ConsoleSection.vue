<template>
  <div class="console-section">
    <h3>控制台輸出</h3>
    <div class="console-output">
      <div
        v-for="(log, index) in logs"
        :key="index"
        :class="['log-entry', log.type]"
      >
        <span class="log-time">{{ log.time }}</span>
        <span class="log-message">{{ log.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  logs: {
    type: Array,
    required: true
  }
})
</script>

<style scoped>
.console-section {
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

.console-output {
  max-height: 300px;
  overflow-y: auto;
  background: #1e1e1e;
  padding: 15px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.log-entry {
  margin-bottom: 8px;
  display: flex;
  gap: 10px;
}

.log-time {
  color: #888;
  min-width: 80px;
}

.log-entry.info .log-message {
  color: #61dafb;
}

.log-entry.success .log-message {
  color: #98c379;
}

.log-entry.error .log-message {
  color: #e06c75;
}

.log-entry.warning .log-message {
  color: #e5c07b;
}

.console-output::-webkit-scrollbar {
  width: 8px;
}

.console-output::-webkit-scrollbar-track {
  background: #2e2e2e;
}

.console-output::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.console-output::-webkit-scrollbar-thumb:hover {
  background: #777;
}
</style>
