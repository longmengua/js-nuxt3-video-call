<template>
    <div class="layout">
      <Modal v-if="showModal">
        <div class="modal-content">
          <p class="modal-text">{{ errorRef }}</p>
          <div class="modal-button" @click="() => toggler()">重新連線</div>
        </div>
      </Modal>
      <NuxtPage />
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import Modal from '~/components/modal/Modal.vue';
import { useWebSocket } from '~/composables/useWebsocket';

const { socketRef, errorRef, connect } = useWebSocket();
const showModal = ref(false);

const toggler = () => {
  showModal.value = !showModal.value;
  connect();
};

computed(() => {
    if (!errorRef.value) {
        return;
    }
    toggler();
})
</script>

<style scoped>
.modal-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.modal-text {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.modal-button {
  border-radius: 4px;
  background-color: aliceblue;
  font-weight: 600;
  padding: 8px 12px;
  text-align: center;
  cursor: pointer;
  width: 100%;
}
</style>
