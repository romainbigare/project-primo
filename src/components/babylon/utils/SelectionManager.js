class SelectionManager {
    constructor(scene, BABYLON_LIB = null) {
        this.scene = scene;
        this.BABYLON = BABYLON_LIB || window.BABYLON; // Use provided BABYLON or fallback to global
        
        // Check if BABYLON is available
        if (!this.BABYLON) {
            throw new Error('BABYLON library is not available. Please ensure Babylon.js is loaded.');
        }
        
        this.selectedMeshes = new Set();
        this.selectedSubMeshes = new Map(); // For faces, edges, etc.

        // Use a HighlightLayer for robust, non-destructive highlighting
        this.highlightLayer = new this.BABYLON.HighlightLayer("highlight-layer", this.scene);
        this.highlightLayer.innerGlow = false;
        this.highlightLayer.outerGlow = true;
        
        // Colors for different selection types
        this.meshHighlightColor = new this.BABYLON.Color3(0, 1, 1); // Cyan
        this.faceHighlightColor = new this.BABYLON.Color3(1, 1, 0); // Yellow
        this.componentHighlightColor = new this.BABYLON.Color3(1, 0, 1); // Magenta
        
        // Selection click handling variables
        this.clickCount = 0;
        this.clickTimer = null;
        this.CLICK_DELAY = 300;
        
        // Callback for selection changes
        this.onSelectionChanged = null;
    }

    handleSelectionClick(event, canvas) {
        // Get canvas bounds for correct coordinate calculation
        const canvasRect = canvas.getBoundingClientRect()
        const x = event.clientX - canvasRect.left
        const y = event.clientY - canvasRect.top
        
        const pickInfo = this.scene.pick(x, y, (mesh) => mesh.isPickable && mesh.name !== 'ground')
        
        if (pickInfo.hit) {
            event.preventDefault()
            event.stopPropagation()
            
            this.clickCount++
            
            // Clear existing timer
            if (this.clickTimer) {
                clearTimeout(this.clickTimer)
            }
            
            // Set timer for multi-click detection
            this.clickTimer = setTimeout(() => {
                this.processSelection(pickInfo, this.clickCount)
                this.clickCount = 0
            }, this.CLICK_DELAY)
        } else {
            this.clear() // Clear selection if nothing is picked
        }
    }

    processSelection(pickInfo, clicks) {
        try {
            const mesh = pickInfo.pickedMesh
            const faceId = pickInfo.faceId
            
            // Clear previous selection
            this.clear()
            
            switch (clicks) {
                case 1:
                    // Select single face
                    this.selectFace(mesh, faceId)
                    break
                case 2:
                    // Select face and connected edges (for now just the face)
                    this.selectFace(mesh, faceId)
                    break
                case 3:
                    // Select entire connected component
                    this.selectConnectedComponent(mesh, faceId)
                    break
            }
            
            // Trigger selection changed callback if set
            if (this.onSelectionChanged) {
                this.onSelectionChanged({ 
                    selectedMeshes: Array.from(this.selectedMeshes), 
                    selectedSubMeshes: Array.from(this.selectedSubMeshes.keys()),
                    selectionType: clicks === 1 ? 'face' : clicks === 2 ? 'face-edges' : 'component'
                })
            }
        } catch (error) {
            console.error('Error in processSelection:', error)
        }
    }

    /**
     * Sets the callback function for selection changes
     * @param {Function} callback Function to call when selection changes
     */
    setSelectionChangedCallback(callback) {
        this.onSelectionChanged = callback
    }

    /**
     * Adds a mesh to the selection.
     * @param {BABYLON.Mesh} mesh The mesh to add.
     */
    addMesh(mesh) {
        if (!this.selectedMeshes.has(mesh)) {
            this.selectedMeshes.add(mesh);
            this.highlightLayer.addMesh(mesh, this.meshHighlightColor);
        }
    }
    
    /**
     * Removes a mesh from the selection.
     * @param {BABYLON.Mesh} mesh The mesh to remove.
     */
    removeMesh(mesh) {
        if (this.selectedMeshes.has(mesh)) {
            this.selectedMeshes.delete(mesh);
            this.highlightLayer.removeMesh(mesh);
        }
    }

    /**
     * Toggles a mesh's selection state.
     * @param {BABYLON.Mesh} mesh The mesh to toggle.
     */
    toggleMesh(mesh) {
        if (this.selectedMeshes.has(mesh)) {
            this.removeMesh(mesh);
        } else {
            this.addMesh(mesh);
        }
    }

    /**
     * Selects a single face of a mesh.
     * This creates a temporary mesh to represent the face for highlighting.
     * @param {BABYLON.Mesh} mesh The parent mesh.
     * @param {number} faceId The ID of the face to select.
     */
    selectFace(mesh, faceId) {
        try {
            this.clear(); // Face selection is exclusive for now
            const faceMesh = this._createFaceMesh(mesh, faceId);
            if (faceMesh) {
                this.selectedSubMeshes.set('face_' + faceId, { parent: mesh, visual: faceMesh });
                this.highlightLayer.addMesh(faceMesh, this.faceHighlightColor);
            }
        } catch (error) {
            console.error('Error selecting face:', error);
        }
    }

    /**
     * Selects all connected faces of a mesh starting from a given face.
     * @param {BABYLON.Mesh} mesh The parent mesh.
     * @param {number} startFaceId The starting face for the search.
     */
    selectConnectedComponent(mesh, startFaceId) {
        try {
            this.clear(); // Component selection is exclusive
            const connectedFaces = this._findConnectedFaces(mesh, startFaceId);
            const componentMesh = this._createMeshFromFaces(mesh, Array.from(connectedFaces));
            if (componentMesh) {
                this.selectedSubMeshes.set('component_' + startFaceId, { parent: mesh, visual: componentMesh });
                this.highlightLayer.addMesh(componentMesh, this.componentHighlightColor);
            }
        } catch (error) {
            console.error('Error selecting connected component:', error);
        }
    }

    /**
     * Gets the current selection data
     * @returns {Object} Object containing selected meshes and sub-meshes
     */
    getSelectionData() {
        return {
            selectedMeshes: Array.from(this.selectedMeshes),
            selectedSubMeshes: Array.from(this.selectedSubMeshes.keys())
        }
    }

    /**
     * Clears the entire selection, including meshes and sub-meshes.
     */
    clear() {
        try {
            // Clear main mesh selections
            this.highlightLayer.removeAllMeshes();
            this.selectedMeshes.clear();

            // Clear sub-mesh selections (like faces)
            this.selectedSubMeshes.forEach(sub => {
                if (sub.visual && sub.visual.dispose) {
                    sub.visual.dispose();
                }
            });
            this.selectedSubMeshes.clear();
        } catch (error) {
            console.error('Error clearing selection:', error);
        }
    }

    /**
     * Disposes of the SelectionManager and cleans up resources
     */
    dispose() {
        // Clear any pending timers
        if (this.clickTimer) {
            clearTimeout(this.clickTimer);
            this.clickTimer = null;
        }
        
        // Clear selections
        this.clear();
        
        // Dispose highlight layer
        if (this.highlightLayer) {
            this.highlightLayer.dispose();
        }
        
        // Clear callback
        this.onSelectionChanged = null;
    }

    // --- Private Helper Methods for Sub-Geometry ---

    _createFaceMesh(sourceMesh, faceId) {
        try {
            const positions = sourceMesh.getVerticesData(this.BABYLON.VertexBuffer.PositionKind);
            const indices = sourceMesh.getIndices();
            if (!positions || !indices) {
                console.warn('Mesh has no position data or indices');
                return null;
            }

            // Check if faceId is valid
            if (faceId * 3 + 2 >= indices.length) {
                console.warn('FaceId is out of bounds:', faceId, 'max faces:', Math.floor(indices.length / 3));
                return null;
            }

            const faceVertexIndices = [indices[faceId * 3], indices[faceId * 3 + 1], indices[faceId * 3 + 2]];
            const facePositions = [];
            faceVertexIndices.forEach(index => {
                if (index * 3 + 2 < positions.length) {
                    facePositions.push(positions[index * 3], positions[index * 3 + 1], positions[index * 3 + 2]);
                } else {
                    console.warn('Vertex index out of bounds:', index);
                    return null;
                }
            });

            if (facePositions.length !== 9) { // 3 vertices * 3 components each
                console.warn('Invalid face positions length:', facePositions.length);
                return null;
            }

            const customMesh = new this.BABYLON.Mesh("face_" + faceId, this.scene);
            const vertexData = new this.BABYLON.VertexData();
            vertexData.positions = facePositions;
            vertexData.indices = [0, 1, 2];
            vertexData.applyToMesh(customMesh);

            customMesh.position = sourceMesh.position;
            customMesh.rotationQuaternion = sourceMesh.rotationQuaternion;
            customMesh.scaling = sourceMesh.scaling;
            customMesh.isPickable = false; // Don't allow picking the highlight mesh

            // Use a transparent material to avoid z-fighting issues
            const material = new this.BABYLON.StandardMaterial("faceMat", this.scene);
            material.alpha = 0.0;
            customMesh.material = material;

            return customMesh;
        } catch (error) {
            console.error('Error creating face mesh:', error);
            return null;
        }
    }

    _createMeshFromFaces(sourceMesh, faceIds) {
        const positions = sourceMesh.getVerticesData(this.BABYLON.VertexBuffer.PositionKind);
        const indices = sourceMesh.getIndices();
        if (!positions || !indices) return null;

        const newPositions = [];
        const newIndices = [];
        const vertexMap = new Map();
        let newIndexCounter = 0;

        faceIds.forEach(faceId => {
            for (let i = 0; i < 3; i++) {
                const originalIndex = indices[faceId * 3 + i];
                if (!vertexMap.has(originalIndex)) {
                    vertexMap.set(originalIndex, newIndexCounter);
                    newPositions.push(positions[originalIndex * 3], positions[originalIndex * 3 + 1], positions[originalIndex * 3 + 2]);
                    newIndexCounter++;
                }
                newIndices.push(vertexMap.get(originalIndex));
            }
        });
        
        const customMesh = new this.BABYLON.Mesh("componentMesh", this.scene);
        const vertexData = new this.BABYLON.VertexData();
        vertexData.positions = newPositions;
        vertexData.indices = newIndices;
        vertexData.applyToMesh(customMesh);

        customMesh.position = sourceMesh.position;
        customMesh.rotationQuaternion = sourceMesh.rotationQuaternion;
        customMesh.scaling = sourceMesh.scaling;
        customMesh.isPickable = false;
        
        const material = new this.BABYLON.StandardMaterial("compMat", this.scene);
        material.alpha = 0.0;
        customMesh.material = material;

        return customMesh;
    }

    _findConnectedFaces(mesh, startFaceId) {
        const indices = mesh.getIndices();
        if (!indices) return new Set([startFaceId]);

        const adjacency = this._buildAdjacencyList(mesh);
        const visited = new Set();
        const queue = [startFaceId];
        visited.add(startFaceId);

        while (queue.length > 0) {
            const currentFaceId = queue.shift();
            const neighbors = adjacency.get(currentFaceId) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        return visited;
    }
    
    _buildAdjacencyList(mesh) {
        const indices = mesh.getIndices();
        const adjacency = new Map();
        const edgeToFaceMap = new Map();

        for (let i = 0; i < indices.length / 3; i++) {
            const faceIndices = [indices[i * 3], indices[i * 3 + 1], indices[i * 3 + 2]];
            for (let j = 0; j < 3; j++) {
                const u = faceIndices[j];
                const v = faceIndices[(j + 1) % 3];
                const edgeKey = u < v ? `${u}-${v}` : `${v}-${u}`;

                if (!edgeToFaceMap.has(edgeKey)) {
                    edgeToFaceMap.set(edgeKey, []);
                }
                edgeToFaceMap.get(edgeKey).push(i);
            }
        }

        edgeToFaceMap.forEach(faces => {
            if (faces.length === 2) { // Shared edge
                const [f1, f2] = faces;
                if (!adjacency.has(f1)) adjacency.set(f1, []);
                if (!adjacency.has(f2)) adjacency.set(f2, []);
                adjacency.get(f1).push(f2);
                adjacency.get(f2).push(f1);
            }
        });

        return adjacency;
    }
}

// Export the class for use in other modules
export default SelectionManager;

