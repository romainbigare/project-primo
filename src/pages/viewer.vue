<template>
    <div class="viewer-page">
        <Babylon />
    </div>
</template>

<script setup>
import Babylon from '../components/babylon/babylon.vue';
</script>

<style scoped>
.viewer-page {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    /* Ensure the viewer takes full viewport height and width, and disable scrolling */
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--surface-card); /* Example PrimeVue variable */
    /* You can adjust the background color or other styles as needed */
    /* Add any additional styling for the viewer page */
    /* This ensures the Babylon viewer is centered and fills the viewport */
    position: relative;
    margin: 0;
    padding: 0;
}
</style>