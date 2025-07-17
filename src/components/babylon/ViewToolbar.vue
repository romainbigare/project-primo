<template>
    <div class="babylon-toolbar horizontal top-center view-toolbar">
        <div class="babylon-toolbar-tools">
            <!-- Orbit Tool -->
            <div 
                class="babylon-tool-button" 
                :class="{ active: activeTool === 'orbit' }"
                @click="selectTool('orbit')"
                title="Orbit Tool - Rotate around the scene"
            >
                <i class="pi pi-refresh"></i>
                <span class="babylon-tool-label">Orbit</span>
            </div>

            <!-- Pan Tool -->
            <div 
                class="babylon-tool-button" 
                :class="{ active: activeTool === 'pan' }"
                @click="selectTool('pan')"
                title="Pan Tool - Move the view horizontally and vertically"
            >
                <i class="pi pi-arrows-alt"></i>
                <span class="babylon-tool-label">Pan</span>
            </div>

            <!-- Zoom Tool -->
            <div 
                class="babylon-tool-button" 
                :class="{ active: activeTool === 'zoom' }"
                @click="selectTool('zoom')"
                title="Zoom Tool - Zoom in and out of the scene"
            >
                <i class="pi pi-search-plus"></i>
                <span class="babylon-tool-label">Zoom</span>
            </div>

            <!-- Reset View Tool -->
            <div 
                class="babylon-tool-button" 
                @click="resetView"
                title="Reset View - Return to default camera position"
            >
                <i class="pi pi-home"></i>
                <span class="babylon-tool-label">Reset</span>
            </div>

            <!-- Fit to Scene Tool -->
            <div 
                class="babylon-tool-button" 
                @click="fitToScene"
                title="Fit to Scene - Fit all objects in view"
            >
                <i class="pi pi-expand"></i>
                <span class="babylon-tool-label">Fit All</span>
            </div>

            <!-- Separator -->
            <div class="babylon-toolbar-separator horizontal"></div>

            <!-- Graphics Settings Button -->
            <div 
                class="babylon-tool-button settings-tool"
                @click="toggleSettings"
                title="Graphics Settings - Adjust lighting, materials, and rendering options"
            >
                <i class="pi pi-cog"></i>
                <span class="babylon-tool-label">Settings</span>
            </div>
        </div>

        <!-- Graphics Settings Dialog -->
        <GraphicsSettings 
            v-model:visible="showSettings"
            :scene="scene"
            :lights="lights"
            :ground="ground"
            :shadowGenerator="shadowGenerator"
            :meshes="meshes"
            :pipeline="pipeline"
        />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import GraphicsSettings from './GraphicsSettings.vue'

// Props
const props = defineProps({
    scene: Object,
    camera: Object,
    viewManager: Object,
    toolsOrchestrator: Object,
    lights: Object,
    ground: Object,
    shadowGenerator: Object,
    meshes: Array,
    pipeline: Object
})

// Emits
const emit = defineEmits([])

// State
const activeTool = ref('orbit')
const showSettings = ref(false)

// Tool selection
function selectTool(tool) {
    if (activeTool.value === tool) return
    activeTool.value = tool
    
    // Use toolsOrchestrator for mode changes
    if (props.toolsOrchestrator) {
        props.toolsOrchestrator.setMode(tool)
    }
}

// View utility functions
function resetView() {
    if (props.viewManager) {
        props.viewManager.resetView()
    }
}

function fitToScene() {
    if (props.viewManager) {
        props.viewManager.fitToScene()
    }
}

// Settings dialog toggle
function toggleSettings() {
    showSettings.value = !showSettings.value
}

// Method to handle mode changes from toolsOrchestrator
function onModeChanged(modeData) {
    // Update active tool based on mode change
    if (props.toolsOrchestrator && props.toolsOrchestrator.isViewMode(modeData.newMode)) {
        activeTool.value = modeData.newMode
    } else {
        // If not a view mode, deactivate view tools
        activeTool.value = ''
    }
}

// Expose methods for parent component
defineExpose({
    onModeChanged
})

// Initialize with orbit tool
onMounted(() => {
    // Start with orbit mode selected by default
    activeTool.value = 'orbit'
})
</script>

<style scoped>
/* Component-specific styles only */
/* The shared styles are imported from babylon-ui.css */

.settings-tool i {
    transition: all 0.3s ease;
}

.settings-tool:hover i {
    transform: rotate(45deg);
}
</style>
