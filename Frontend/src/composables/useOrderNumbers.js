import { ref, computed, watch } from 'vue'

export function useOrderNumbers(initialNumbers = [10, 20, 30]) {
  const numbers = ref([...initialNumbers])

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
    if (!numbers.value.includes(0)) {
      numbers.value.push(0)
    }
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
    for (let i = 0; i < count; i++) {
      if (!numbers.value.includes(0)) {
        numbers.value.push(0)
      }
    }
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
    const count = Math.floor(Math.random() * 5) + 3
    const usedNumbers = new Set()

    while (usedNumbers.size < count) {
      const randomNum = Math.floor(Math.random() * 100) + 1
      usedNumbers.add(randomNum)
    }

    numbers.value = Array.from(usedNumbers)
  }

  const setNumbers = (newNumbers) => {
    numbers.value = [...newNumbers]
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
    setNumbers
  }
}
