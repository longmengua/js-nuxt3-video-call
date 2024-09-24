<script lang="ts" setup>
</script>
<template>
    <div class="modal">
        <div class="container">
            <slot></slot>
        </div>
    </div>
</template>
<style lang="css" scoped>
.container {
    width: 300px;
    height: 350px;
    border-radius: 8px;
    background-color: white;
    padding: 12px;
    display: flex;
    flex-direction: column;
}
.modal {
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.2);
}
</style>