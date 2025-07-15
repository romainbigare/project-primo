import { createRouter, createWebHistory } from 'vue-router';
import App from '../App.vue'; // Your main App component
import AboutPage from '../pages/about.vue';
import DashboardView from '../pages/dashboard.vue'; // Import your new DashboardView

const routes = [
    {
        path: '/',
        name: 'home',
        component: App, // Your main layout
        children: [
            {
                path: '', // Default child route for '/'
                name: 'dashboard',
                component: DashboardView // Render the DashboardView
            },
            {
                path: '/about',
                name: 'about',
                component: AboutPage
            }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;