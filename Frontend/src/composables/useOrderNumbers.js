import { ref, computed, watch } from 'vue'

export function useOrderNumbers(initialNumbers = [10, 20, 30]) {
  const numbers = ref([...initialNumbers])
  const randomPool = ref([...initialNumbers])

  watch(numbers, (newNumbers) => {
    const uniqueNumbers = [...new Set(newNumbers)]
    if (uniqueNumbers.length !== newNumbers.length) {
      numbers.value = uniqueNumbers
    }
  }, { deep: true })

  const orderPreview = computed(() => {
    if (numbers.value.length === 0) return '(空訂單)'
    return numbers.value.join('-')
  })

  const addNumber = () => {
    const lastNumber = numbers.value[numbers.value.length - 1]
    const nextNumber = lastNumber ? Math.min(lastNumber + 1, 999) : 1
    numbers.value.push(nextNumber)
  }

  const updateNumber = (index, value) => {
    numbers.value[index] = value
  }

  const removeNumber = (index) => {
    numbers.value.splice(index, 1)
  }

  const clearNumbers = () => {
    numbers.value = []
  }

  const addMultipleNumbers = (count) => {
    const existing = new Set(numbers.value)
    const addedNumbers = []
    let attempts = 0

    while (addedNumbers.length < count && attempts < 2000) {
      const randomNum = Math.floor(Math.random() * 999) + 1
      if (!existing.has(randomNum)) {
        existing.add(randomNum)
        addedNumbers.push(randomNum)
      }
      attempts += 1
    }

    numbers.value.push(...addedNumbers)
  }

  const validateNumber = (index) => {
    const num = numbers.value[index]
    if (num < 1) {
      numbers.value[index] = 1
    } else if (num > 999) {
      numbers.value[index] = 999
    }
  }

  const generateRandom = () => {
    const pool = randomPool.value.length > 0 ? randomPool.value : numbers.value
    if (pool.length === 0) {
      numbers.value = []
      return
    }

    const maxCount = Math.min(pool.length, 7)
    const minCount = Math.min(3, maxCount)
    const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    numbers.value = shuffled.slice(0, count)
  }

  const applyCodeInput = (codeInput) => {
    const parts = codeInput
      .split(/[\s,\-]+/)
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= 999)

    if (parts.length === 0) {
      return
    }

    const uniqueNumbers = [...new Set(parts)]
    numbers.value = uniqueNumbers
    randomPool.value = uniqueNumbers
  }

  const setNumbers = (newNumbers) => {
    numbers.value = [...newNumbers]
    randomPool.value = [...newNumbers]
  }

  return {
    numbers,
    orderPreview,
    addNumber,
    updateNumber,
    removeNumber,
    clearNumbers,
    addMultipleNumbers,
    validateNumber,
    generateRandom,
    setNumbers,
    applyCodeInput
  }
}
