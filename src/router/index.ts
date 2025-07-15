import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import App from '../App.vue'; // Your main App component
import AboutPage from '../pages/about.vue';
import DashboardView from '../pages/dashboard.vue'; // Import your new DashboardView
import Viewer from '../pages/viewer.vue'; // Import your Viewer component

const routes: RouteRecordRaw[] = [
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
            },
            {
                path: '/viewer',
                name: 'viewer',
                component: Viewer // Render the Viewer component
            }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
