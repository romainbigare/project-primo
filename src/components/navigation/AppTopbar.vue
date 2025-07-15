<script setup>
import { useLayout } from "../../composables/useLayout";
import AppConfig from "./AppConfig.vue";
import Button from 'primevue/button'; // Make sure you import Button if it's a PrimeVue component

const { isDarkMode, toggleDarkMode } = useLayout();
</script>

<template>
    <div class="topbar">
        <div class="topbar-container">
            <div class="topbar-brand">
                <span class="topbar-brand-text">
                    <span class="topbar-title">PrimeVue Examples</span>
                    <span class="topbar-subtitle">Vite TypeScript</span>
                </span>
            </div>
            <div class="topbar-actions">
                <router-link to="/about" custom v-slot="{ navigate }">
                    <Button type="button" class="topbar-button p-button-text" @click="navigate" rounded>
                        About Us
                    </Button>
                </router-link>
                <Button type="button" class="topbar-theme-button" @click="toggleDarkMode" text rounded>
                    <i :class="['pi ', 'pi ', { 'pi-moon': isDarkMode, 'pi-sun': !isDarkMode }]" />
                </Button>
                <div class="relative">
                    <Button
                        v-styleclass="{
                            selector: '@next',
                            enterFromClass: 'hidden',
                            enterActiveClass: 'animate-scalein',
                            leaveToClass: 'hidden',
                            leaveActiveClass: 'animate-fadeout',
                            hideOnOutsideClick: true,
                        }"
                        icon="pi pi-cog"
                        text
                        rounded
                        aria-label="Settings"
                    />
                    <AppConfig />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Add any specific styling for your new button here if needed */
.topbar-button {
    margin-right: 10px; /* Add some spacing */
    /*/ small corner radius */
    border-radius: 8px; /* Adjust as needed */
}
</style>