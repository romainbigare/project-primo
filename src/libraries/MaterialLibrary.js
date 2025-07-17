/**
 * MaterialLibrary - Advanced Material Management for Babylon.js
 * 
 * This library provides sophisticated material management capabilities including:
 * - Predefined PBR materials (metals, woods, stones, glass, plastics)
 * - Custom material loading and management
 * - Face-based material assignment using Babylon.js MultiMaterial approach
 * 
 * FACE-BASED MATERIAL ASSIGNMENT:
 * This library uses Babylon.js's MultiMaterial system for applying different materials
 * to different faces of a mesh. This approach:
 * - Creates a single MultiMaterial containing all used materials as sub-materials
 * - Uses SubMesh objects to assign material indices to specific face groups
 * - Maintains optimal performance by avoiding mesh duplication
 * - Follows Babylon.js best practices for multi-material meshes
 * 
 * The process works as follows:
 * 1. When applying a material to faces, a MultiMaterial is created/updated
 * 2. The target material is added to the MultiMaterial.subMaterials array
 * 3. Connected coplanar faces are identified
 * 4. A SubMesh is created for these faces with the correct material index
 * 5. Face-to-material mappings are stored for future reference
 * 
 * USAGE EXAMPLE:
 * ```javascript
 * // Initialize the library
 * const materialLib = new MaterialLibrary(scene, BABYLON);
 * await materialLib.waitForInitialization();
 * 
 * // Apply materials to specific faces
 * const success = materialLib.applyMaterialToFaces('redBrick', mesh, faceId);
 * 
 * // Check what material is applied to a face
 * const faceMaterial = materialLib.getFaceMaterial(mesh, faceId);
 * 
 * // Remove materials from faces
 * materialLib.removeFaceMaterials(mesh, [faceId1, faceId2]);
 * 
 * // Clear all face materials
 * materialLib.clearAllFaceMaterials(mesh);
 * ```
 */
export class MaterialLibrary {
    constructor(scene, BABYLON_LIB = null) {
        this.scene = scene
        this.BABYLON = BABYLON_LIB || window.BABYLON
        
        if (!this.BABYLON) {
            throw new Error('BABYLON library is required. Please pass it as the second parameter.')
        }
        
        this.materials = new Map()
        this.customMaterialClasses = new Map()
        this.isInitialized = false
        this.initializeAsync()
    }

    async initializeAsync() {
        await this.initializeMaterials()
        this.isInitialized = true
    }

    async waitForInitialization() {
        if (this.isInitialized) return
        
        return new Promise((resolve) => {
            const checkInitialized = () => {
                if (this.isInitialized) {
                    resolve()
                } else {
                    setTimeout(checkInitialized, 10)
                }
            }
            checkInitialized()
        })
    }

    async initializeMaterials() {
        // Load custom materials first
        await this.loadCustomMaterials()
        
        // Basic materials
        this.createBasicMaterials()
        
        // Metal materials
        this.createMetalMaterials()
        
        // Wood materials
        this.createWoodMaterials()
        
        // Stone materials
        this.createStoneMaterials()
        
        // Glass materials
        this.createGlassMaterials()
        
        // Plastic materials
        this.createPlasticMaterials()
    }

    async loadCustomMaterials() {
        try {
            // Load LineMaterial
            const { LineMaterial } = await import('../assets/materials/lineMaterial.js')
            this.customMaterialClasses.set('LineMaterial', LineMaterial)
            
            // Create an instance of LineMaterial
            const lineMaterial = new LineMaterial('lineMaterial', this.scene)
            
            // You can set up a default paper texture here if you have one
            // lineMaterial.paperTexture = someTexture
            
            this.materials.set('lineMaterial', {
                material: lineMaterial,
                name: 'Line Material',
                category: 'Custom',
                description: 'Artistic line drawing effect'
            })
            
            // Add more custom materials here as you create them
            // Example:
            // const { YourCustomMaterial } = await import('./yourCustomMaterial.js')
            // this.customMaterialClasses.set('YourCustomMaterial', YourCustomMaterial)
            // const yourMaterial = new YourCustomMaterial('yourMaterial', this.scene)
            // this.materials.set('yourMaterial', {
            //     material: yourMaterial,
            //     name: 'Your Custom Material',
            //     category: 'Custom',
            //     description: 'Description of your material'
            // })
            
        } catch (error) {
            console.warn('Some custom materials could not be loaded:', error)
        }
    }

    // Method to dynamically add custom materials
    addCustomMaterial(materialInstance, materialData) {
        if (!materialInstance || !materialData) {
            console.error('Invalid material instance or data provided')
            return false
        }
        
        const key = materialData.key || materialInstance.name
        this.materials.set(key, {
            material: materialInstance,
            name: materialData.name || materialInstance.name,
            category: materialData.category || 'Custom',
            description: materialData.description || ''
        })
        
        return true
    }

    // Method to load a custom material from a file path
    async loadCustomMaterialFromFile(filePath, materialName, materialData) {
        try {
            const module = await import(filePath)
            const MaterialClass = module[materialName] || module.default
            
            if (!MaterialClass) {
                throw new Error(`Material class ${materialName} not found in ${filePath}`)
            }
            
            this.customMaterialClasses.set(materialName, MaterialClass)
            const materialInstance = new MaterialClass(materialData.key || materialName, this.scene)
            
            return this.addCustomMaterial(materialInstance, materialData)
        } catch (error) {
            console.error(`Failed to load custom material from ${filePath}:`, error)
            return false
        }
    }

    // Helper method to create a properly configured PBR material
    createPBRMaterial(name, baseColor, metallicFactor = 0.0, roughnessFactor = 0.5, alpha = 1.0) {
        const material = new this.BABYLON.PBRMaterial(name, this.scene)
        
        // Set base color using both properties for compatibility
        material.baseColor = baseColor.clone()
        material.albedoColor = baseColor.clone()
        
        // Material properties
        material.metallicFactor = metallicFactor
        material.roughnessFactor = roughnessFactor
        material.alpha = alpha
        
        // Lighting setup
        material.environmentIntensity = 1.0
        material.directIntensity = 1.0
        material.emissiveIntensity = 0.0
        material.specularIntensity = 1.0
        
        // Rendering properties
        material.backFaceCulling = true
        
        // Handle transparency if alpha < 1
        if (alpha < 1.0) {
            material.transparencyMode = this.BABYLON.Material.MATERIAL_ALPHABLEND
        }
        
        return material
    }

    createBasicMaterials() {
        // White Concrete
        const whiteConcrete = this.createPBRMaterial('whiteConcrete', new this.BABYLON.Color3(0.9, 0.9, 0.9), 0.0, 0.8)
        this.materials.set('whiteConcrete', {
            material: whiteConcrete,
            name: 'White Concrete',
            category: 'Basic',
            description: 'Clean white concrete finish'
        })

        // Red Brick
        const redBrick = this.createPBRMaterial('redBrick', new this.BABYLON.Color3(0.7, 0.3, 0.2), 0.0, 0.9)
        this.materials.set('redBrick', {
            material: redBrick,
            name: 'Red Brick',
            category: 'Basic',
            description: 'Traditional red brick'
        })

        // Dark Asphalt
        const darkAsphalt = this.createPBRMaterial('darkAsphalt', new this.BABYLON.Color3(0.15, 0.15, 0.15), 0.0, 0.95)
        this.materials.set('darkAsphalt', {
            material: darkAsphalt,
            name: 'Dark Asphalt',
            category: 'Basic',
            description: 'Road surface material'
        })
    }

    createMetalMaterials() {
        // Brushed Steel
        const brushedSteel = this.createPBRMaterial('brushedSteel', new this.BABYLON.Color3(0.7, 0.7, 0.7), 1.0, 0.3)
        this.materials.set('brushedSteel', {
            material: brushedSteel,
            name: 'Brushed Steel',
            category: 'Metal',
            description: 'Industrial steel finish'
        })

        // Copper
        const copper = this.createPBRMaterial('copper', new this.BABYLON.Color3(0.95, 0.64, 0.54), 1.0, 0.2)
        this.materials.set('copper', {
            material: copper,
            name: 'Copper',
            category: 'Metal',
            description: 'Polished copper'
        })

        // Gold
        const gold = this.createPBRMaterial('gold', new this.BABYLON.Color3(1.0, 0.86, 0.57), 1.0, 0.1)
        this.materials.set('gold', {
            material: gold,
            name: 'Gold',
            category: 'Metal',
            description: 'Shiny gold finish'
        })
    }

    createWoodMaterials() {
        // Light Oak
        const lightOak = this.createPBRMaterial('lightOak', new this.BABYLON.Color3(0.8, 0.6, 0.4), 0.0, 0.7)
        this.materials.set('lightOak', {
            material: lightOak,
            name: 'Light Oak',
            category: 'Wood',
            description: 'Natural oak wood'
        })

        // Dark Walnut
        const darkWalnut = this.createPBRMaterial('darkWalnut', new this.BABYLON.Color3(0.4, 0.25, 0.15), 0.0, 0.6)
        this.materials.set('darkWalnut', {
            material: darkWalnut,
            name: 'Dark Walnut',
            category: 'Wood',
            description: 'Rich walnut wood'
        })
    }

    createStoneMaterials() {
        // Marble
        const marble = this.createPBRMaterial('marble', new this.BABYLON.Color3(0.95, 0.95, 0.95), 0.0, 0.1)
        this.materials.set('marble', {
            material: marble,
            name: 'White Marble',
            category: 'Stone',
            description: 'Polished marble'
        })

        // Granite
        const granite = this.createPBRMaterial('granite', new this.BABYLON.Color3(0.3, 0.3, 0.35), 0.0, 0.4)
        this.materials.set('granite', {
            material: granite,
            name: 'Granite',
            category: 'Stone',
            description: 'Speckled granite'
        })
    }

    createGlassMaterials() {
        // Clear Glass
        const clearGlass = this.createPBRMaterial('clearGlass', new this.BABYLON.Color3(0.9, 0.9, 0.9), 0.0, 0.0, 0.3)
        this.materials.set('clearGlass', {
            material: clearGlass,
            name: 'Clear Glass',
            category: 'Glass',
            description: 'Transparent glass'
        })

        // Blue Glass
        const blueGlass = this.createPBRMaterial('blueGlass', new this.BABYLON.Color3(0.3, 0.6, 0.9), 0.0, 0.0, 0.4)
        this.materials.set('blueGlass', {
            material: blueGlass,
            name: 'Blue Glass',
            category: 'Glass',
            description: 'Tinted blue glass'
        })
    }

    createPlasticMaterials() {
        // Red Plastic
        const redPlastic = this.createPBRMaterial('redPlastic', new this.BABYLON.Color3(0.8, 0.2, 0.2), 0.0, 0.4)
        this.materials.set('redPlastic', {
            material: redPlastic,
            name: 'Red Plastic',
            category: 'Plastic',
            description: 'Glossy red plastic'
        })

        // Blue Plastic
        const bluePlastic = this.createPBRMaterial('bluePlastic', new this.BABYLON.Color3(0.2, 0.4, 0.8), 0.0, 0.3)
        this.materials.set('bluePlastic', {
            material: bluePlastic,
            name: 'Blue Plastic',
            category: 'Plastic',
            description: 'Shiny blue plastic'
        })

        // Green Plastic
        const greenPlastic = this.createPBRMaterial('greenPlastic', new this.BABYLON.Color3(0.2, 0.7, 0.3), 0.0, 0.35)
        this.materials.set('greenPlastic', {
            material: greenPlastic,
            name: 'Green Plastic',
            category: 'Plastic',
            description: 'Vibrant green plastic'
        })
    }

    getMaterial(name) {
        return this.materials.get(name)
    }

    getAllMaterials() {
        return Array.from(this.materials.values())
    }

    getMaterialsByCategory(category) {
        return Array.from(this.materials.values()).filter(mat => mat.category === category)
    }

    getCategories() {
        return [...new Set(Array.from(this.materials.values()).map(mat => mat.category))]
    }

    /**
     * Apply material to connected coplanar faces using MultiMaterial approach
     * @param {string} materialName - The name of the material to apply
     * @param {BABYLON.AbstractMesh} mesh - The mesh to apply material to
     * @param {number} startFaceId - The starting face ID to find connected faces
     * @returns {boolean} Success status
     */
    applyMaterialToFaces(materialName, mesh, startFaceId) {
        const materialData = this.materials.get(materialName)
        if (!materialData || !mesh || startFaceId === undefined) {
            return false
        }

        try {
            // Find all connected coplanar faces
            const connectedFaces = this._findCoplanarConnectedFaces(mesh, startFaceId)
            
            if (connectedFaces.size === 0) {
                return false
            }

            // Initialize MultiMaterial if not already present
            if (!this._initializeMultiMaterial(mesh)) {
                console.warn(`Failed to initialize MultiMaterial for mesh "${mesh.name}"`)
                return false
            }

            // Get or create material index in MultiMaterial
            const materialIndex = this._getMaterialIndexInMultiMaterial(mesh, materialName)
            if (materialIndex === -1) {
                console.warn(`Material "${materialName}" could not be added to MultiMaterial for mesh "${mesh.name}"`)
                return false
            }

            // Create or update sub-meshes for the connected faces
            this._createSubMeshForFaces(mesh, Array.from(connectedFaces), materialIndex)

            // Store face material mapping
            if (!mesh._faceMaterials) {
                mesh._faceMaterials = new Map()
            }
            
            Array.from(connectedFaces).forEach(faceId => {
                mesh._faceMaterials.set(faceId, materialName)
            })

            return true
        } catch (error) {
            console.error('Error applying material to faces:', error)
            return false
        }
    }

    /**
     * Get material information for a specific face
     * @param {BABYLON.AbstractMesh} mesh - The mesh to check
     * @param {number} faceId - The face ID to check
     * @returns {Object|null} Material information or null if no custom material
     */
    getFaceMaterial(mesh, faceId) {
        if (!mesh._faceMaterials) {
            return null
        }

        const materialName = mesh._faceMaterials.get(faceId)
        return materialName ? { materialName } : null
    }

    /**
     * Remove face-specific material and revert to mesh default
     * @param {BABYLON.AbstractMesh} mesh - The mesh to modify
     * @param {number[]} faceIds - Array of face IDs to revert
     * @returns {boolean} Success status
     */
    removeFaceMaterials(mesh, faceIds) {
        if (!mesh || !faceIds || faceIds.length === 0) {
            return false
        }

        try {
            // Remove face material mappings
            if (mesh._faceMaterials) {
                faceIds.forEach(faceId => {
                    mesh._faceMaterials.delete(faceId)
                })
            }
            
            // Rebuild sub-meshes without the removed faces
            this._rebuildSubMeshes(mesh)
            
            return true
        } catch (error) {
            console.error('Error removing face materials:', error)
            return false
        }
    }

    /**
     * Get all face materials for a mesh
     * @param {BABYLON.AbstractMesh} mesh - The mesh to check
     * @returns {Map<number, string>} Map of face ID to material name
     */
    getAllFaceMaterials(mesh) {
        return mesh._faceMaterials ? new Map(mesh._faceMaterials) : new Map()
    }

    /**
     * Clear all face materials from a mesh
     * @param {BABYLON.AbstractMesh} mesh - The mesh to clear
     * @returns {boolean} Success status
     */
    clearAllFaceMaterials(mesh) {
        if (!mesh) return false

        try {
            // Clear face material mappings
            if (mesh._faceMaterials) {
                mesh._faceMaterials.clear()
            }

            // Reset to single material (default or original)
            if (mesh.material instanceof this.BABYLON.MultiMaterial) {
                const originalMaterial = mesh.material.subMaterials[0] || 
                    this.createPBRMaterial('default', new this.BABYLON.Color3(0.8, 0.8, 0.8))
                mesh.material = originalMaterial
            }

            // Clear sub-meshes
            if (mesh.subMeshes) {
                mesh.subMeshes.forEach(subMesh => subMesh.dispose())
                mesh.subMeshes = []
            }

            if (mesh._subMeshFaces) {
                mesh._subMeshFaces.clear()
            }

            if (mesh._materialMapping) {
                mesh._materialMapping.clear()
            }

            return true
        } catch (error) {
            console.error('Error clearing face materials:', error)
            return false
        }
    }

    /**
     * Initialize MultiMaterial for a mesh if not already present
     * @param {BABYLON.AbstractMesh} mesh - The mesh to initialize
     * @returns {boolean} Success status
     */
    _initializeMultiMaterial(mesh) {
        try {
            if (!mesh.material || !(mesh.material instanceof this.BABYLON.MultiMaterial)) {
                // Store original material if it exists
                const originalMaterial = mesh.material
                
                // Create new MultiMaterial
                const multiMaterial = new this.BABYLON.MultiMaterial(`${mesh.name}_multiMaterial`, this.scene)
                
                // Add the original material as the first sub-material (index 0)
                if (originalMaterial) {
                    multiMaterial.subMaterials.push(originalMaterial)
                } else {
                    // Create a default material if none exists
                    const defaultMaterial = this.createPBRMaterial('default', new this.BABYLON.Color3(0.8, 0.8, 0.8))
                    multiMaterial.subMaterials.push(defaultMaterial)
                }
                
                mesh.material = multiMaterial
                
                // Initialize material mapping for this mesh
                if (!mesh._materialMapping) {
                    mesh._materialMapping = new Map()
                    mesh._materialMapping.set('default', 0)
                }
            }
            
            return true
        } catch (error) {
            console.error('Error initializing MultiMaterial:', error)
            return false
        }
    }

    /**
     * Get or create material index in MultiMaterial
     * @param {BABYLON.AbstractMesh} mesh - The mesh with MultiMaterial
     * @param {string} materialName - The material name to find/add
     * @returns {number} Material index or -1 if failed
     */
    _getMaterialIndexInMultiMaterial(mesh, materialName) {
        try {
            const multiMaterial = mesh.material
            if (!mesh._materialMapping) {
                mesh._materialMapping = new Map()
            }
            
            // Check if material is already in the MultiMaterial
            if (mesh._materialMapping.has(materialName)) {
                return mesh._materialMapping.get(materialName)
            }
            
            // Add new material to MultiMaterial
            const materialData = this.materials.get(materialName)
            if (!materialData) {
                console.error(`Material '${materialName}' not found`)
                return -1
            }
            
            const materialInstance = this._createMaterialInstance(materialData, `${materialName}_${Date.now()}`)
            const newIndex = multiMaterial.subMaterials.length
            multiMaterial.subMaterials.push(materialInstance)
            
            mesh._materialMapping.set(materialName, newIndex)
            return newIndex
        } catch (error) {
            console.error('Error getting material index:', error)
            return -1
        }
    }

    /**
     * Create sub-mesh for specific faces with given material index
     * @param {BABYLON.AbstractMesh} mesh - The mesh to modify
     * @param {number[]} faceIds - Array of face IDs
     * @param {number} materialIndex - Material index in MultiMaterial
     */
    _createSubMeshForFaces(mesh, faceIds, materialIndex) {
        try {
            const indices = mesh.getIndices()
            if (!indices) return
            
            // Sort face IDs to ensure consistent behavior
            const sortedFaceIds = [...faceIds].sort((a, b) => a - b)
            
            // Convert face IDs to index ranges for SubMesh
            // Note: SubMesh expects continuous index ranges, so we need to create
            // separate SubMeshes for non-continuous face groups
            const indexGroups = this._groupContinuousIndices(sortedFaceIds)
            
            for (const group of indexGroups) {
                const indexStart = group[0] * 3  // Each face has 3 indices
                const indexCount = group.length * 3
                const vertexStart = 0
                const vertexCount = mesh.getTotalVertices()
                
                // Remove existing sub-meshes that overlap with these faces
                this._removeOverlappingSubMeshes(mesh, group)
                
                // Create new sub-mesh
                const subMesh = new this.BABYLON.SubMesh(
                    materialIndex,
                    vertexStart,
                    vertexCount,
                    indexStart,
                    indexCount,
                    mesh
                )
                
                // Store face mapping for this sub-mesh
                if (!mesh._subMeshFaces) {
                    mesh._subMeshFaces = new Map()
                }
                mesh._subMeshFaces.set(subMesh, group)
            }
            
        } catch (error) {
            console.error('Error creating sub-mesh for faces:', error)
        }
    }

    /**
     * Group continuous face IDs into ranges for efficient SubMesh creation
     * @param {number[]} faceIds - Sorted array of face IDs
     * @returns {number[][]} Array of continuous face ID groups
     */
    _groupContinuousIndices(faceIds) {
        if (faceIds.length === 0) return []
        
        const groups = []
        let currentGroup = [faceIds[0]]
        
        for (let i = 1; i < faceIds.length; i++) {
            if (faceIds[i] === faceIds[i-1] + 1) {
                // Continuous, add to current group
                currentGroup.push(faceIds[i])
            } else {
                // Gap found, start new group
                groups.push(currentGroup)
                currentGroup = [faceIds[i]]
            }
        }
        
        // Add the last group
        groups.push(currentGroup)
        
        return groups
    }

    /**
     * Remove sub-meshes that overlap with given face IDs
     * @param {BABYLON.AbstractMesh} mesh - The mesh to check
     * @param {number[]} faceIds - Array of face IDs to check for overlap
     */
    _removeOverlappingSubMeshes(mesh, faceIds) {
        if (!mesh._subMeshFaces || !mesh.subMeshes) return
        
        const faceSet = new Set(faceIds)
        const subMeshesToRemove = []
        
        for (const subMesh of mesh.subMeshes) {
            const subMeshFaces = mesh._subMeshFaces.get(subMesh)
            if (subMeshFaces && subMeshFaces.some(faceId => faceSet.has(faceId))) {
                subMeshesToRemove.push(subMesh)
            }
        }
        
        subMeshesToRemove.forEach(subMesh => {
            const index = mesh.subMeshes.indexOf(subMesh)
            if (index > -1) {
                mesh.subMeshes.splice(index, 1)
                mesh._subMeshFaces.delete(subMesh)
                subMesh.dispose()
            }
        })
    }

    /**
     * Rebuild all sub-meshes based on current face material mappings
     * @param {BABYLON.AbstractMesh} mesh - The mesh to rebuild
     */
    _rebuildSubMeshes(mesh) {
        try {
            if (!mesh._faceMaterials) return
            
            // Clear existing sub-meshes
            if (mesh.subMeshes) {
                mesh.subMeshes.forEach(subMesh => subMesh.dispose())
                mesh.subMeshes = []
            }
            if (mesh._subMeshFaces) {
                mesh._subMeshFaces.clear()
            }
            
            // Group faces by material
            const materialGroups = new Map()
            for (const [faceId, materialName] of mesh._faceMaterials) {
                if (!materialGroups.has(materialName)) {
                    materialGroups.set(materialName, [])
                }
                materialGroups.get(materialName).push(faceId)
            }
            
            // Create sub-meshes for each material group
            for (const [materialName, faceIds] of materialGroups) {
                const materialIndex = this._getMaterialIndexInMultiMaterial(mesh, materialName)
                if (materialIndex !== -1) {
                    this._createSubMeshForFaces(mesh, faceIds, materialIndex)
                }
            }
            
        } catch (error) {
            console.error('Error rebuilding sub-meshes:', error)
        }
    }

    // Helper method to copy custom material properties
    copyCustomMaterialProperties(originalMaterial, clonedMaterial) {
        // Copy custom uniforms and properties for custom materials
        if (originalMaterial.CustomParts) {
            clonedMaterial.CustomParts = originalMaterial.CustomParts
        }
        
        // Copy any custom properties that might not clone properly
        const customProperties = ['inkColor', 'paperTexture', 'scale', 'angleStep', 'angle', 'thickness', 'range', 'rim', 'noiseScale', 'noiseAmplitude', 'linesNoiseScale', 'linesNoiseAmplitude']
        
        customProperties.forEach(prop => {
            if (originalMaterial[prop] !== undefined) {
                try {
                    clonedMaterial[prop] = originalMaterial[prop]
                } catch (error) {
                    // Some properties might not be settable, continue with others
                    console.debug(`Could not copy property ${prop}:`, error)
                }
            }
        })
        
        // Copy onBind function if it exists
        if (originalMaterial.onBind) {
            clonedMaterial.onBind = originalMaterial.onBind
        }
    }

    // Debug method to check material properties
    debugMaterial(materialName) {
        const materialData = this.materials.get(materialName)
        if (!materialData) {
            console.error(`Material '${materialName}' not found`)
            return false
        }
        
        const material = materialData.material
        console.log(`=== Material Debug: ${materialName} ===`)
        console.log('Type:', material.constructor.name)
        console.log('BaseColor:', material.baseColor)
        console.log('AlbedoColor:', material.albedoColor)
        console.log('MetallicFactor:', material.metallicFactor)
        console.log('RoughnessFactor:', material.roughnessFactor)
        console.log('Alpha:', material.alpha)
        console.log('EnvironmentIntensity:', material.environmentIntensity)
        console.log('DirectIntensity:', material.directIntensity)
        console.log('BackFaceCulling:', material.backFaceCulling)
        console.log('TransparencyMode:', material.transparencyMode)
        console.log('IsReady:', material.isReady())
        console.log('=====================================')
        
        return true
    }

        // ===== FACE-BASED MATERIAL HELPER METHODS =====

    /**
     * Create a material instance for face assignment
     * @param {Object} materialData - The material data from the library
     * @param {string} instanceName - Name for the new instance
     * @returns {BABYLON.Material} The created material instance
     */
    _createMaterialInstance(materialData, instanceName) {
        if (materialData.material instanceof this.BABYLON.PBRMaterial) {
            // Create a new PBR material instance
            const newMaterial = new this.BABYLON.PBRMaterial(instanceName, this.scene)
            const originalMaterial = materialData.material
            
            // Copy all PBR properties
            const baseColor = originalMaterial.baseColor || originalMaterial.albedoColor || new this.BABYLON.Color3(0.8, 0.8, 0.8)
            newMaterial.baseColor = baseColor.clone()
            newMaterial.albedoColor = baseColor.clone()
            
            newMaterial.metallicFactor = originalMaterial.metallicFactor !== undefined ? originalMaterial.metallicFactor : 0.0
            newMaterial.roughnessFactor = originalMaterial.roughnessFactor !== undefined ? originalMaterial.roughnessFactor : 0.5
            
            if (originalMaterial.alpha !== undefined) {
                newMaterial.alpha = originalMaterial.alpha
            }
            if (originalMaterial.transparencyMode !== undefined) {
                newMaterial.transparencyMode = originalMaterial.transparencyMode
            }
            
            // Lighting setup
            newMaterial.environmentIntensity = 1.0
            newMaterial.directIntensity = 1.0
            newMaterial.emissiveIntensity = 0.0
            newMaterial.specularIntensity = 1.0
            newMaterial.backFaceCulling = true
            
            return newMaterial
        } else {
            // For custom materials, clone and copy properties
            const newMaterial = materialData.material.clone(instanceName)
            this.copyCustomMaterialProperties(materialData.material, newMaterial)
            return newMaterial
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
        const epsilon = 1e-5

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
                const isNormalAligned = Math.abs(this.BABYLON.Vector3.Dot(referencePlane.normal, neighborNormal)) > (1 - epsilon)
                const isPointOnPlane = Math.abs(referencePlane.signedDistanceTo(neighborVertices[0])) < epsilon

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

    dispose() {
        // Clean up MultiMaterial-related data for all meshes
        this.scene.meshes.forEach(mesh => {
            if (mesh._faceMaterials) {
                mesh._faceMaterials.clear()
            }
            if (mesh._materialMapping) {
                mesh._materialMapping.clear()
            }
            if (mesh._subMeshFaces) {
                mesh._subMeshFaces.clear()
            }
            
            // Clean up old face meshes if they still exist (for backward compatibility)
            if (mesh._faceMeshes) {
                mesh._faceMeshes.forEach(faceInfo => {
                    if (faceInfo.mesh) {
                        faceInfo.mesh.dispose()
                    }
                })
                mesh._faceMeshes = []
            }
        })
        
        this.materials.forEach(materialData => {
            if (materialData.material && materialData.material.dispose) {
                materialData.material.dispose()
            }
        })
        this.materials.clear()
        this.customMaterialClasses.clear()
    }
}
