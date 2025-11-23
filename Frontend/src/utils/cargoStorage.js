/**
 * Cargo Storage Utility
 * 用於處理貨物數據的儲存和發送到後端
 */

const API_BASE_URL = 'http://localhost:8000';

/**
 * 將 Three.js 場景中的方塊轉換為貨物數據格式
 * @param {Array} boxes - Three.js 方塊陣列
 * @param {Object} modelSize - 模型尺寸 {x, y, z}
 * @returns {Array} 貨物數據陣列
 */
export function convertBoxesToCargoData(boxes, modelSize) {
  const timestamp = new Date().toISOString();

  return boxes.map((box, index) => {
    return {
      id: `case ${index + 1}`,
      position: {
        x: parseFloat(box.position.x.toFixed(4)),
        y: parseFloat(box.position.y.toFixed(4)),
        z: parseFloat(box.position.z.toFixed(4))
      },
      size: {
        x: parseFloat(modelSize.x.toFixed(4)),
        y: parseFloat(modelSize.y.toFixed(4)),
        z: parseFloat(modelSize.z.toFixed(4))
      },
      timestamp: timestamp
    };
  });
}

/**
 * 批量發送貨物數據到後端
 * @param {Array} cargoData - 貨物數據陣列
 * @param {Object} options - 選項配置
 * @returns {Promise} API 請求的 Promise
 */
export async function saveCargoDataToBackend(cargoData, options = {}) {
  const {
    apiBaseUrl = API_BASE_URL,
    onSuccess = null,
    onError = null,
    chunkSize = 250 // 每次發送的數據量
  } = options;

  try {
    // 如果數據量大，分批發送
    if (cargoData.length > chunkSize) {
      console.log(`貨物數據量較大 (${cargoData.length})，將分批發送...`);

      const chunks = [];
      for (let i = 0; i < cargoData.length; i += chunkSize) {
        chunks.push(cargoData.slice(i, i + chunkSize));
      }

      const results = [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(`發送第 ${i + 1}/${chunks.length} 批數據...`);
        const result = await sendCargoChunk(chunks[i], apiBaseUrl);
        results.push(result);
      }

      const totalSaved = results.reduce((sum, result) => sum + (result.saved_count || 0), 0);

      console.log(`✓ 所有貨物數據已成功儲存！總計: ${totalSaved} 個`);

      if (onSuccess) {
        onSuccess({ total_cargo: totalSaved, chunks: results });
      }

      return { success: true, total_cargo: totalSaved, chunks: results };
    } else {
      // 一次性發送
      const result = await sendCargoChunk(cargoData, apiBaseUrl);

      console.log(`✓ 貨物數據已成功儲存！總計: ${result.saved_count} 個`);

      if (onSuccess) {
        onSuccess(result);
      }

      return { success: true, ...result };
    }
  } catch (error) {
    console.error('✗ 儲存貨物數據時出錯:', error);

    if (onError) {
      onError(error);
    }

    return { success: false, error: error.message };
  }
}

/**
 * 發送單批貨物數據
 * @private
 */
async function sendCargoChunk(cargoChunk, apiBaseUrl) {
  const response = await fetch(`${apiBaseUrl}/vue/cargo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cargoChunk),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * 清空後端的貨物數據
 * @param {Object} options - 選項配置
 * @returns {Promise} API 請求的 Promise
 */
export async function clearCargoDataFromBackend(options = {}) {
  const {
    apiBaseUrl = API_BASE_URL,
    onSuccess = null,
    onError = null
  } = options;

  try {
    const response = await fetch(`${apiBaseUrl}/vue/cargo`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✓ 貨物數據已清空');

    if (onSuccess) {
      onSuccess(result);
    }

    return { success: true, ...result };
  } catch (error) {
    console.error('✗ 清空貨物數據時出錯:', error);

    if (onError) {
      onError(error);
    }

    return { success: false, error: error.message };
  }
}

/**
 * 延遲儲存貨物數據（防抖）
 * 用於避免頻繁的 API 請求
 */
let saveTimeout = null;

export function debouncedSaveCargoData(cargoData, delay = 1000, options = {}) {
  return new Promise((resolve, reject) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(async () => {
      try {
        const result = await saveCargoDataToBackend(cargoData, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
}

/**
 * 取消延遲的儲存操作
 */
export function cancelDebouncedSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
    console.log('已取消延遲的儲存操作');
  }
}

/**
 * 驗證貨物數據格式
 * @param {Array} cargoData - 貨物數據陣列
 * @returns {Boolean} 是否有效
 */
export function validateCargoData(cargoData) {
  if (!Array.isArray(cargoData)) {
    console.error('貨物數據必須是陣列');
    return false;
  }

  for (let i = 0; i < cargoData.length; i++) {
    const cargo = cargoData[i];

    if (!cargo.id) {
      console.error(`貨物 [${i}] 缺少 id`);
      return false;
    }

    if (!cargo.position || typeof cargo.position.x !== 'number' ||
        typeof cargo.position.y !== 'number' || typeof cargo.position.z !== 'number') {
      console.error(`貨物 [${i}] 的 position 格式不正確`);
      return false;
    }

    if (!cargo.size || typeof cargo.size.x !== 'number' ||
        typeof cargo.size.y !== 'number' || typeof cargo.size.z !== 'number') {
      console.error(`貨物 [${i}] 的 size 格式不正確`);
      return false;
    }

    if (!cargo.timestamp) {
      console.error(`貨物 [${i}] 缺少 timestamp`);
      return false;
    }
  }

  return true;
}

/**
 * 導出所有工具函數
 */
export default {
  convertBoxesToCargoData,
  saveCargoDataToBackend,
  clearCargoDataFromBackend,
  debouncedSaveCargoData,
  cancelDebouncedSave,
  validateCargoData
};
