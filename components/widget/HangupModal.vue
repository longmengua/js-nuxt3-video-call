<script setup lang="ts">
import { ref } from 'vue';

const isOpen = ref(false);

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

function handleConfirm() {
  emit('confirm');
  isOpen.value = false;
}

function handleCancel() {
  emit('cancel');
  isOpen.value = false;
}
</script>

<template>
  <button
    class="p-3 lg:p-4 text-white rounded-full transition bg-red-400 hover:bg-red-500"
    @click="isOpen = true"
  >
    <div class="i-tabler-phone-off w-6 h-6 lg:w-8 lg:h-8" />
  </button>

  <div v-if="isOpen" class="fixed inset-0 bg-black/25 z-1 transition-opacity duration-300 ease-out" @click.self="handleCancel"></div>
  
  <div v-if="isOpen" class="fixed inset-0 flex items-center justify-center p-4 z-1 transition-all duration-300 ease-out">
    <div class="relative flex flex-col gap-4 bg-white p-4 rounded-lg w-80 transition-transform transform scale-100">
      <h2 class="font-bold text-2xl">結束通話</h2>
      <p class="mb-4">即將結束通話，確定嗎？</p>
      <div class="flex">
        <button class="bg-gray-200 px-4 py-2 rounded-lg ml-auto transition hover:bg-gray-300" @click="handleCancel">
          繼續通話
        </button>
        <button class="bg-red-400 px-4 py-2 rounded-lg ml-2 transition hover:bg-red-500 text-white" @click="handleConfirm">
          結束通話
        </button>
      </div>
    </div>
  </div>
</template>
