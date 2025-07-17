class ViewManager {
    constructor(camera, scene, canvas, BABYLON_LIB = null) {
        this.camera = camera;
        this.scene = scene;
        this.canvas = canvas;
        this.BABYLON = BABYLON_LIB || window.BABYLON;
        
        // Check if BABYLON is available
        if (!this.BABYLON) {
            throw new Error('BABYLON library is not available. Please ensure Babylon.js is loaded.');
        }
        
        // Current view mode
        this.currentMode = 'orbit';
        this.panModeActive = false;
        this.zoomModeActive = false;
        
        // Event handlers
        this.boundHandlers = {
            mouseDown: this.handleMouseDown.bind(this),
            mouseMove: this.handleMouseMove.bind(this),
            mouseUp: this.handleMouseUp.bind(this),
            wheel: this.handleWheel.bind(this),
            contextMenu: this.handleContextMenu.bind(this)
        };
        
        // Mouse state for custom pan/zoom
        this.mouseState = {
            isDown: false,
            lastX: 0,
            lastY: 0,
            button: null
        };
    }

    setSensibility(){
        this.camera.zoomToMouseLocation = true
        this.camera.wheelPrecision = 10 // Adjust zoom sensitivity
        this.camera.pinchPrecision = 200 // Adjust pinch sensitivity for touch devices
        this.camera.inertia = 0.1 // Reduce momentum (default is 0.9, lower = less floating)
        this.camera.panningInertia = 0.1 // Reduce panning momentum
        this.camera.angularSensibilityX = 200 // Adjust rotation sensitivity
        this.camera.angularSensibilityY = 200 // Adjust rotation sensitivity
        this.camera.panningSensibility = 100 // Adjust panning sensitivity
        this.camera.minZ = 0.1
        console.log('Camera sensitivities set');
    }

    /**
     * Enable orbit mode - standard camera rotation around target
     */
    enableOrbitMode() {
        this.currentMode = 'orbit';
        this.removeCustomEventListeners();
        this.camera.inputs.addPointers();
        this.setSensibility();
        console.log('Orbit mode enabled');
    }

    /**
     * Enable pan mode - move view horizontally and vertically
     */
    enablePanMode() {
        this.currentMode = 'pan';

        // Remove the default pointer input to disable orbiting
        if (this.camera.inputs.attached.pointers) {
            this.camera.inputs.remove(this.camera.inputs.attached.pointers);
        }
        
        this.setupCustomControls();
        console.log('Pan mode enabled');
    }

    /**
     * Enable zoom mode - zoom in/out focus
     */
    enableZoomMode() {
        this.currentMode = 'zoom';
        
        // Remove the default pointer input to disable orbiting
        if (this.camera.inputs.attached.pointers) {
            this.camera.inputs.remove(this.camera.inputs.attached.pointers);
        }
        
        this.setupCustomControls();
        console.log('Zoom mode enabled');
    }

    /**
     * Setup custom event listeners for pan and zoom modes
     */
    setupCustomControls() {
        this.removeCustomEventListeners();
        
        // Use pointer events instead of mouse events
        this.canvas.addEventListener('pointerdown', this.boundHandlers.mouseDown, { capture: true, passive: false });
        this.canvas.addEventListener('pointermove', this.boundHandlers.mouseMove, { capture: true, passive: false });
        this.canvas.addEventListener('pointerup', this.boundHandlers.mouseUp, { capture: true, passive: false });
        
        this.canvas.addEventListener('wheel', this.boundHandlers.wheel, { capture: true, passive: false });
        this.canvas.addEventListener('contextmenu', this.boundHandlers.contextMenu, { capture: true, passive: false });
        
        // Listen on window for pointer up (in case pointer leaves canvas)
        window.addEventListener('pointerup', this.boundHandlers.mouseUp, { capture: true, passive: false });
        
        console.log('Custom controls setup for', this.currentMode, 'mode');
    }

    /**
     * Remove custom event listeners
     */
    removeCustomEventListeners() {
        if (this.canvas) {
            // Use pointer events instead of mouse events
            this.canvas.removeEventListener('pointerdown', this.boundHandlers.mouseDown, true);
            this.canvas.removeEventListener('pointermove', this.boundHandlers.mouseMove, true);
            this.canvas.removeEventListener('pointerup', this.boundHandlers.mouseUp, true);
            this.canvas.removeEventListener('wheel', this.boundHandlers.wheel, true);
            this.canvas.removeEventListener('contextmenu', this.boundHandlers.contextMenu, true);
        }
        
        window.removeEventListener('pointerup', this.boundHandlers.mouseUp, true);
        
        console.log('Custom event listeners removed');
    }

    /**
     * Handle mouse down events for custom controls
     */
    handleMouseDown(event) {
        console.log('Mouse down in', this.currentMode, 'mode');
        event.preventDefault();
        event.stopPropagation();
        this.mouseState.isDown = true;
        this.mouseState.lastX = event.clientX;
        this.mouseState.lastY = event.clientY;
        this.mouseState.button = event.button;
        
        this.canvas.style.cursor = this.currentMode === 'pan' ? 'grabbing' : 'zoom-in';
    }

    /**
     * Handle mouse move events for custom controls
     */
    handleMouseMove(event) {
        if (!this.mouseState.isDown) {
            // Set cursor when hovering
            this.canvas.style.cursor = this.currentMode === 'pan' ? 'grab' : 'zoom-in';
            return;
        }
        
        event.preventDefault();
        event.stopPropagation();
        
        const deltaX = event.clientX - this.mouseState.lastX;
        const deltaY = event.clientY - this.mouseState.lastY;
        
        if (this.currentMode === 'pan') {
            this.performPan(deltaX, deltaY);
        } else if (this.currentMode === 'zoom') {
            this.performZoom(deltaY);
        }
        
        this.mouseState.lastX = event.clientX;
        this.mouseState.lastY = event.clientY;
    }

    /**
     * Handle mouse up events for custom controls
     */
    handleMouseUp(event) {
        this.mouseState.isDown = false;
        this.mouseState.button = null;
        
        this.canvas.style.cursor = this.currentMode === 'pan' ? 'grab' : 'zoom-in';
    }

    /**
     * Handle wheel events for custom zoom
     */
    handleWheel(event) {
        if (this.currentMode === 'zoom') {
            event.preventDefault();
            event.stopPropagation();
            
            console.log('Wheel event in zoom mode:', event.deltaY);
            
            const delta = event.deltaY > 0 ? 1 : -1;
            this.performZoom(delta * 5); // Reduce multiplier for smoother zoom
        }
    }

    /**
     * Handle context menu to prevent right-click menu
     */
    handleContextMenu(event) {
        event.preventDefault();
        return false;
    }

    /**
     * Perform pan operation
     */
    performPan(deltaX, deltaY) {
        if (!this.camera.target) return;
        
        // For ArcRotateCamera, we need to move the target point
        // Calculate pan sensitivity based on camera radius (distance to target)
        const sensitivity = this.camera.radius * 0.002;
        
        // Get camera's current view matrix to determine right and up vectors
        const viewMatrix = this.camera.getViewMatrix();
        const cameraMatrix = viewMatrix.invert();
        
        // Extract right and up vectors from camera matrix
        const right = this.BABYLON.Vector3.TransformNormal(this.BABYLON.Vector3.Right(), cameraMatrix);
        const up = this.BABYLON.Vector3.TransformNormal(this.BABYLON.Vector3.Up(), cameraMatrix);
        
        // Calculate pan movement (invert deltaX to make panning feel natural)
        const panRight = right.scale(-deltaX * sensitivity);
        const panUp = up.scale(deltaY * sensitivity);
        const totalPan = panRight.add(panUp);
        
        // Move the camera target
        this.camera.target.addInPlace(totalPan);
        
        console.log('Panning:', { deltaX, deltaY, sensitivity, target: this.camera.target });
    }

    /**
     * Perform zoom operation
     */
    performZoom(delta) {
        if (!this.camera.target) return;
        
        // For ArcRotateCamera, zooming means changing the radius
        const sensitivity = Math.max(this.camera.radius * 0.01, 0.1);
        const zoomAmount = delta * sensitivity;
        
        // Calculate new radius
        const newRadius = this.camera.radius + zoomAmount;
        
        // Prevent zooming too close or too far
        if (newRadius > 0.5 && newRadius < 1000) {
            this.camera.radius = newRadius;
            console.log('Zooming:', { delta, zoomAmount, newRadius: this.camera.radius });
        }
    }

    /**
     * Reset camera to default position and orientation
     */
    resetView() {
        // Reset to default arc rotate camera position
        this.camera.setTarget(this.BABYLON.Vector3.Zero());
        this.camera.alpha = Math.PI / 2;
        this.camera.beta = Math.PI / 4;
        this.camera.radius = 50;
        
        console.log('View reset to default');
    }

    /**
     * Fit all objects in view
     */
    fitToScene() {
        if (!this.scene) return;
        
        // Get all meshes in scene (excluding ground and temporary meshes)
        const meshes = this.scene.meshes.filter(mesh => 
            mesh.name !== 'ground' && 
            !mesh.name.startsWith('face_') && 
            !mesh.name.startsWith('component') &&
            mesh.isVisible &&
            mesh.isEnabled()
        );
        
        if (meshes.length === 0) return;
        
        // Calculate bounding box of all meshes
        let min = null;
        let max = null;
        
        meshes.forEach(mesh => {
            mesh.computeWorldMatrix(true);
            const boundingInfo = mesh.getBoundingInfo();
            const meshMin = boundingInfo.boundingBox.minimumWorld;
            const meshMax = boundingInfo.boundingBox.maximumWorld;
            
            if (!min) {
                min = meshMin.clone();
                max = meshMax.clone();
            } else {
                min = this.BABYLON.Vector3.Minimize(min, meshMin);
                max = this.BABYLON.Vector3.Maximize(max, meshMax);
            }
        });
        
        if (min && max) {
            // Calculate center and size
            const center = min.add(max).scale(0.5);
            const size = max.subtract(min);
            const maxDimension = Math.max(size.x, size.y, size.z);
            
            // Set camera target to center
            this.camera.setTarget(center);
            
            // Set camera distance based on scene size
            this.camera.radius = maxDimension * 1.5;
            
            console.log('Camera fitted to scene');
        }
    }

    /**
     * Get current view mode
     */
    getCurrentMode() {
        return this.currentMode;
    }

    /**
     * Dispose of the ViewManager and clean up resources
     */
    dispose() {
        this.removeCustomEventListeners();
        console.log('ViewManager disposed');
    }
}

// Export the class for use in other modules
export default ViewManager;
