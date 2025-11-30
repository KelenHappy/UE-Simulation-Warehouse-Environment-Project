<template>
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <HeaderTitle />
    <HeaderActions @open-guide="$emit('open-guide')" @go-home="$emit('go-home')" />
  </div>
</template>

<script setup>
import HeaderTitle from './HeaderTitle.vue'
import HeaderActions from './HeaderActions.vue'

defineEmits(['open-guide', 'go-home'])
</script>
