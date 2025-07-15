<script setup lang="js">
import StatsWidget from "./../components/dashboard/StatsWidget.vue";
import SalesTrendWidget from "./../components/dashboard/SalesTrendWidget.vue";
import RecentActivityWidget from "./../components/dashboard/RecentActivityWidget.vue";
import ProductOverviewWidget from "./../components/dashboard/ProductOverviewWidget.vue";
import AppTopbar from "./../components/navigation/AppTopbar.vue";
import AppFooter from "./../components/navigation/AppFooter.vue";
</script>

<template>
    <div class="layout-container">
    <AppTopbar />
    <div class="layout-grid">
        <StatsWidget />
        <div class="layout-grid-row">
            <SalesTrendWidget />
            <RecentActivityWidget />
        </div>
        <ProductOverviewWidget />
    </div>
    <AppFooter />
    </div>
</template>