/**
 * toolsOrchestrator - Centralized mode management for the Babylon.js application
 * Handles switching between different interaction modes (orbit, selection, pencil, material editing, etc.)
 */
import HighlightManager from './HighlightManager.js'

export default class ToolsOrchestrator {
    constructor(scene, camera, canvas, BABYLON, options = {}) {
        this.scene = scene
        this.camera = camera
        this.canvas = canvas
        this.BABYLON = BABYLON
        
        // Additional managers and dependencies
        this.viewManager = options.viewManager
        this.selectionManager = options.selectionManager
        this.snapManager = options.snapManager
        
        // Initialize HighlightManager
        this.highlightManager = new HighlightManager(scene, BABYLON)
        
        // Available modes
        this.modes = {
            ORBIT: 'orbit',
            PAN: 'pan', 
            ZOOM: 'zoom',
            SELECTION: 'selection',
            PENCIL: 'pencil',
            PUSHPULL: 'pushpull',
            MATERIAL_EDITING: 'material-editing'
        }
        
        // Current active mode - start in orbit mode by default
        this.currentMode = this.modes.ORBIT
        this.previousMode = this.modes.ORBIT
        
        // Mode change callbacks
        this.modeChangeCallbacks = []
        
        // Event handlers storage
        this.eventHandlers = new Map()
        
        // ESC key listener for exiting special modes
        this.setupEscapeListener()
        
        console.log('toolsOrchestrator initialized')
    }
    
    /**
     * Set the active mode
     * @param {string} mode - The mode to activate
     * @param {Object} options - Additional options for the mode
     */
    setMode(mode, options = {}) {
        if (!Object.values(this.modes).includes(mode)) {
            console.warn(`Invalid mode: ${mode}`)
            return false
        }
        
        if (this.currentMode === mode) {
            // If we're already in this mode, but for material editing mode, 
            // we might need to update the options (e.g., different material selected)
            if (mode === this.modes.MATERIAL_EDITING) {
                this.materialEditingOptions = options
                // Update the click handler if a new one is provided
                if (options.onGeometryClick && this.canvas) {
                    // Remove old handlers
                    if (this.materialClickHandler) {
                        this.canvas.removeEventListener('click', this.materialClickHandler, true)
                        this.eventHandlers.delete('material_click')
                    }
                    if (this.materialHoverHandler) {
                        this.canvas.removeEventListener('mousemove', this.materialHoverHandler, false)
                        this.eventHandlers.delete('material_hover')
                    }
                    
                    // Set up new handler with updated options
                    this.setupMaterialClickHandler(options)
                }
                console.log(`Updated material editing options for ${options.selectedMaterial?.name || 'unknown material'}`)
            }
            return true // Already in this mode, but updated options if needed
        }
        
        // Clean up current mode before switching
        this.cleanupCurrentMode()
        
        // Store previous mode before changing
        this.previousMode = this.currentMode
        this.currentMode = mode
        
        // Apply mode-specific behavior
        this.applyModeSettings(mode, options)
        
        // Notify listeners
        this.notifyModeChange(mode, this.previousMode, options)
        
        console.log(`Mode changed from ${this.previousMode} to ${mode}`)
        return true
    }
    
    /**
     * Get the current active mode
     */
    getCurrentMode() {
        return this.currentMode
    }
    
    /**
     * Get the previous mode
     */
    getPreviousMode() {
        return this.previousMode
    }
    
    /**
     * Check if currently in a specific mode
     */
    isMode(mode) {
        return this.currentMode === mode
    }
    
    /**
     * Exit current mode and return to previous mode or default
     */
    exitCurrentMode() {
        if (this.currentMode === this.modes.MATERIAL_EDITING) {
            // Exit material editing mode and return to previous mode
            const targetMode = this.previousMode || this.modes.ORBIT
            this.setMode(targetMode)
        } else if (this.isSpecialMode(this.currentMode)) {
            // Exit other special modes and return to orbit
            this.setMode(this.modes.ORBIT)
        }
    }
    
    /**
     * Check if the current mode is a special mode that can be exited with ESC
     */
    isSpecialMode(mode) {
        return [
            this.modes.MATERIAL_EDITING,
            this.modes.PENCIL,
            this.modes.PUSHPULL
        ].includes(mode)
    }

    /**
     * Clean up resources and event handlers from the current mode
     */
    cleanupCurrentMode() {
        // Clean up material editing mode specific handlers
        if (this.currentMode === this.modes.MATERIAL_EDITING) {
            if (this.materialClickHandler && this.canvas) {
                this.canvas.removeEventListener('click', this.materialClickHandler, true)
                this.eventHandlers.delete('material_click')
                this.materialClickHandler = null
            }
            if (this.materialHoverHandler && this.canvas) {
                this.canvas.removeEventListener('mousemove', this.materialHoverHandler, false)
                this.eventHandlers.delete('material_hover')
                this.materialHoverHandler = null
                this.canvas.style.cursor = '' // Reset cursor
            }
            
            // Clear highlight manager
            if (this.highlightManager) {
                this.highlightManager.clearHighlight()
                this.highlightManager.setMode(this.highlightManager.modes.NONE)
            }
            
            this.materialEditingOptions = null
        }
        
        // Remove any other mode-specific event listeners
        this.removeAllEventListeners()
    }

    /**
     * Apply mode-specific settings and behaviors
     */
    applyModeSettings(mode, options = {}) {
        switch (mode) {
            case this.modes.ORBIT:
                this.setupOrbitMode()
                break
            case this.modes.PAN:
                this.setupPanMode()
                break
            case this.modes.ZOOM:
                this.setupZoomMode()
                break
            case this.modes.SELECTION:
                this.setupSelectionMode()
                break
            case this.modes.PENCIL:
                this.setupPencilMode()
                break
            case this.modes.PUSHPULL:
                this.setupPushPullMode()
                break
            case this.modes.MATERIAL_EDITING:
                this.setupMaterialEditingMode(options)
                break
            default:
                console.warn(`No setup method for mode: ${mode}`)
        }
    }
    
    setupOrbitMode() {
        // Remove any custom event listeners
        this.removeAllEventListeners()
        
        // Clear highlight manager
        if (this.highlightManager) {
            this.highlightManager.clearHighlight()
            this.highlightManager.setMode(this.highlightManager.modes.NONE)
        }
        
        // Use ViewManager for orbit mode if available
        if (this.viewManager) {
            this.viewManager.enableOrbitMode()
        } else {
            // Fallback: Default camera controls - orbit mode
            if (this.camera && this.camera.attachControl) {
                this.camera.attachControl(this.canvas, true)
            }
        }
        
        // Disable snap manager for orbit mode
        if (this.snapManager) {
            this.snapManager.disable()
        }
    }
    
    setupPanMode() {
        // Remove any custom event listeners
        this.removeAllEventListeners()
        
        // Clear highlight manager
        if (this.highlightManager) {
            this.highlightManager.clearHighlight()
            this.highlightManager.setMode(this.highlightManager.modes.NONE)
        }
        
        // Use ViewManager for pan mode if available
        if (this.viewManager) {
            this.viewManager.enablePanMode()
        } else {
            // Fallback: Pan-only camera controls
            if (this.camera && this.camera.attachControl) {
                this.camera.attachControl(this.canvas, true)
            }
        }
        
        // Disable snap manager for pan mode
        if (this.snapManager) {
            this.snapManager.disable()
        }
    }
    
    setupZoomMode() {
        // Remove any custom event listeners
        this.removeAllEventListeners()
        
        // Clear highlight manager
        if (this.highlightManager) {
            this.highlightManager.clearHighlight()
            this.highlightManager.setMode(this.highlightManager.modes.NONE)
        }
        
        // Use ViewManager for zoom mode if available
        if (this.viewManager) {
            this.viewManager.enableZoomMode()
        } else {
            // Fallback: Zoom-only camera controls
            if (this.camera && this.camera.attachControl) {
                this.camera.attachControl(this.canvas, true)
            }
        }
        
        // Disable snap manager for zoom mode
        if (this.snapManager) {
            this.snapManager.disable()
        }
    }
    
    setupSelectionMode() {
        // Remove any existing event listeners
        this.removeAllEventListeners()
        
        // Keep camera controls active for selection mode
        if (this.camera && this.camera.attachControl) {
            this.camera.attachControl(this.canvas, true)
        }
        
        // Disable snap manager for selection tool
        if (this.snapManager) {
            this.snapManager.disable()
        }
        
        // Configure highlight manager for face selection
        if (this.highlightManager) {
            this.highlightManager.setMode(this.highlightManager.modes.PLANAR_SURFACE)
        }
        
        // Set up selection event listeners
        if (this.canvas && this.selectionManager) {
            const handleSelectionClick = (event) => {
                this.selectionManager.handleSelectionClick(event, this.canvas)
            }
            
            const handleSelectionHover = (event) => {
                const canvasRect = this.canvas.getBoundingClientRect()
                const x = event.clientX - canvasRect.left
                const y = event.clientY - canvasRect.top
                
                // Update highlight manager
                if (this.highlightManager) {
                    this.highlightManager.updateHighlight(x, y, this.canvas)
                }
            }
            
            this.canvas.addEventListener('click', handleSelectionClick, true) // capture phase
            this.canvas.addEventListener('mousemove', handleSelectionHover, false)
            this.eventHandlers.set('selection_click', handleSelectionClick)
            this.eventHandlers.set('selection_hover', handleSelectionHover)
            
            console.log('Selection mode event listeners activated')
        }
    }
    
    setupPencilMode() {
        // Remove any existing event listeners
        this.removeAllEventListeners()
        
        // Keep camera controls active but with lower priority
        if (this.camera && this.camera.attachControl) {
            this.camera.attachControl(this.canvas, true)
        }
        
        // Enable snap manager for pencil tool
        if (this.snapManager) {
            console.log('Activating snap manager for pencil tool')
            this.snapManager.enable()
        }
        
        // TODO: Add pencil-specific event listeners here when implemented
        // const handlePencilMouseDown = (event) => { /* implementation */ }
        // const handlePencilMouseMove = (event) => { /* implementation */ }
        // const handlePencilMouseUp = (event) => { /* implementation */ }
        // 
        // this.canvas.addEventListener('mousedown', handlePencilMouseDown, true)
        // this.canvas.addEventListener('mousemove', handlePencilMouseMove, true)
        // this.canvas.addEventListener('mouseup', handlePencilMouseUp, true)
        // 
        // this.eventHandlers.set('pencil_mousedown', handlePencilMouseDown)
        // this.eventHandlers.set('pencil_mousemove', handlePencilMouseMove)
        // this.eventHandlers.set('pencil_mouseup', handlePencilMouseUp)
        
        console.log('Pencil mode activated (event listeners to be implemented)')
    }
    
    setupPushPullMode() {
        // Remove any existing event listeners
        this.removeAllEventListeners()
        
        // Keep camera controls active but with lower priority
        if (this.camera && this.camera.attachControl) {
            this.camera.attachControl(this.canvas, true)
        }
        
        // Disable snap manager for push-pull tool
        if (this.snapManager) {
            this.snapManager.disable()
        }
        
        // TODO: Add push-pull-specific event listeners here when implemented
        // const handlePushPullClick = (event) => { /* implementation */ }
        // const handlePushPullMouseDown = (event) => { /* implementation */ }
        // const handlePushPullMouseMove = (event) => { /* implementation */ }
        // const handlePushPullMouseUp = (event) => { /* implementation */ }
        // 
        // this.canvas.addEventListener('click', handlePushPullClick, true)
        // this.canvas.addEventListener('mousedown', handlePushPullMouseDown, true)
        // this.canvas.addEventListener('mousemove', handlePushPullMouseMove, true)
        // this.canvas.addEventListener('mouseup', handlePushPullMouseUp, true)
        // 
        // this.eventHandlers.set('pushpull_click', handlePushPullClick)
        // this.eventHandlers.set('pushpull_mousedown', handlePushPullMouseDown)
        // this.eventHandlers.set('pushpull_mousemove', handlePushPullMouseMove)
        // this.eventHandlers.set('pushpull_mouseup', handlePushPullMouseUp)
        
        console.log('Push-pull mode activated (event listeners to be implemented)')
    }
    
    setupMaterialEditingMode(options = {}) {
        // Keep camera controls active for material editing
        if (this.camera && this.camera.attachControl) {
            this.camera.attachControl(this.canvas, true)
        }
        
        // Store material editing options
        this.materialEditingOptions = options
        
        // Configure highlight manager for material assignment
        if (this.highlightManager) {
            // Always use connected faces mode for material assignment
            this.highlightManager.setMaterialAssignmentMode()
        }
        
        // Set up geometry click handler for material assignment
        if (options.onGeometryClick && this.canvas) {
            this.setupMaterialClickHandler(options)
        }
        
        console.log('Material editing mode activated with geometry click handler')
    }

    setupMaterialClickHandler(options) {
        this.materialClickHandler = (event) => {
            // Only handle left clicks
            if (event.button !== 0) return
            
            // Get canvas rect for accurate coordinates
            const canvasRect = this.canvas.getBoundingClientRect()
            const x = event.clientX - canvasRect.left
            const y = event.clientY - canvasRect.top
            
            // Pick geometry at click position
            const pickInfo = this.scene.pick(x, y, (mesh) => {
                return mesh.isPickable && mesh.name !== 'ground' && mesh.name !== 'skybox'
            })
            
            if (pickInfo.hit && pickInfo.pickedMesh) {
                event.preventDefault()
                event.stopPropagation()
                
                // Call the geometry click handler with both mesh and pickInfo
                options.onGeometryClick(pickInfo.pickedMesh, pickInfo)
                return false // Prevent further event handling
            }
        }
        
        // Set up hover effect for material assignment mode
        this.materialHoverHandler = (event) => {
            const canvasRect = this.canvas.getBoundingClientRect()
            const x = event.clientX - canvasRect.left
            const y = event.clientY - canvasRect.top
            
            // Update highlight manager
            if (this.highlightManager) {
                this.highlightManager.updateHighlight(x, y, this.canvas)
            }
            
            // Legacy cursor management (can be removed if HighlightManager handles it)
            const pickInfo = this.scene.pick(x, y, (mesh) => {
                return mesh.isPickable && mesh.name !== 'ground' && mesh.name !== 'skybox'
            })
            
            if (pickInfo.hit && pickInfo.pickedMesh) {
                this.canvas.style.cursor = 'crosshair'
            } else {
                this.canvas.style.cursor = 'default'
            }
        }
        
        // Add the click handler with high priority (capture phase)
        this.canvas.addEventListener('click', this.materialClickHandler, true)
        this.canvas.addEventListener('mousemove', this.materialHoverHandler, false)
        this.eventHandlers.set('material_click', this.materialClickHandler)
        this.eventHandlers.set('material_hover', this.materialHoverHandler)
    }
    
    /**
     * Setup ESC key listener to exit special modes
     */
    setupEscapeListener() {
        this.escapeHandler = (event) => {
            if (event.key === 'Escape') {
                if (this.isSpecialMode(this.currentMode)) {
                    this.exitCurrentMode()
                    event.preventDefault()
                    event.stopPropagation()
                }
            }
        }
        
        document.addEventListener('keydown', this.escapeHandler)
    }
    
    /**
     * Remove all custom event listeners
     */
    removeAllEventListeners() {
        if (!this.canvas) return
        
        // Remove all stored event handlers
        this.eventHandlers.forEach((handler, key) => {
            const [tool, eventType] = key.split('_')
            
            // Remove from both capture and bubble phases
            this.canvas.removeEventListener(eventType, handler, true) // capture
            this.canvas.removeEventListener(eventType, handler, false) // bubble
        })
        
        // Clear the handlers map
        this.eventHandlers.clear()
        
        console.log('All custom event listeners removed')
    }
    
    /**
     * Add a callback to be notified when mode changes
     */
    onModeChange(callback) {
        this.modeChangeCallbacks.push(callback)
    }
    
    /**
     * Remove a mode change callback
     */
    removeModeChangeCallback(callback) {
        const index = this.modeChangeCallbacks.indexOf(callback)
        if (index > -1) {
            this.modeChangeCallbacks.splice(index, 1)
        }
    }
    
    /**
     * Notify all listeners of mode change
     */
    notifyModeChange(newMode, previousMode, options = {}) {
        this.modeChangeCallbacks.forEach(callback => {
            try {
                callback({
                    newMode,
                    previousMode,
                    options,
                    manager: this
                })
            } catch (error) {
                console.error('Error in mode change callback:', error)
            }
        })
    }
    
    /**
     * Update dependencies after initialization
     * @param {Object} dependencies - Object containing viewManager, selectionManager, snapManager
     */
    updateDependencies(dependencies = {}) {
        if (dependencies.viewManager) {
            this.viewManager = dependencies.viewManager
        }
        if (dependencies.selectionManager) {
            this.selectionManager = dependencies.selectionManager
        }
        if (dependencies.snapManager) {
            this.snapManager = dependencies.snapManager
        }
        
        console.log('toolsOrchestrator dependencies updated')
    }
    
    /**
     * Get material editing options
     */
    getMaterialEditingOptions() {
        return this.materialEditingOptions || {}
    }
    
    /**
     * Get the highlight manager instance
     */
    getHighlightManager() {
        return this.highlightManager
    }
    
    /**
     * Check if a mode is a view mode (orbit, pan, zoom)
     */
    isViewMode(mode) {
        return [this.modes.ORBIT, this.modes.PAN, this.modes.ZOOM].includes(mode)
    }
    
    /**
     * Check if a mode is a modeling mode (selection, pencil, pushpull)
     */
    isModelingMode(mode) {
        return [this.modes.SELECTION, this.modes.PENCIL, this.modes.PUSHPULL].includes(mode)
    }
    
    /**
     * Cleanup and dispose
     */
    dispose() {
        // Remove all custom event listeners
        this.removeAllEventListeners()
        
        // Remove ESC key listener
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler)
        }
        
        // Dispose highlight manager
        if (this.highlightManager) {
            this.highlightManager.dispose()
            this.highlightManager = null
        }
        
        // Clear callbacks
        this.modeChangeCallbacks = []
        
        console.log('toolsOrchestrator disposed')
    }
}
