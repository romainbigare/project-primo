<template>
    <div class="modeling-toolbar">
        <div class="toolbar-tools">
            <!-- Selection Tool -->
            <div 
                class="tool-button" 
                :class="{ active: activeTool === 'selection' }"
                @click="selectTool('selection')"
                title="Selection Tool - Click: select face, Double-click: select face + edges, Triple-click: select all connected"
            >
                <i class="pi pi-chevron-up"></i>
                <span class="tool-label">Select</span>
            </div>

            <!-- Pencil/Draw Tool -->
            <div 
                class="tool-button" 
                :class="{ active: activeTool === 'pencil' }"
                @click="selectTool('pencil')"
                title="Pencil Tool - Draw new mesh edges with 3D snapping to points and faces"
            >
                <i class="pi pi-pencil"></i>
                <span class="tool-label">Draw</span>
            </div>

            <!-- Push/Pull Tool -->
            <div 
                class="tool-button" 
                :class="{ active: activeTool === 'pushpull' }"
                @click="selectTool('pushpull')"
                title="Push/Pull Tool - Extrude faces outward or create inward cuts"
            >
                <i class="pi pi-external-link"></i>
                <span class="tool-label">Push/Pull</span>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Props
const props = defineProps({
    scene: Object,
    canvas: Object,
    selectionManager: Object
})

// Emits
const emit = defineEmits(['tool-changed', 'selection-changed'])

// State
const activeTool = ref('')

// Tool selection
function selectTool(tool) {
    if (activeTool.value === tool) return
    activeTool.value = tool
    
    // Setup tool-specific behavior
    switch (tool) {
        case 'selection':
            setupSelectionTool()
            break
        case 'pencil':
            setupPencilTool()
            break
        case 'pushpull':
            setupPushPullTool()
            break
    }

    emit('tool-changed', { tool, activeTool: activeTool.value })
}

// Selection Tool Implementation
function setupSelectionTool() {
    if (props.scene && props.canvas) {
        // Remove existing click listeners
        removeAllListeners()
        props.canvas.addEventListener('click', handleSelectionClick, true) // true = capture phase
    }
}

function setupPencilTool() {
    if (props.scene && props.canvas) {
        removeAllListeners()

        //props.canvas.addEventListener('mousedown', handlePencilMouseDown, true)
        //props.canvas.addEventListener('mousemove', handlePencilMouseMove, true)
        //props.canvas.addEventListener('mouseup', handlePencilMouseUp, true)
    }
}

// Push/Pull Tool Implementation
function setupPushPullTool() {
    if (props.scene && props.canvas) {
        removeAllListeners()
        
        //props.canvas.addEventListener('mousedown', handlePushPullMouseDown, true)
        //props.canvas.addEventListener('mousemove', handlePushPullMouseMove, true)
        //props.canvas.addEventListener('mouseup', handlePushPullMouseUp, true)
    }
}

function removeAllListeners() {
    if (props.canvas) {
        // Remove all event listeners with both capture and bubble phases
        const events = ['click', 'mousedown', 'mousemove', 'mouseup']
        const handlers = [
            handleSelectionClick,
            //handlePencilMouseDown, handlePencilMouseMove, handlePencilMouseUp,
            //handlePushPullMouseDown, handlePushPullMouseMove, handlePushPullMouseUp
        ]
        
        events.forEach(event => {
            handlers.forEach(handler => {
                props.canvas.removeEventListener(event, handler, true) // capture
                props.canvas.removeEventListener(event, handler, false) // bubble
            })
        })
    }
}

const handleSelectionClick = (event) => {
    if (!props.selectionManager) return
    
    // Use SelectionManager's built-in selection handling
    props.selectionManager.handleSelectionClick(event, props.canvas)
}

// Initialize with selection tool
onMounted(() => {
    selectTool('selection')
})
</script>

<style scoped>
.modeling-toolbar {
    position: fixed;
    top: 20px;
    left: 20px;
    width: 50px;
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    z-index: 1000;
    user-select: none;
}

.toolbar-header {
    padding: 12px 8px 8px 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.toolbar-title {
    font-size: 10px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
    display: block;
}

.toolbar-tools {
    padding: 8px 4px;
}

.tool-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 4px;
    margin: 4px 0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid transparent;
}

.tool-button:hover {
}

.tool-button.active {
}

.tool-button i {
    font-size: 20px;
    color: #666;
    margin-bottom: 4px;
    transition: color 0.2s ease;
}

.tool-button:hover i{
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

.tool-button:hover .tool-label{
    color: #000000;
}
.tool-button.active .tool-label {
    color: #3b82f6;
}

.tool-status {
    padding: 8px 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(59, 130, 246, 0.05);
    border-radius: 0 0 12px 12px;
}

.status-text {
    font-size: 10px;
    color: #666;
    text-align: center;
    display: block;
    line-height: 1.3;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .modeling-toolbar {
        top: 10px;
        left: 10px;
        width: 70px;
    }
    
    .tool-button {
        padding: 10px 4px;
    }
    
    .tool-button i {
        font-size: 18px;
    }
    
    .tool-label {
        font-size: 8px;
    }
}
</style>
