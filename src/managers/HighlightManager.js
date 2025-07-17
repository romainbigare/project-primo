/**
 * HighlightManager - Handles real-time highlighting of mesh faces under the cursor
 * Uses similar logic to SelectionManager for face detection but provides temporary visual feedback
 */
class HighlightManager {
    constructor(scene, BABYLON_LIB = null) {
        this.scene = scene
        this.BABYLON = BABYLON_LIB || window.BABYLON
        
        // Check if BABYLON is available
        if (!this.BABYLON) {
            throw new Error('BABYLON library is not available. Please ensure Babylon.js is loaded.')
        }
        
        // Create a separate highlight layer for hover effects
        this.hoverHighlightLayer = new this.BABYLON.HighlightLayer("hover-highlight-layer", this.scene)
        this.hoverHighlightLayer.innerGlow = false
        this.hoverHighlightLayer.outerGlow = true
        
        // Colors for different highlight types
        this.meshHoverColor = new this.BABYLON.Color3(0.2, 0.8, 1.0) // Light blue
        this.faceHoverColor = new this.BABYLON.Color3(1.0, 0.8, 0.2) // Orange
        this.materialAssignmentColor = new this.BABYLON.Color3(0.2, 1.0, 0.4) // Green
        
        // Current hover state
        this.currentHoveredMesh = null
        this.currentHoveredFace = null
        this.currentHighlightMesh = null
        this.lastPickInfo = null
        
        // Highlight modes
        this.modes = {
            NONE: 'none',
            MESH: 'mesh',           // Highlight entire mesh
            FACE: 'face',           // Highlight individual face
            PLANAR_SURFACE: 'planar-surface', // Highlight connected coplanar faces
            MATERIAL_ASSIGNMENT: 'material-assignment' // Special highlight for material assignment
        }
        
        this.currentMode = this.modes.NONE
        
        // Performance throttling
        this.lastUpdateTime = 0
        this.updateThrottle = 16 // ~60fps
        
        // Epsilon for floating point comparisons
        this.epsilon = 1e-5
        
        console.log('HighlightManager initialized')
    }
    
    /**
     * Set the highlight mode
     * @param {string} mode - The highlight mode to use
     */
    setMode(mode) {
        if (!Object.values(this.modes).includes(mode)) {
            console.warn(`Invalid highlight mode: ${mode}`)
            return
        }
        
        this.currentMode = mode
        this.clearHighlight()
        console.log(`HighlightManager mode set to: ${mode}`)
    }
    
    /**
     * Update highlight based on cursor position
     * @param {number} x - Canvas x coordinate
     * @param {number} y - Canvas y coordinate
     * @param {HTMLCanvasElement} canvas - The canvas element
     */
    updateHighlight(x, y, canvas) {
        // Throttle updates for performance
        const now = Date.now()
        if (now - this.lastUpdateTime < this.updateThrottle) {
            return
        }
        this.lastUpdateTime = now
        
        if (this.currentMode === this.modes.NONE) {
            return
        }
        
        // Pick geometry at cursor position
        const pickInfo = this.scene.pick(x, y, (mesh) => {
            return mesh.isPickable && mesh.name !== 'ground' && mesh.name !== 'skybox'
        })
        
        this.lastPickInfo = pickInfo
        
        if (pickInfo.hit && pickInfo.pickedMesh) {
            this.handleMeshHover(pickInfo)
        } else {
            this.clearHighlight()
        }
    }
    
    /**
     * Handle mouse hover over a mesh
     * @param {Object} pickInfo - Babylon.js pick info object
     */
    handleMeshHover(pickInfo) {
        const mesh = pickInfo.pickedMesh
        const faceId = pickInfo.faceId
        
        // Check if we're hovering over the same face
        if (this.currentHoveredMesh === mesh && this.currentHoveredFace === faceId) {
            return // No change needed
        }
        
        // Clear previous highlight
        this.clearHighlight()
        
        // Update current hover state
        this.currentHoveredMesh = mesh
        this.currentHoveredFace = faceId
        
        // Apply new highlight based on mode
        switch (this.currentMode) {
            case this.modes.MESH:
                this.highlightMesh(mesh)
                break
            case this.modes.FACE:
                this.highlightFace(mesh, faceId)
                break
            case this.modes.PLANAR_SURFACE:
                this.highlightPlanarSurface(mesh, faceId)
                break
            case this.modes.MATERIAL_ASSIGNMENT:
                // Always use connected faces for material assignment
                this.highlightConnectedFacesForMaterialAssignment(mesh, faceId)
                break
        }
    }
    
    /**
     * Highlight an entire mesh
     * @param {BABYLON.AbstractMesh} mesh - The mesh to highlight
     */
    highlightMesh(mesh) {
        try {
            this.hoverHighlightLayer.addMesh(mesh, this.meshHoverColor)
            this.currentHighlightMesh = mesh
        } catch (error) {
            console.error('Error highlighting mesh:', error)
        }
    }
    
    /**
     * Highlight a single face
     * @param {BABYLON.AbstractMesh} mesh - The parent mesh
     * @param {number} faceId - The face ID to highlight
     */
    highlightFace(mesh, faceId) {
        try {
            const faceMesh = this._createMeshFromFaces(mesh, [faceId])
            if (faceMesh) {
                this.hoverHighlightLayer.addMesh(faceMesh, this.faceHoverColor)
                this.currentHighlightMesh = faceMesh
            }
        } catch (error) {
            console.error('Error highlighting face:', error)
        }
    }
    
    /**
     * Highlight connected coplanar faces (planar surface)
     * @param {BABYLON.AbstractMesh} mesh - The parent mesh
     * @param {number} startFaceId - The starting face ID
     */
    highlightPlanarSurface(mesh, startFaceId) {
        try {
            const connectedFaces = this._findCoplanarConnectedFaces(mesh, startFaceId)
            const surfaceMesh = this._createMeshFromFaces(mesh, Array.from(connectedFaces))
            if (surfaceMesh) {
                this.hoverHighlightLayer.addMesh(surfaceMesh, this.faceHoverColor)
                this.currentHighlightMesh = surfaceMesh
            }
        } catch (error) {
            console.error('Error highlighting planar surface:', error)
        }
    }
    
    /**
     * Highlight connected faces for material assignment
     * @param {BABYLON.AbstractMesh} mesh - The mesh to highlight
     * @param {number} faceId - The starting face ID
     */
    highlightConnectedFacesForMaterialAssignment(mesh, faceId) {
        try {
            const connectedFaces = this._findCoplanarConnectedFaces(mesh, faceId)
            const surfaceMesh = this._createMeshFromFaces(mesh, Array.from(connectedFaces))
            if (surfaceMesh) {
                this.hoverHighlightLayer.addMesh(surfaceMesh, this.materialAssignmentColor)
                this.currentHighlightMesh = surfaceMesh
            }
        } catch (error) {
            console.error('Error highlighting connected faces for material assignment:', error)
        }
    }

    /**
     * Set material assignment mode (always uses connected faces)
     */
    setMaterialAssignmentMode() {
        this.setMode(this.modes.MATERIAL_ASSIGNMENT)
        console.log('Material assignment mode set to: connected-faces')
    }

    /**
     * Get information about the currently highlighted geometry for material assignment
     * @returns {Object} Object containing mesh, faceId, and assignment info
     */
    getMaterialAssignmentInfo() {
        return {
            mesh: this.currentHoveredMesh,
            faceId: this.currentHoveredFace,
            mode: 'connected-faces',
            pickInfo: this.lastPickInfo,
            // Always return connected faces for material assignment
            connectedFaces: this.currentHoveredMesh && this.currentHoveredFace !== null
                ? this._findCoplanarConnectedFaces(this.currentHoveredMesh, this.currentHoveredFace)
                : null
        }
    }
    
    /**
     * Clear all highlights
     */
    clearHighlight() {
        try {
            this.hoverHighlightLayer.removeAllMeshes()
            
            // Dispose of temporary meshes
            if (this.currentHighlightMesh && this.currentHighlightMesh !== this.currentHoveredMesh) {
                if (this.currentHighlightMesh.dispose) {
                    this.currentHighlightMesh.dispose()
                }
            }
            
            this.currentHoveredMesh = null
            this.currentHoveredFace = null
            this.currentHighlightMesh = null
        } catch (error) {
            console.error('Error clearing highlight:', error)
        }
    }
    
    /**
     * Get the currently hovered mesh and face info
     * @returns {Object} Object containing mesh and faceId
     */
    getCurrentHover() {
        return {
            mesh: this.currentHoveredMesh,
            faceId: this.currentHoveredFace,
            pickInfo: this.lastPickInfo
        }
    }
    
    /**
     * Set custom highlight color for current mode
     * @param {BABYLON.Color3} color - The color to use
     */
    setHighlightColor(color) {
        switch (this.currentMode) {
            case this.modes.MESH:
                this.meshHoverColor = color
                break
            case this.modes.FACE:
            case this.modes.PLANAR_SURFACE:
                this.faceHoverColor = color
                break
            case this.modes.MATERIAL_ASSIGNMENT:
                this.materialAssignmentColor = color
                break
        }
    }
    
    // ===== MESH ANALYSIS METHODS (adapted from SelectionManager) =====
    
    /**
     * Create a mesh from specific faces of a parent mesh
     * @param {BABYLON.AbstractMesh} parentMesh - The parent mesh
     * @param {number[]} faceIds - Array of face IDs to create mesh from
     * @returns {BABYLON.Mesh} The created mesh
     */
    _createMeshFromFaces(parentMesh, faceIds) {
        try {
            const indices = parentMesh.getIndices()
            const positions = parentMesh.getVerticesData(this.BABYLON.VertexBuffer.PositionKind)
            const normals = parentMesh.getVerticesData(this.BABYLON.VertexBuffer.NormalKind)
            
            if (!indices || !positions) return null
            
            const newIndices = []
            const newPositions = []
            const newNormals = []
            const vertexMap = new Map()
            let vertexIndex = 0
            
            for (const faceId of faceIds) {
                const baseIndex = faceId * 3
                
                for (let i = 0; i < 3; i++) {
                    const originalVertexIndex = indices[baseIndex + i]
                    const positionIndex = originalVertexIndex * 3
                    
                    // Create a unique key for this vertex position
                    const vertexKey = `${positions[positionIndex]}_${positions[positionIndex + 1]}_${positions[positionIndex + 2]}`
                    
                    let newVertexIndex
                    if (vertexMap.has(vertexKey)) {
                        newVertexIndex = vertexMap.get(vertexKey)
                    } else {
                        newVertexIndex = vertexIndex++
                        vertexMap.set(vertexKey, newVertexIndex)
                        
                        // Add vertex position
                        newPositions.push(
                            positions[positionIndex],
                            positions[positionIndex + 1],
                            positions[positionIndex + 2]
                        )
                        
                        // Add vertex normal if available
                        if (normals) {
                            const normalIndex = originalVertexIndex * 3
                            newNormals.push(
                                normals[normalIndex],
                                normals[normalIndex + 1],
                                normals[normalIndex + 2]
                            )
                        }
                    }
                    
                    newIndices.push(newVertexIndex)
                }
            }
            
            // Create the new mesh
            const mesh = new this.BABYLON.Mesh(`highlight_${Date.now()}`, this.scene)
            
            const vertexData = new this.BABYLON.VertexData()
            vertexData.positions = newPositions
            vertexData.indices = newIndices
            if (newNormals.length > 0) {
                vertexData.normals = newNormals
            } else {
                vertexData.normals = this.BABYLON.VertexData.ComputeNormals(newPositions, newIndices)
            }
            
            vertexData.applyToMesh(mesh)
            
            // Copy transform from parent
            // Set the transform of the new mesh to match the parent's final world transform
            mesh.setPreTransformMatrix(parentMesh.getWorldMatrix());
            
            return mesh
        } catch (error) {
            console.error('Error creating mesh from faces:', error)
            return null
        }
    }
    
    /**
     * Find all coplanar connected faces starting from a given face
     * @param {BABYLON.AbstractMesh} mesh - The mesh to analyze
     * @param {number} startFaceId - The starting face ID
     * @returns {Set<number>} Set of connected coplanar face IDs
     */
    _findCoplanarConnectedFaces(mesh, startFaceId) {
        const indices = mesh.getIndices()
        const positions = mesh.getVerticesData(this.BABYLON.VertexBuffer.PositionKind)
        if (!indices || !positions) return new Set([startFaceId])
        
        // Get the reference plane from the starting face
        const startFaceIndices = [
            indices[startFaceId * 3], 
            indices[startFaceId * 3 + 1], 
            indices[startFaceId * 3 + 2]
        ]
        const startFaceVertices = startFaceIndices.map(index => 
            this.BABYLON.Vector3.FromArray(positions, index * 3)
        )
        const referencePlane = this.BABYLON.Plane.FromPoints(
            startFaceVertices[0], 
            startFaceVertices[1], 
            startFaceVertices[2]
        )
        
        // Get face adjacency and prepare for search
        const adjacency = this._buildAdjacencyList(mesh)
        const coplanarFaces = new Set()
        const queue = [startFaceId]
        const visited = new Set([startFaceId])
        
        // Perform BFS to find all matching faces
        while (queue.length > 0) {
            const currentFaceId = queue.shift()
            coplanarFaces.add(currentFaceId)
            
            const neighbors = adjacency.get(currentFaceId) || []
            for (const neighborFaceId of neighbors) {
                if (visited.has(neighborFaceId)) continue
                visited.add(neighborFaceId)
                
                // Check if the neighbor is co-planar
                const neighborFaceIndices = [
                    indices[neighborFaceId * 3], 
                    indices[neighborFaceId * 3 + 1], 
                    indices[neighborFaceId * 3 + 2]
                ]
                const neighborVertices = neighborFaceIndices.map(index => 
                    this.BABYLON.Vector3.FromArray(positions, index * 3)
                )
                const neighborNormal = this.BABYLON.Plane.FromPoints(
                    neighborVertices[0], 
                    neighborVertices[1], 
                    neighborVertices[2]
                ).normal
                
                // Check if normals are parallel and a point from the neighbor triangle lies on the reference plane
                const isNormalAligned = Math.abs(this.BABYLON.Vector3.Dot(referencePlane.normal, neighborNormal)) > (1 - this.epsilon)
                const isPointOnPlane = Math.abs(referencePlane.signedDistanceTo(neighborVertices[0])) < this.epsilon
                
                if (isNormalAligned && isPointOnPlane) {
                    queue.push(neighborFaceId)
                }
            }
        }
        
        return coplanarFaces
    }
    
    /**
     * Build adjacency list for mesh faces
     * @param {BABYLON.AbstractMesh} mesh - The mesh to analyze
     * @returns {Map<number, number[]>} Map of face ID to adjacent face IDs
     */
    _buildAdjacencyList(mesh) {
        const indices = mesh.getIndices()
        if (!indices) return new Map()
        
        const adjacency = new Map()
        const edgeToFace = new Map()
        
        const faceCount = indices.length / 3
        
        for (let faceId = 0; faceId < faceCount; faceId++) {
            const faceIndices = [
                indices[faceId * 3],
                indices[faceId * 3 + 1],
                indices[faceId * 3 + 2]
            ]
            
            // Create edges for this face
            const edges = [
                [faceIndices[0], faceIndices[1]],
                [faceIndices[1], faceIndices[2]],
                [faceIndices[2], faceIndices[0]]
            ]
            
            for (const [v1, v2] of edges) {
                // Create edge key (smaller vertex index first for consistency)
                const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`
                
                if (edgeToFace.has(edgeKey)) {
                    // This edge is shared with another face
                    const otherFaceId = edgeToFace.get(edgeKey)
                    
                    // Add to adjacency list
                    if (!adjacency.has(faceId)) adjacency.set(faceId, [])
                    if (!adjacency.has(otherFaceId)) adjacency.set(otherFaceId, [])
                    
                    adjacency.get(faceId).push(otherFaceId)
                    adjacency.get(otherFaceId).push(faceId)
                } else {
                    // First time seeing this edge
                    edgeToFace.set(edgeKey, faceId)
                }
            }
        }
        
        return adjacency
    }
    
    /**
     * Dispose of the HighlightManager and clean up resources
     */
    dispose() {
        try {
            this.clearHighlight()
            
            if (this.hoverHighlightLayer) {
                this.hoverHighlightLayer.dispose()
                this.hoverHighlightLayer = null
            }
            
            this.currentHoveredMesh = null
            this.currentHoveredFace = null
            this.currentHighlightMesh = null
            this.lastPickInfo = null
            
            console.log('HighlightManager disposed')
        } catch (error) {
            console.error('Error disposing HighlightManager:', error)
        }
    }
}

// Export the class for use in other modules
export default HighlightManager
