import { ref } from 'vue'

export function useWebSocket() {
  const isConnected = ref(false)
  const errorMessage = ref('')
  const orders = ref([])
  const orderCounter = ref(1)
  const isClearing = ref(false)

  let websocket = null

  const sendMessage = (message) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify(message))
    }
  }

  const requestOrders = () => {
    sendMessage({
      type: 'get_orders',
      timestamp: new Date().toISOString()
    })
  }

  const handleMessage = (message) => {
    switch (message.type) {
      case 'order_confirmation':
        break
      case 'new_order':
        orders.value.unshift({
          id: message.order.id,
          content: message.order.content,
          time: new Date(message.order.timestamp).toLocaleTimeString()
        })
        break
      case 'orders_list':
        orders.value = message.orders.map(order => ({
          id: order.id,
          content: order.content,
          time: new Date(order.timestamp).toLocaleTimeString()
        }))
        orderCounter.value = message.orders.length > 0
          ? Math.max(...message.orders.map(o => o.id)) + 1
          : 1
        isClearing.value = false
        break
      case 'status_update':
        break
      case 'order_deleted':
        orders.value = orders.value.filter(order => order.id !== message.order_id)
        break
      case 'error':
        errorMessage.value = message.message
        setTimeout(() => {
          errorMessage.value = ''
        }, 3000)
        break
      default:
        break
    }
  }

  const connectWebSocket = () => {
    try {
      const proto = (typeof window !== 'undefined' && window.location?.protocol === 'https:') ? 'wss' : 'ws'
      const host = (typeof window !== 'undefined' && window.location?.hostname) ? window.location.hostname : 'localhost'
      const fallback = `${proto}://${host}:8000/ws`
      const wsUrl = import.meta?.env?.VITE_WS_URL || fallback
      websocket = new WebSocket(wsUrl)

      websocket.onopen = () => {
        isConnected.value = true
        errorMessage.value = ''

        if (!isClearing.value) {
          requestOrders()
        } else {
          requestOrders()
        }
      }

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      websocket.onclose = () => {
        isConnected.value = false
        errorMessage.value = '連線已斷開'
        isClearing.value = false
      }

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
        errorMessage.value = `連線錯誤：${error?.message || '未知錯誤'}`
        isConnected.value = false
      }

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      errorMessage.value = '無法連接到伺服器'
    }
  }

  const disconnectWebSocket = () => {
    if (websocket) {
      websocket.close()
      websocket = null
      isConnected.value = false
    }
  }

  const toggleConnection = () => {
    if (isConnected.value) {
      disconnectWebSocket()
    } else {
      connectWebSocket()
    }
  }

  const sendOrder = (content) => {
    sendMessage({
      type: 'custom_message',
      content,
      timestamp: new Date().toISOString()
    })
  }

  const requestClearOrders = () => {
    isClearing.value = true
    orders.value = []
    orderCounter.value = 1
    sendMessage({
      type: 'clear_orders',
      timestamp: new Date().toISOString()
    })
  }

  const requestDeleteOrder = (orderId) => {
    sendMessage({
      type: 'delete_order',
      order_id: orderId,
      timestamp: new Date().toISOString()
    })
  }

  const addLocalOrder = (content) => {
    const newOrder = {
      id: orderCounter.value++,
      content,
      time: new Date().toLocaleTimeString()
    }

    orders.value.unshift(newOrder)

    if (orders.value.length > 50) {
      orders.value = orders.value.slice(0, 50)
    }
  }

  const clearLocalOrders = () => {
    orders.value = []
    orderCounter.value = 1
  }

  const removeLocalOrder = (orderId) => {
    orders.value = orders.value.filter(order => order.id !== orderId)
  }

  return {
    isConnected,
    errorMessage,
    orders,
    orderCounter,
    isClearing,
    connectWebSocket,
    disconnectWebSocket,
    toggleConnection,
    sendOrder,
    requestOrders,
    requestClearOrders,
    requestDeleteOrder,
    addLocalOrder,
    clearLocalOrders,
    removeLocalOrder
  }
}
