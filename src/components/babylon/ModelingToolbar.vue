<template>
    <div class="babylon-toolbar vertical left-center modeling-toolbar">
        <div class="babylon-toolbar-tools">
            <!-- Selection Tool -->
            <div 
                class="babylon-tool-button" 
                :class="{ active: activeTool === 'selection' }"
                @click="selectTool('selection')"
                title="Selection Tool - Click: select face, Double-click: select face + edges, Triple-click: select all connected"
            >
                <i class="pi pi-chevron-up"></i>
                <span class="babylon-tool-label">Select</span>
            </div>

            <!-- Pencil/Draw Tool -->
            <div 
                class="babylon-tool-button" 
                :class="{ active: activeTool === 'pencil' }"
                @click="selectTool('pencil')"
                title="Pencil Tool - Draw new mesh edges with 3D snapping to points and faces"
            >
                <i class="pi pi-pencil"></i>
                <span class="babylon-tool-label">Draw</span>
            </div>

            <!-- Push/Pull Tool -->
            <div 
                class="babylon-tool-button" 
                :class="{ active: activeTool === 'pushpull' }"
                @click="selectTool('pushpull')"
                title="Push/Pull Tool - Extrude faces outward or create inward cuts"
            >
                <i class="pi pi-external-link"></i>
                <span class="babylon-tool-label">Push/Pull</span>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Props
const props = defineProps({
    scene: Object,
    toolsOrchestrator: Object
})

// Emits
const emit = defineEmits([])

// State
const activeTool = ref('')
const lastActiveTool = ref('selection') // Remember the last active tool

// Tool selection
function selectTool(tool) {
    if (activeTool.value === tool) return
    activeTool.value = tool
    lastActiveTool.value = tool // Remember this selection
    
    // Use toolsOrchestrator for mode changes
    if (props.toolsOrchestrator) {
        props.toolsOrchestrator.setMode(tool)
    }
}

// Method to handle mode changes from toolsOrchestrator
function onModeChanged(modeData) {
    // Update active tool based on mode change
    if (props.toolsOrchestrator && props.toolsOrchestrator.isModelingMode(modeData.newMode)) {
        activeTool.value = modeData.newMode
    } else {
        // If not a modeling mode, deactivate modeling tools
        activeTool.value = ''
    }
}

// Expose methods for parent component
defineExpose({
    onModeChanged
})

// Initialize with no tool selected by default
onMounted(() => {
    // Start with no modeling tool selected by default
    activeTool.value = ''
})
</script>

<style scoped>
/* Component-specific styles only */
/* The shared styles are imported from babylon-ui.css */
</style>
