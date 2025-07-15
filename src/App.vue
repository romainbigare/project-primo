<script setup>
</script>

<template>
    <div class="layout-content"> 
        <router-view /> 
    </div>
</template>

<style scoped>
.layout-content {
    flex-grow: 1; /* Allow content to take available space if using flexbox for layout-container */
    padding: 20px; /* Add some padding around the main content */
    /* Add any other styling for your main content area */
}

/* You might need to adjust your layout-container styles to accommodate the router-view properly */
.layout-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh; /* Ensure the container takes full viewport height */
}
</style>