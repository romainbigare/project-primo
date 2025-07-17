<template>
    <div class="babylon-toolbar vertical right-center scene-management-toolbar">
        <div class="babylon-toolbar-tools">
            <!-- Materials Panel Toggle -->
            <div 
                class="babylon-tool-button" 
                :class="{ active: showMaterialsPanel }"
                @click="toggleMaterialsPanel"
                title="Materials Panel - Apply materials to objects"
            >
                <i class="pi pi-palette"></i>
                <span class="babylon-tool-label">Materials</span>
            </div>

            <!-- Separator -->
            <div class="babylon-toolbar-separator vertical"></div>

            <!-- Scene Info Tool -->
            <div 
                class="babylon-tool-button"
                @click="showSceneInfo"
                title="Scene Information - View scene statistics"
            >
                <i class="pi pi-info-circle"></i>
                <span class="babylon-tool-label">Info</span>
            </div>

            <!-- Scene Reset Tool -->
            <div 
                class="babylon-tool-button"
                @click="resetScene"
                title="Reset Scene - Clear all objects and reset scene"
            >
                <i class="pi pi-trash"></i>
                <span class="babylon-tool-label">Clear</span>
            </div>

            <!-- Export Scene Tool -->
            <div 
                class="babylon-tool-button"
                @click="exportScene"
                title="Export Scene - Save scene as file"
            >
                <i class="pi pi-download"></i>
                <span class="babylon-tool-label">Export</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

// Props
const props = defineProps({
    scene: Object,
    meshes: Array,
    toolsOrchestrator: Object
})

// Emits
const emit = defineEmits(['toggle-materials-panel', 'scene-info', 'reset-scene', 'export-scene'])

// State
const showMaterialsPanel = ref(false)

// Materials panel toggle
function toggleMaterialsPanel() {
    showMaterialsPanel.value = !showMaterialsPanel.value
    emit('toggle-materials-panel', showMaterialsPanel.value)
}

// Scene utility functions
function showSceneInfo() {
    const meshCount = props.meshes?.length || 0
    const materialCount = props.scene?.materials?.length || 0
    const lightCount = props.scene?.lights?.length || 0
    
    const info = {
        meshes: meshCount,
        materials: materialCount,
        lights: lightCount
    }
    
    emit('scene-info', info)
    
    // You can also show a simple alert for now
    alert(`Scene Info:\nMeshes: ${meshCount}\nMaterials: ${materialCount}\nLights: ${lightCount}`)
}

function resetScene() {
    if (confirm('Are you sure you want to clear the scene? This action cannot be undone.')) {
        emit('reset-scene')
    }
}

function exportScene() {
    emit('export-scene')
}

// Method to update materials panel state (called from parent)
function setMaterialsPanelState(isVisible) {
    showMaterialsPanel.value = isVisible
}

// Method to handle mode changes from toolsOrchestrator
function onModeChanged(modeData) {
    // Update the materials panel button state based on material editing mode
    if (modeData.newMode === 'material-editing') {
        showMaterialsPanel.value = true
    } else if (modeData.previousMode === 'material-editing') {
        showMaterialsPanel.value = false
    }
}

// Expose methods for parent component
defineExpose({
    setMaterialsPanelState,
    onModeChanged
})
</script>

<style scoped>
/* Component-specific styles only */
/* The shared styles are imported from babylon-ui.css */
</style>
