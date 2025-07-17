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
        this.highlightLayer.innerGlow = true;
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
        const canvasRect = canvas.getBoundingClientRect();
        const x = event.clientX - canvasRect.left;
        const y = event.clientY - canvasRect.top;

        // Capture the modifier key states AT THE TIME OF THE CLICK
        const shiftPressed = event.shiftKey;
        const multiSelectPressed = event.ctrlKey || event.metaKey; // Handles Ctrl on Win and Cmd on Mac

        const pickInfo = this.scene.pick(x, y, (mesh) => mesh.isPickable && mesh.name !== 'ground');
        
        if (pickInfo.hit) {
            event.preventDefault();
            event.stopPropagation();
            
            this.clickCount++;
            
            if (this.clickTimer) {
                clearTimeout(this.clickTimer);
            }
            
            this.clickTimer = setTimeout(() => {
                // Pass the captured key states to the processing function
                this.processSelection(pickInfo, this.clickCount, shiftPressed, multiSelectPressed);
                this.clickCount = 0;
            }, this.CLICK_DELAY);

        } else if (!multiSelectPressed && !shiftPressed) {
            // Only clear if clicking on nothing WITHOUT a modifier key
            this.clear();
            if (this.onSelectionChanged) {
                this.onSelectionChanged(null); // Notify that selection is empty
            }
        }
    }

    processSelection(pickInfo, clicks, shiftPressed, multiSelectPressed) {
        try {
            // Only clear the selection if NOT in a multi-select mode.
            // This is the key to adding/removing from a selection.
            if (!shiftPressed && !multiSelectPressed) {
                this.clear();
            }

            const mesh = pickInfo.pickedMesh;
            const faceId = pickInfo.faceId;
            
            // Now you can adapt your logic based on the keys
            // For example, to toggle a mesh's selection on double-click with Ctrl/Cmd:
            if (clicks === 2 && multiSelectPressed) {
                this.toggleMesh(mesh); // Your existing toggle function is perfect here
            } else {
                // Fallback to your original selection logic
                switch (clicks) {
                    case 1:
                        // You might want to add logic here to add/remove faces
                        // from a selection instead of replacing.
                        this.selectPlanarSurface(mesh, faceId);
                        break;
                    case 2:
                        // Clear any sub-mesh selections for this mesh before selecting the full mesh
                        this._clearSubMeshSelectionsForMesh(mesh);
                        this.addMesh(mesh);
                        break;
                    case 3:
                        const root = this._getAssetRoot(mesh);
                        // Clear any sub-mesh selections for all meshes in the hierarchy
                        root.getChildMeshes(false).forEach(child => {
                            this._clearSubMeshSelectionsForMesh(child);
                            this.addMesh(child);
                        });
                        if (root instanceof this.BABYLON.Mesh) {
                            this._clearSubMeshSelectionsForMesh(root);
                            this.addMesh(root);
                        }
                        break;
                }
            }
            
            // Trigger selection changed callback
            if (this.onSelectionChanged) {
                this.onSelectionChanged({
                    selectedMeshes: Array.from(this.selectedMeshes),
                    selectedSubMeshes: this.selectedSubMeshes,
                    clickCount: clickCount
                });
            }
        } catch (error) {
            console.error('Error in processSelection:', error);
        }
    }

    setSelectionChangedCallback(callback) {
        this.onSelectionChanged = callback
    }

    _triggerSelectionChanged() {
        if (this.onSelectionChanged) {
            this.onSelectionChanged({
                selectedMeshes: Array.from(this.selectedMeshes),
                selectedSubMeshes: this.selectedSubMeshes
            });
        }
    }

    addMesh(mesh) {
        if (!this.selectedMeshes.has(mesh)) {
            this.selectedMeshes.add(mesh);
            this.highlightLayer.addMesh(mesh, this.meshHighlightColor);
            this._triggerSelectionChanged();
        }
    }

    highlightMesh(mesh) {
        if (mesh && !this.selectedMeshes.has(mesh)) {
            this.highlightLayer.addMesh(mesh, this.meshHighlightColor);
        }
    }

    clearHighlights() {
        this.highlightLayer.removeAllMeshes();
        this.selectedMeshes.clear();
        this.selectedSubMeshes.clear();
        this._triggerSelectionChanged();
    }
    
    removeMesh(mesh) {
        if (this.selectedMeshes.has(mesh)) {
            this.selectedMeshes.delete(mesh);
            this.highlightLayer.removeMesh(mesh);
            this._triggerSelectionChanged();
        }
    }

    toggleMesh(mesh) {
        if (this.selectedMeshes.has(mesh)) {
            this.removeMesh(mesh);
        } else {
            this.addMesh(mesh);
        }
    }

    selectFace(mesh, faceId) {
        try {
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
     * Selects a full planar surface starting from a single picked face.
     * @param {BABYLON.AbstractMesh} mesh The parent mesh.
     * @param {number} startFaceId The face ID that was picked.
     */
    selectPlanarSurface(mesh, startFaceId) {
        try {
            // Find all connected co-planar faces
            const connectedFaces = this._findCoplanarConnectedFaces(mesh, startFaceId);
            
            // Create a single mesh to highlight the entire surface
            const componentMesh = this._createMeshFromFaces(mesh, Array.from(connectedFaces));

            if (componentMesh) {
                this.selectedSubMeshes.set('surface_' + startFaceId, { parent: mesh, visual: componentMesh });
                this.highlightLayer.addMesh(componentMesh, this.faceHighlightColor); // Or use a dedicated surface color
            }
        } catch (error) {
            console.error('Error selecting planar surface:', error);
        }
    }

    selectConnectedComponent(mesh, startFaceId) {
        try {
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

    getSelectionData() {
        return {
            selectedMeshes: Array.from(this.selectedMeshes),
            selectedSubMeshes: Array.from(this.selectedSubMeshes.keys())
        }
    }

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
    /**
     * Finds the top-level ancestor of a mesh.
     * @param {BABYLON.AbstractMesh} mesh The starting mesh.
     * @returns {BABYLON.Node} The highest-level parent.
     */
    _getAssetRoot(mesh) {
        let current = mesh;
        // Traverse up the hierarchy until there is no parent
        while (current.parent) {
            current = current.parent;
        }
        return current;
    }

    /**
     * Clears any sub-mesh selections (faces, surfaces, components) for a specific mesh.
     * @param {BABYLON.AbstractMesh} mesh The mesh to clear sub-selections for.
     */
    _clearSubMeshSelectionsForMesh(mesh) {
        const keysToRemove = [];
        
        // Find all sub-mesh selections that belong to this mesh
        this.selectedSubMeshes.forEach((subMeshData, key) => {
            if (subMeshData.parent === mesh) {
                keysToRemove.push(key);
                // Remove from highlight layer and dispose visual mesh
                if (subMeshData.visual) {
                    this.highlightLayer.removeMesh(subMeshData.visual);
                    if (subMeshData.visual.dispose) {
                        subMeshData.visual.dispose();
                    }
                }
            }
        });
        
        // Remove the keys from the map
        keysToRemove.forEach(key => {
            this.selectedSubMeshes.delete(key);
        });
    }

    _createFaceMesh(sourceMesh, faceId) {
        try {
            const positions = sourceMesh.getVerticesData(this.BABYLON.VertexBuffer.PositionKind);
            const indices = sourceMesh.getIndices();
            if (!positions || !indices || (faceId * 3 + 2 >= indices.length)) {
                console.warn('Invalid mesh data or faceId for face selection.');
                return null;
            }

            const worldMatrix = sourceMesh.getWorldMatrix();
            const facePositions = [];

            // Get the three vertices of the face
            for (let i = 0; i < 3; i++) {
                const index = indices[faceId * 3 + i];
                const localPos = new this.BABYLON.Vector3(
                    positions[index * 3], 
                    positions[index * 3 + 1], 
                    positions[index * 3 + 2]
                );
                // Transform local vertex position to world position
                const worldPos = this.BABYLON.Vector3.TransformCoordinates(localPos, worldMatrix);
                facePositions.push(worldPos.x, worldPos.y, worldPos.z);
            }

            const customMesh = new this.BABYLON.Mesh("faceHighlight_" + faceId, this.scene);
            const vertexData = new this.BABYLON.VertexData();
            vertexData.positions = facePositions;
            vertexData.indices = [0, 1, 2];
            vertexData.applyToMesh(customMesh);

            // Since vertices are now in world space, the highlight mesh itself has no transformation
            customMesh.position = this.BABYLON.Vector3.Zero();
            customMesh.rotationQuaternion = this.BABYLON.Quaternion.Identity();
            customMesh.scaling = new this.BABYLON.Vector3(1, 1, 1);
            
            customMesh.isPickable = false;
            
            // Use a single, transparent material for all highlight meshes to be efficient
            if (!this.dummyMaterial) {
                this.dummyMaterial = new this.BABYLON.StandardMaterial("dummyMat", this.scene);
                this.dummyMaterial.alpha = 0.0;
            }
            customMesh.material = this.dummyMaterial;

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

        const worldMatrix = sourceMesh.getWorldMatrix();
        const newPositions = [];
        const newIndices = [];
        const vertexMap = new Map();
        let newIndexCounter = 0;

        faceIds.forEach(faceId => {
            for (let i = 0; i < 3; i++) {
                const originalIndex = indices[faceId * 3 + i];
                
                if (!vertexMap.has(originalIndex)) {
                    vertexMap.set(originalIndex, newIndexCounter);
                    
                    const localPos = new this.BABYLON.Vector3(
                        positions[originalIndex * 3],
                        positions[originalIndex * 3 + 1],
                        positions[originalIndex * 3 + 2]
                    );
                    // Transform to world space
                    const worldPos = this.BABYLON.Vector3.TransformCoordinates(localPos, worldMatrix);
                    
                    newPositions.push(worldPos.x, worldPos.y, worldPos.z);
                    newIndexCounter++;
                }
                newIndices.push(vertexMap.get(originalIndex));
            }
        });
        
        const customMesh = new this.BABYLON.Mesh("componentHighlight", this.scene);
        const vertexData = new this.BABYLON.VertexData();
        vertexData.positions = newPositions;
        vertexData.indices = newIndices;
        vertexData.applyToMesh(customMesh);

        // Mesh is at origin since vertices are in world space
        customMesh.position = this.BABYLON.Vector3.Zero();
        customMesh.rotationQuaternion = this.BABYLON.Quaternion.Identity();
        customMesh.scaling = new this.BABYLON.Vector3(1, 1, 1);
        
        customMesh.isPickable = false;
        
        // Reuse the dummy material
        if (!this.dummyMaterial) {
            this.dummyMaterial = new this.BABYLON.StandardMaterial("dummyMat", this.scene);
            this.dummyMaterial.alpha = 0.0;
        }
        customMesh.material = this.dummyMaterial;

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

    /**
 * Finds all faces in a mesh that are connected to a starting face and are co-planar with it.
 * @param {BABYLON.AbstractMesh} mesh The mesh to search within.
 * @param {number} startFaceId The index of the starting face.
 * @returns {Set<number>} A set of face IDs that are connected and co-planar.
 */
_findCoplanarConnectedFaces(mesh, startFaceId) {
    const indices = mesh.getIndices();
    const positions = mesh.getVerticesData(this.BABYLON.VertexBuffer.PositionKind);
    if (!indices || !positions) return new Set([startFaceId]);

    // --- 1. Get the reference plane from the starting face ---
    const startFaceIndices = [indices[startFaceId * 3], indices[startFaceId * 3 + 1], indices[startFaceId * 3 + 2]];
    const startFaceVertices = startFaceIndices.map(index => this.BABYLON.Vector3.FromArray(positions, index * 3));
    const referencePlane = this.BABYLON.Plane.FromPoints(startFaceVertices[0], startFaceVertices[1], startFaceVertices[2]);
    
    // --- 2. Get face adjacency and prepare for search ---
    const adjacency = this._buildAdjacencyList(mesh);
    const coplanarFaces = new Set();
    const queue = [startFaceId];
    const visited = new Set([startFaceId]);
    const epsilon = 1e-5; // Tolerance for floating point comparisons

    // --- 3. Perform BFS to find all matching faces ---
    while (queue.length > 0) {
        const currentFaceId = queue.shift();
        coplanarFaces.add(currentFaceId);

        const neighbors = adjacency.get(currentFaceId) || [];
        for (const neighborFaceId of neighbors) {
            if (visited.has(neighborFaceId)) continue;
            visited.add(neighborFaceId);
            
            // --- 4. Check if the neighbor is co-planar ---
            const neighborFaceIndices = [indices[neighborFaceId * 3], indices[neighborFaceId * 3 + 1], indices[neighborFaceId * 3 + 2]];
            const neighborVertices = neighborFaceIndices.map(index => this.BABYLON.Vector3.FromArray(positions, index * 3));
            const neighborNormal = this.BABYLON.Plane.FromPoints(neighborVertices[0], neighborVertices[1], neighborVertices[2]).normal;

            // Check if normals are parallel and a point from the neighbor triangle lies on the reference plane
            const isNormalAligned = Math.abs(this.BABYLON.Vector3.Dot(referencePlane.normal, neighborNormal)) > (1 - epsilon);
            const isPointOnPlane = Math.abs(referencePlane.signedDistanceTo(neighborVertices[0])) < epsilon;

            if (isNormalAligned && isPointOnPlane) {
                queue.push(neighborFaceId);
            }
        }
    }
    return coplanarFaces;
}
}

// Export the class for use in other modules
export default SelectionManager;

