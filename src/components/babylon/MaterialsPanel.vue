<template>
    <div 
        class="babylon-panel top-right materials-panel" 
        v-show="visible"
        :style="{ width: panelWidth + 'px', height: panelHeight + 'px' }"
    >
        <!-- Resize Handles -->
        <div class="resize-handle resize-handle-left" @mousedown="startResize($event, 'left')"></div>
        <div class="resize-handle resize-handle-right" @mousedown="startResize($event, 'right')"></div>
        <div class="resize-handle resize-handle-top" @mousedown="startResize($event, 'top')"></div>
        <div class="resize-handle resize-handle-bottom" @mousedown="startResize($event, 'bottom')"></div>
        <div class="resize-handle resize-handle-top-left" @mousedown="startResize($event, 'top-left')"></div>
        <div class="resize-handle resize-handle-top-right" @mousedown="startResize($event, 'top-right')"></div>
        <div class="resize-handle resize-handle-bottom-left" @mousedown="startResize($event, 'bottom-left')"></div>
        <div class="resize-handle resize-handle-bottom-right" @mousedown="startResize($event, 'bottom-right')"></div>
        
        <!-- Panel Header -->
        <div class="babylon-panel-header">
            <div class="babylon-panel-title-section">
                <i class="babylon-panel-icon pi pi-palette"></i>
                <h3 class="babylon-panel-title">Materials</h3>
            </div>
            <div class="babylon-panel-controls">
                <button 
                    class="babylon-panel-control-btn"
                    @click="toggleCollapse"
                    title="Close Materials Panel"
                >
                    <i class="pi pi-times"></i>
                </button>
            </div>
        </div>

        <!-- Panel Content -->
        <div class="babylon-panel-content">
            <!-- Category Filter -->
            <div class="category-filter">
                <label class="filter-label">Category:</label>
                <Dropdown 
                    v-model="selectedCategory" 
                    :options="categoryOptions" 
                    optionLabel="label" 
                    optionValue="value"
                    placeholder="Select a category"
                    class="category-dropdown"
                />
            </div>

            <!-- Materials Grid -->
            <div class="materials-grid">
                <div 
                    v-for="material in filteredMaterials" 
                    :key="material.name"
                    class="material-item"
                    :class="{ 'material-selected': selectedMaterialForAssignment && selectedMaterialForAssignment.name === material.name }"
                    @click="applyMaterial(material)"
                    :title="material.description"
                >
                    <!-- Material Preview -->
                    <div class="material-preview" :style="getMaterialPreviewStyle(material)">
                        <div class="material-sphere"></div>
                    </div>
                    
                    <!-- Material Info -->
                    <div class="material-info">
                        <div class="material-name">{{ material.name }}</div>
                        <div class="material-category">{{ material.category }}</div>
                    </div>
                </div>
            </div>

            <!-- Current Selection Info -->
            <div class="selection-info" v-if="hasSelection">
                <div class="selection-text">
                    {{ selectionCount }} object{{ selectionCount !== 1 ? 's' : '' }} selected
                </div>
            </div>

            <!-- Material Assignment Status -->
            <div class="assignment-status" v-if="selectedMaterialForAssignment">
                <div class="assignment-text">
                    <i class="pi pi-hand-pointer"></i>
                    <span>Applying "{{ selectedMaterialForAssignment.name }}" - Click objects or press ESC to exit</span>
                </div>
                <button 
                    class="cancel-assignment-btn"
                    @click="clearMaterialAssignment"
                    title="Cancel material assignment"
                >
                    <i class="pi pi-times"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { MaterialLibrary } from '../../libraries/MaterialLibrary.js'
import Dropdown from 'primevue/dropdown'

const props = defineProps({
    scene: Object,
    selectionManager: Object,
    allMeshes: Array,
    toolsOrchestrator: Object, // Add mode manager
    visible: {
        type: Boolean,
        default: true
    }
})

// Emits
const emit = defineEmits(['update:visible'])

// Panel state
const selectedCategory = ref('all')

// Mode state - track current mode reactively
const currentMode = ref('')
const modeChangeCallback = ref(null)
const isInMaterialEditingMode = computed(() => {
    return currentMode.value === 'material-editing'
})

// Watch for toolsOrchestrator changes to track mode
watch(() => props.toolsOrchestrator, (newOrchestrator, oldOrchestrator) => {
    // Clean up old callback
    if (oldOrchestrator && modeChangeCallback.value) {
        oldOrchestrator.removeModeChangeCallback(modeChangeCallback.value)
    }
    
    if (newOrchestrator) {
        // Set up mode change listener
        modeChangeCallback.value = ({ newMode }) => {
            currentMode.value = newMode
        }
        
        // Initial mode
        currentMode.value = newOrchestrator.getCurrentMode()
        
        // Listen for mode changes
        newOrchestrator.onModeChange(modeChangeCallback.value)
    }
}, { immediate: true })

// Panel resize state
const panelWidth = ref(280)
const panelHeight = ref(null) // null means use CSS max-height
const minWidth = ref(250)
const maxWidth = ref(400)
const minHeight = ref(200)
const maxHeight = ref(600)
const isResizing = ref(false)
const resizeDirection = ref('')
const resizeStartPos = ref({ x: 0, y: 0 })
const resizeStartSize = ref({ width: 0, height: 0 })

// Material library
const materialLibrary = ref(null)
const materials = ref([])
const categories = ref([])

// Selection state
const selectedMeshes = ref([])
const selectionCount = computed(() => selectedMeshes.value.length)
const hasSelection = computed(() => selectionCount.value > 0)

// Material assignment state
const selectedMaterialForAssignment = ref(null)

// Category options for PrimeVue Dropdown
const categoryOptions = computed(() => {
    const options = [{ label: 'All Categories', value: 'all' }]
    categories.value.forEach(category => {
        options.push({ label: category, value: category })
    })
    return options
})

// Initialize material library - use a watcher to ensure proper timing
const initializeMaterials = async () => {
    if (props.scene && window.BABYLON) {
        try {
            materialLibrary.value = new MaterialLibrary(props.scene, window.BABYLON)
            
            // Wait for async initialization to complete
            await materialLibrary.value.waitForInitialization()
            
            materials.value = materialLibrary.value.getAllMaterials()
            categories.value = materialLibrary.value.getCategories()
            
            // Set up selection listener
            if (props.selectionManager) {
                props.selectionManager.setSelectionChangedCallback(onSelectionChanged)
            }
        } catch (error) {
            console.error('Failed to initialize MaterialLibrary:', error)
            // Retry after a short delay
            setTimeout(initializeMaterials, 100)
        }
    } else {
        // Retry if dependencies aren't ready yet
        setTimeout(initializeMaterials, 100)
    }
}

// Initialize material library
onMounted(() => {
    initializeMaterials()
})

// Clean up
onBeforeUnmount(() => {
    if (materialLibrary.value) {
        materialLibrary.value.dispose()
    }
    
    // Clean up mode change callback
    if (props.toolsOrchestrator && modeChangeCallback.value) {
        props.toolsOrchestrator.removeModeChangeCallback(modeChangeCallback.value)
    }
    
    // Remove resize event listeners
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
})

// Watch for scene changes to initialize materials when ready
watch(() => props.scene, (newScene) => {
    if (newScene && !materialLibrary.value) {
        initializeMaterials()
    }
})

// Watch for selection manager changes
watch(() => props.selectionManager, (newManager) => {
    if (newManager && materialLibrary.value) {
        newManager.setSelectionChangedCallback(onSelectionChanged)
    }
})

// Watch for visibility changes to handle mode transitions
watch(() => props.visible, (newVisible) => {
    if (!newVisible && props.toolsOrchestrator && isInMaterialEditingMode.value) {
        // If panel is being hidden and we're in material editing mode, exit the mode
        clearMaterialAssignment()
    }
})

// Watch for mode changes to clear material assignment when exiting material editing mode
watch(() => currentMode.value, (newMode) => {
    if (newMode !== 'material-editing' && selectedMaterialForAssignment.value) {
        selectedMaterialForAssignment.value = null
    }
})

// Computed properties
const filteredMaterials = computed(() => {
    if (selectedCategory.value === 'all') {
        return materials.value
    }
    return materialLibrary.value.getMaterialsByCategory(selectedCategory.value)
})

// Methods
function toggleCollapse() {
    // Instead of collapsing, hide the entire panel and exit material editing mode
    emit('update:visible', false)
    if (props.toolsOrchestrator && isInMaterialEditingMode.value) {
        props.toolsOrchestrator.exitCurrentMode()
    }
}

function onSelectionChanged(selectionData) {
    selectedMeshes.value = selectionData?.selectedMeshes || []
}

function getMaterialPreviewStyle(material) {
    // Get the base color from the material
    const mat = material.material
    let color = '#888888' // Default gray
    
    if (mat.baseColor) {
        const r = Math.round(mat.baseColor.r * 255)
        const g = Math.round(mat.baseColor.g * 255)
        const b = Math.round(mat.baseColor.b * 255)
        color = `rgb(${r}, ${g}, ${b})`
    } else if (mat.diffuseColor) {
        const r = Math.round(mat.diffuseColor.r * 255)
        const g = Math.round(mat.diffuseColor.g * 255)
        const b = Math.round(mat.diffuseColor.b * 255)
        color = `rgb(${r}, ${g}, ${b})`
    }
    
    // Add metallic/glass effects
    let backgroundStyle = `background-color: ${color};`
    
    if (mat.metallicFactor > 0.5) {
        backgroundStyle += `background-image: linear-gradient(45deg, ${color} 30%, rgba(255,255,255,0.3) 50%, ${color} 70%);`
    }
    
    if (mat.alpha < 1.0) {
        backgroundStyle += `opacity: ${0.6 + mat.alpha * 0.4};`
    }
    
    return backgroundStyle
}

function applyMaterial(material) {
    if (!materialLibrary.value || !props.toolsOrchestrator) return
    
    // Set the selected material for assignment
    selectedMaterialForAssignment.value = material
    
    // If we're already in material editing mode, just update the selected material
    if (isInMaterialEditingMode.value) {
        // Update the mode options with the new material
        props.toolsOrchestrator.setMode('material-editing', { 
            selectedMaterial: material,
            onGeometryClick: handleGeometryClick 
        })
    } else {
        // Enter material assignment mode for the first time
        props.toolsOrchestrator.setMode('material-editing', { 
            selectedMaterial: material,
            onGeometryClick: handleGeometryClick 
        })
    }
}

function handleGeometryClick(clickedMesh, pickInfo = null) {
    if (!selectedMaterialForAssignment.value || !materialLibrary.value) return
    
    // Always apply to connected faces - this is the only supported mode
    if (pickInfo && pickInfo.faceId !== undefined) {
        const faceId = pickInfo.faceId
        const materialName = selectedMaterialForAssignment.value.material.name
        
        // Apply to connected coplanar faces
        const success = materialLibrary.value.applyMaterialToFaces(materialName, clickedMesh, faceId)
        
        if (success) {
            console.log(`Applied material "${selectedMaterialForAssignment.value.name}" to connected faces starting from face ${faceId}`)
        } else {
            console.warn('Failed to apply material to faces:', selectedMaterialForAssignment.value.name)
        }
    } else {
        console.warn('No face information available for material assignment')
    }
}

function clearMaterialAssignment() {
    selectedMaterialForAssignment.value = null
    if (props.toolsOrchestrator && isInMaterialEditingMode.value) {
        props.toolsOrchestrator.exitCurrentMode()
    }
}

// Resize functionality
function startResize(event, direction) {
    event.preventDefault()
    isResizing.value = true
    resizeDirection.value = direction
    resizeStartPos.value = { x: event.clientX, y: event.clientY }
    resizeStartSize.value = { 
        width: panelWidth.value, 
        height: panelHeight.value || 0 
    }
    
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
    document.body.style.cursor = getCursorStyle(direction)
    document.body.style.userSelect = 'none'
}

function handleResize(event) {
    if (!isResizing.value) return
    
    const deltaX = event.clientX - resizeStartPos.value.x
    const deltaY = event.clientY - resizeStartPos.value.y
    const direction = resizeDirection.value
    
    let newWidth = resizeStartSize.value.width
    let newHeight = resizeStartSize.value.height
    
    // Handle horizontal resizing
    if (direction.includes('left')) {
        newWidth = resizeStartSize.value.width - deltaX
    } else if (direction.includes('right')) {
        newWidth = resizeStartSize.value.width + deltaX
    }
    
    // Handle vertical resizing
    if (direction.includes('top')) {
        newHeight = resizeStartSize.value.height - deltaY
    } else if (direction.includes('bottom')) {
        newHeight = resizeStartSize.value.height + deltaY
    }
    
    // Apply constraints
    newWidth = Math.max(minWidth.value, Math.min(maxWidth.value, newWidth))
    newHeight = Math.max(minHeight.value, Math.min(maxHeight.value, newHeight))
    
    // Update panel size
    panelWidth.value = newWidth
    if (direction.includes('top') || direction.includes('bottom')) {
        panelHeight.value = newHeight
    }
}

function stopResize() {
    isResizing.value = false
    resizeDirection.value = ''
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
}

function getCursorStyle(direction) {
    const cursors = {
        'left': 'ew-resize',
        'right': 'ew-resize',
        'top': 'ns-resize',
        'bottom': 'ns-resize',
        'top-left': 'nw-resize',
        'top-right': 'ne-resize',
        'bottom-left': 'sw-resize',
        'bottom-right': 'se-resize'
    }
    return cursors[direction] || 'default'
}
</script>

<style scoped>
/* Component-specific styles only */
/* The shared styles are imported from babylon-ui.css */

.materials-panel {
    width: 280px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #333;
}

/* Resize handles */
.resize-handle {
    position: absolute;
    background: transparent;
    z-index: 1001;
}

.resize-handle-left {
    left: -3px;
    top: 0;
    width: 6px;
    height: 100%;
    cursor: ew-resize;
}

.resize-handle-right {
    right: -3px;
    top: 0;
    width: 6px;
    height: 100%;
    cursor: ew-resize;
}

.resize-handle-top {
    top: -3px;
    left: 0;
    width: 100%;
    height: 6px;
    cursor: ns-resize;
}

.resize-handle-bottom {
    bottom: -3px;
    left: 0;
    width: 100%;
    height: 6px;
    cursor: ns-resize;
}

.resize-handle-top-left {
    top: -3px;
    left: -3px;
    width: 12px;
    height: 12px;
    cursor: nw-resize;
}

.resize-handle-top-right {
    top: -3px;
    right: -3px;
    width: 12px;
    height: 12px;
    cursor: ne-resize;
}

.resize-handle-bottom-left {
    bottom: -3px;
    left: -3px;
    width: 12px;
    height: 12px;
    cursor: sw-resize;
}

.resize-handle-bottom-right {
    bottom: -3px;
    right: -3px;
    width: 12px;
    height: 12px;
    cursor: se-resize;
}

.resize-handle:hover {
    background: rgba(59, 130, 246, 0.3);
}

.category-filter {
    margin-bottom: 16px;
}

.filter-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: #555;
    margin-bottom: 6px;
}

.category-dropdown {
    width: 100%;
}

.category-dropdown :deep(.p-dropdown) {
    width: 100%;
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
}

.category-dropdown :deep(.p-dropdown:not(.p-disabled):hover) {
    border-color: rgba(59, 130, 246, 0.3);
}

.category-dropdown :deep(.p-dropdown:not(.p-disabled).p-focus) {
    outline: none;
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.category-dropdown :deep(.p-dropdown-label) {
    padding: 8px 12px;
    color: #333;
    font-size: 12px;
    font-weight: 500;
}

.category-dropdown :deep(.p-dropdown-trigger) {
    color: #666;
    width: 2rem;
}

.category-dropdown :deep(.p-dropdown-panel) {
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.category-dropdown :deep(.p-dropdown-items) {
    padding: 4px 0;
}

.category-dropdown :deep(.p-dropdown-item) {
    padding: 8px 12px;
    color: #333;
    font-size: 12px;
    font-weight: 500;
}

.category-dropdown :deep(.p-dropdown-item:hover) {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
}

.materials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
    margin-bottom: 16px;
}

.material-item {
    background: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
}

.material-item:hover {
    background: rgba(0, 0, 0, 0.05);
    border: 2px solid rgba(59, 130, 246, 0.6);
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
}

.material-item.material-selected {
    background: rgba(59, 130, 246, 0.1);
    border: 2px solid rgba(59, 130, 246, 0.8);
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
}

.material-item.material-selected:hover {
    background: rgba(59, 130, 246, 0.15);
    border: 2px solid rgba(59, 130, 246, 1);
    box-shadow: 0 0 16px rgba(59, 130, 246, 0.5);
}

.material-preview {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    margin: 0 auto 8px;
    position: relative;
    border: 2px solid rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.material-sphere {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: inherit;
    position: relative;
}

.material-sphere::after {
    content: '';
    position: absolute;
    top: 20%;
    left: 30%;
    width: 30%;
    height: 30%;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    filter: blur(8px);
}

.material-info {
    text-align: center;
}

.material-name {
    font-size: 11px;
    font-weight: 600;
    color: #333;
    margin-bottom: 2px;
    line-height: 1.2;
}

.material-category {
    font-size: 9px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
}

.selection-info {
    padding: 8px 12px;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 6px;
    text-align: center;
}

.selection-text {
    font-size: 11px;
    color: #3b82f6;
    font-weight: 500;
}

.assignment-status {
    padding: 8px 12px;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    gap: 8px;
}

.assignment-text {
    font-size: 11px;
    color: #10b981;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
}

.assignment-text span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.cancel-assignment-btn {
    background: none;
    border: none;
    color: #10b981;
    cursor: pointer;
    padding: 2px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    transition: background-color 0.2s ease;
}

.cancel-assignment-btn:hover {
    background: rgba(16, 185, 129, 0.2);
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
    .materials-panel {
        width: 250px;
    }
    
    .materials-panel {
        min-width: 200px;
        max-width: 320px;
    }
}
</style>
