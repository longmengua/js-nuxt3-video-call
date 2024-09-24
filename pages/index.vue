<script lang="ts" setup>
import JoinRoomOverSocket from '@/components/view/JoinRoomOverSocket.vue'

definePageMeta({
  ssr: false
});
</script>
<template>
    <JoinRoomOverSocket>Join Room over websocket</JoinRoomOverSocket>
</template>