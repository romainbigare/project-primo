<template>
    <div class="view-toolbar">
        <div class="toolbar-tools">
            <!-- Orbit Tool -->
            <div 
                class="tool-button" 
                :class="{ active: activeTool === 'orbit' }"
                @click="selectTool('orbit')"
                title="Orbit Tool - Rotate around the scene"
            >
                <i class="pi pi-refresh"></i>
                <span class="tool-label">Orbit</span>
            </div>

            <!-- Pan Tool -->
            <div 
                class="tool-button" 
                :class="{ active: activeTool === 'pan' }"
                @click="selectTool('pan')"
                title="Pan Tool - Move the view horizontally and vertically"
            >
                <i class="pi pi-arrows-alt"></i>
                <span class="tool-label">Pan</span>
            </div>

            <!-- Zoom Tool -->
            <div 
                class="tool-button" 
                :class="{ active: activeTool === 'zoom' }"
                @click="selectTool('zoom')"
                title="Zoom Tool - Zoom in and out of the scene"
            >
                <i class="pi pi-search-plus"></i>
                <span class="tool-label">Zoom</span>
            </div>

            <!-- Reset View Tool -->
            <div 
                class="tool-button" 
                @click="resetView"
                title="Reset View - Return to default camera position"
            >
                <i class="pi pi-home"></i>
                <span class="tool-label">Reset</span>
            </div>

            <!-- Fit to Scene Tool -->
            <div 
                class="tool-button" 
                @click="fitToScene"
                title="Fit to Scene - Fit all objects in view"
            >
                <i class="pi pi-expand"></i>
                <span class="tool-label">Fit All</span>
            </div>

            <!-- Separator -->
            <div class="toolbar-separator"></div>

            <!-- Graphics Settings Button -->
            <div 
                class="tool-button settings-tool"
                @click="toggleSettings"
                title="Graphics Settings - Adjust lighting, materials, and rendering options"
            >
                <i class="pi pi-cog"></i>
                <span class="tool-label">Settings</span>
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
    lights: Object,
    ground: Object,
    shadowGenerator: Object,
    meshes: Array,
    pipeline: Object
})

// Emits
const emit = defineEmits(['tool-changed'])

// State
const activeTool = ref('orbit')
const showSettings = ref(false)

// Tool selection
function selectTool(tool) {
    if (activeTool.value === tool) return
    activeTool.value = tool
    
    // Setup tool-specific behavior through ViewManager
    if (props.viewManager) {
        switch (tool) {
            case 'orbit':
                props.viewManager.enableOrbitMode()
                break
            case 'pan':
                props.viewManager.enablePanMode()
                break
            case 'zoom':
                props.viewManager.enableZoomMode()
                break
        }
    }

    emit('tool-changed', { tool, activeTool: activeTool.value, isActiveViewTool: tool !== 'orbit' })
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

// Method to deactivate view tools (called from parent when modeling tools are activated)
function deactivateViewTools() {
// Reset to orbit mode (default) when deactivating
    activeTool.value = ''
    if (props.viewManager) {
        props.viewManager.enableOrbitMode()
    }
    console.log('View tools deactivated, returned to orbit mode')
}

// Expose methods for parent component
defineExpose({
    deactivateViewTools
})

// Initialize with orbit tool
onMounted(() => {
    selectTool('')
})
</script>

<style scoped>
.view-toolbar {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    height: 60px;
    background: rgba(255, 255, 255, 0.90);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    z-index: 1000;
    padding: 8px;
}

.toolbar-tools {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 100%;
}

.tool-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 44px;
    padding: 4px;
    border-radius: 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
}

.tool-button:hover {
    background: rgba(0, 0, 0, 0.05);
    transform: translateY(-1px);
}

.tool-button.active {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
}

.tool-button i {
    font-size: 16px;
    color: #666;
    margin-bottom: 2px;
    transition: color 0.2s ease;
}

.tool-button:hover i {
    color: black;
}

.tool-button.active i {
    color: #3b82f6;
}

.tool-label {
    font-size: 9px;
    font-weight: 500;
    color: #888;
    text-align: center;
    line-height: 1;
    transition: color 0.2s ease;
}

.tool-button:hover .tool-label {
    color: #000000;
}

.tool-button.active .tool-label {
    color: #3b82f6;
}

.toolbar-separator {
    width: 1px;
    height: 30px;
    background: rgba(0, 0, 0, 0.1);
    margin: 0 8px;
}

.settings-tool {
    width: 50px;
    padding: 4px;
}

.settings-tool i {
    font-size: 16px;
    color: #666;
    margin-bottom: 2px;
    transition: all 0.3s ease;
}

.settings-tool:hover i {
    color: black;
    transform: rotate(45deg);
}

.settings-tool .tool-label {
    font-size: 9px;
    font-weight: 500;
    color: #888;
    text-align: center;
    line-height: 1;
    transition: color 0.2s ease;
}

.settings-tool:hover .tool-label {
    color: #000000;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .view-toolbar {
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        height: 50px;
        padding: 6px;
    }
    
    .tool-button {
        width: 40px;
        height: 38px;
        padding: 2px;
    }
    
    .tool-button i {
        font-size: 14px;
    }
    
    .tool-label {
        font-size: 8px;
    }
    
    .settings-tool {
        width: 40px;
        height: 38px;
    }
    
    .settings-tool i {
        font-size: 14px;
    }
}
</style>
