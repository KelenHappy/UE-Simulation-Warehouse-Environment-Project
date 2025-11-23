import { ref, onMounted, onUnmounted } from "vue";

/**
 * Cargo 數據管理 Composable
 * 用於從後端獲取和管理貨物位置數據
 */
export function useCargoData(options = {}) {
  const {
    apiBaseUrl = "http://localhost:8000",
    pollInterval = 2500, // 默認每2.5秒輪詢一次
    autoStart = true,
  } = options;

  // 狀態
  const cargoData = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const lastUpdate = ref(null);

  let pollTimer = null;

  /**
   * 從後端獲取所有貨物數據
   */
  const fetchCargoData = async (limit = 250) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await fetch(`${apiBaseUrl}/vue/cargo?limit=${limit}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      cargoData.value = data.cargo || [];
      lastUpdate.value = new Date().toISOString();

      return data;
    } catch (err) {
      error.value = err.message;
      console.error("獲取貨物數據失敗:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 獲取最新的單個貨物數據
   */
  const fetchLatestCargo = async () => {
    try {
      loading.value = true;
      error.value = null;

      const response = await fetch(`${apiBaseUrl}/vue/cargo/latest`);

      if (!response.ok) {
        if (response.status === 404) {
          return null; // 沒有數據
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      lastUpdate.value = new Date().toISOString();

      return data;
    } catch (err) {
      error.value = err.message;
      console.error("獲取最新貨物數據失敗:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 清空後端的貨物數據
   */
  const clearCargoData = async () => {
    try {
      loading.value = true;
      error.value = null;

      const response = await fetch(`${apiBaseUrl}/vue/cargo`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      cargoData.value = [];
      lastUpdate.value = new Date().toISOString();

      return data;
    } catch (err) {
      error.value = err.message;
      console.error("清空貨物數據失敗:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 開始輪詢貨物數據
   */
  const startPolling = () => {
    if (pollTimer) {
      return; // 已經在輪詢中
    }

    // 立即獲取一次
    fetchCargoData();

    // 設置定時器
    pollTimer = setInterval(() => {
      fetchCargoData();
    }, pollInterval);

    console.log(`開始輪詢貨物數據，間隔: ${pollInterval}ms`);
  };

  /**
   * 停止輪詢
   */
  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
      console.log("停止輪詢貨物數據");
    }
  };

  /**
   * 根據 ID 查找貨物
   */
  const findCargoById = (id) => {
    return cargoData.value.find((cargo) => cargo.id === id);
  };

  /**
   * 將貨物數據轉換為 Three.js 可用的格式
   */
  const formatCargoForThreeJS = (cargo) => {
    if (!cargo) return null;

    return {
      id: cargo.id,
      position: {
        x: cargo.position?.x || 0,
        y: cargo.position?.y || 0,
        z: cargo.position?.z || 0,
      },
      size: {
        x: cargo.size?.x || 1,
        y: cargo.size?.y || 1,
        z: cargo.size?.z || 1,
      },
      timestamp: cargo.timestamp,
    };
  };

  /**
   * 獲取所有貨物的 Three.js 格式數據
   */
  const getFormattedCargoData = () => {
    return cargoData.value.map(formatCargoForThreeJS).filter(Boolean);
  };

  // 生命週期
  onMounted(() => {
    if (autoStart) {
      startPolling();
    }
  });

  onUnmounted(() => {
    stopPolling();
  });

  // 返回公開的 API
  return {
    // 狀態
    cargoData,
    loading,
    error,
    lastUpdate,

    // 方法
    fetchCargoData,
    fetchLatestCargo,
    clearCargoData,
    startPolling,
    stopPolling,
    findCargoById,
    formatCargoForThreeJS,
    getFormattedCargoData,
  };
}
