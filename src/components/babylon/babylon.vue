<template>
    <div ref="renderCanvasContainer" class="babylon-container">
        <canvas ref="renderCanvas" class="babylon-canvas"></canvas>
        
        <!-- View Toolbar -->
        <ViewToolbar 
            ref="viewToolbar"
            :scene="scene"
            :camera="camera"
            :viewManager="viewManager"
            :lights="lights"
            :ground="ground"
            :shadowGenerator="shadowGenerator"
            :meshes="allMeshes"
            :pipeline="pipeline"
            @tool-changed="onViewToolChanged"
        />
        
        <!-- Modeling Toolbar -->
        <ModelingToolbar 
            ref="modelingToolbar"
            :scene="scene"
            :canvas="renderCanvas"
            :selectionManager="selectionManager"
            :snapManager="snapManager"
            @tool-changed="onModelingToolChanged"
            @selection-changed="onSelectionChanged"
        />
    </div>
</template>

<style scoped>
/* Ensure no white gaps by resetting browser defaults */
:global(html, body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
}

:global(#app) {
    margin: 0;
    padding: 0;
}

.babylon-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #000;
}

.babylon-canvas {
    width: 100%;
    height: 100%;
    display: block;
    margin: 0;
    padding: 0;
    border: none;
    outline: none;
}
</style>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue'
import ViewToolbar from './ViewToolbar.vue'
import ModelingToolbar from './ModelingToolbar.vue'
import SelectionManager from './utils/SelectionManager.js'
import ViewManager from './utils/ViewManager.js'
import SnapManager from './utils/SnapManager.js'

let engine = null
let scene = ref(null)
let BABYLON = null

// Expose scene objects for the settings component
const lights = ref({})
const ground = ref(null)
const shadowGenerator = ref(null)
const allMeshes = ref([])
const selectionManager = ref(null)
const viewManager = ref(null)
const snapManager = ref(null)
const camera = ref(null)
const pipeline = ref(null)

const renderCanvas = ref(null)
const viewToolbar = ref(null)
const modelingToolbar = ref(null)

onMounted(async () => {
    // Dynamically import Babylon.js to avoid SSR issues
    BABYLON = await import('babylonjs')
    await import('babylonjs-loaders')
    
    // Check if WebGPU is supported
    const webgpuSupported = await BABYLON.WebGPUEngine.IsSupportedAsync
    
    if (webgpuSupported) {
        console.log('WebGPU is supported, creating WebGPU engine...')
        // Create WebGPU engine
        engine = new BABYLON.WebGPUEngine(renderCanvas.value, {
            antialias: true,
            stencil: true,
            adaptToDeviceRatio: true
        })
        
        // Initialize the WebGPU engine
        await engine.initAsync()
        console.log('WebGPU engine initialized successfully')
    } else {
        console.log('WebGPU not supported, falling back to WebGL engine...')
        // Fallback to WebGL engine
        engine = new BABYLON.Engine(renderCanvas.value, true, {
            antialias: true,
            stencil: true,
            adaptToDeviceRatio: true
        })
    }

    scene.value = new BABYLON.Scene(engine)
    scene.value.imageProcessingConfiguration.toneMappingEnabled = true
    scene.value.imageProcessingConfiguration.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES
    scene.value.imageProcessingConfiguration.exposure = 1.0 // Slightly reduce exposure for softer look
    scene.value.imageProcessingConfiguration.contrast = 1.1 // Slight contrast boost

    // Camera - positioned higher to see the grid
    camera.value = new BABYLON.ArcRotateCamera(
        'camera',
        Math.PI / 2,
        Math.PI / 4,
        50,
        BABYLON.Vector3.Zero(),
        scene.value
    )
    camera.value.attachControl(renderCanvas.value, true)
    

    // Setup post-processing pipeline
    pipeline.value = new BABYLON.DefaultRenderingPipeline(
        "defaultPipeline", // The name of the pipeline
        true, // Do you want the pipeline to use HDR texture?
        scene.value, // The scene instance
        [camera.value] // The list of cameras to attach the pipeline to
    );
    // Disable effects by default, they will be controlled by GraphicsSettings
    pipeline.value.bloomEnabled = false;
    pipeline.value.fxaaEnabled = false;
    pipeline.value.imageProcessing.colorCurvesEnabled = false;
    engine.setHardwareScalingLevel(.5)


    // LOAD ALL MANAGERS // 
    // Initialize SelectionManager with scene and BABYLON library
    try {
        selectionManager.value = new SelectionManager(scene.value, BABYLON)
        selectionManager.value.setSelectionChangedCallback((selectionData) => {
            onSelectionChanged(selectionData)
        })
        console.log('SelectionManager initialized successfully')
    } catch (error) {
        console.error('Error initializing SelectionManager:', error)
    }

    // Initialize ViewManager with camera and scene
    try {
        viewManager.value = new ViewManager(camera.value, scene.value, renderCanvas.value, BABYLON)
        console.log('ViewManager initialized successfully')
        viewManager.value.setSensibility();
    } catch (error) {
        console.error('Error initializing ViewManager:', error)
    }

    // Initialize SnapManager with scene and canvas
    try {
        snapManager.value = new SnapManager(scene.value)
        console.log('SnapManager initialized successfully')
    } catch (error) {
        console.error('Error initializing SnapManager:', error)
    }

    // Set up realistic lighting
    setupRealisticLighting(BABYLON, scene.value)
    await loadModelsInGrid(BABYLON, scene.value)

    engine.runRenderLoop(() => {
        scene.value.render()
    })

    scene.value.onBeforeRenderObservable.add(() => {
        snapManager.value.update();
    });

    // Prevent scroll events from propagating to the page
    renderCanvas.value.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('resize', onResize)
})

async function loadModelsInGrid(BABYLON, scene) {
    // List of GLB models to load (first 36 for 6x6 grid)
    const modelNames = [
        'building-a.glb', 'building-b.glb', 'building-c.glb', 'building-d.glb',
        'building-e.glb', 'building-f.glb', 'building-g.glb', 'building-h.glb',
        'building-i.glb', 'building-j.glb', 'building-k.glb', 'building-l.glb',
        'building-m.glb', 'building-n.glb', 'building-skyscraper-a.glb', 'building-skyscraper-b.glb',
        'building-skyscraper-c.glb', 'building-skyscraper-d.glb', 'building-skyscraper-e.glb',
        'detail-awning-wide.glb', 'detail-awning.glb', 'detail-overhang-wide.glb',
        'detail-overhang.glb', 'detail-parasol-a.glb', 'detail-parasol-b.glb',
        'low-detail-building-a.glb', 'low-detail-building-b.glb', 'low-detail-building-c.glb',
        'low-detail-building-d.glb', 'low-detail-building-e.glb', 'low-detail-building-f.glb',
        'low-detail-building-g.glb', 'low-detail-building-h.glb', 'low-detail-building-i.glb',
        'low-detail-building-j.glb', 'low-detail-building-k.glb'
    ]

    const gridSize = 6
    const spacing = 2 // Distance between models
    const basePath = '/wip_content/kenney_city-kit-commercial_20/Models/GLB format/'

    let modelIndex = 0

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (modelIndex >= modelNames.length) break

            try {
                const modelName = modelNames[modelIndex]
                const result = await BABYLON.SceneLoader.ImportMeshAsync(
                    '', // Import all meshes
                    basePath,
                    modelName,
                    scene
                )

                // Position the model in the grid
                const x = (col - gridSize / 2 + 0.5) * spacing
                const z = (row - gridSize / 2 + 0.5) * spacing

                // Move all imported meshes to the grid position
                result.meshes.forEach(mesh => {
                    // Add ALL meshes to the array for graphics settings (not just root meshes)
                    if (mesh.material) {
                        allMeshes.value.push(mesh)
                    }

                    if (mesh.parent === null) { // Only move root meshes
                        mesh.position.x = x
                        mesh.position.z = z
                        mesh.position.y = 0
                    }
                    
                    // Add shadows to all meshes and enhance materials
                    if (mesh.material) {
                        enhanceMaterial(mesh.material, BABYLON)
                    }

                    if (shadowGenerator.value) {
                        shadowGenerator.value.addShadowCaster(mesh)
                    }
                })

                console.log(`Loaded model ${modelIndex + 1}/${Math.min(gridSize * gridSize, modelNames.length)}: ${modelName}`)
            } catch (error) {
                console.error(`Failed to load model ${modelNames[modelIndex]}:`, error)
            }

            modelIndex++
        }
        if (modelIndex >= modelNames.length) break
    }

    console.log('Finished loading all models in grid')

    // create sample cubes as well for testing
    for (let i = 0; i < 10; i++) {
        const cube = BABYLON.MeshBuilder.CreateBox(`sampleCube${i}`, { size : 0.5 }, scene)
        cube.position.x = (Math.random() - 0.5) * 10
        cube.position.y = 0.25
        cube.position.z = (Math.random() - 0.5) * 10
        cube.material = new BABYLON.StandardMaterial(`sampleCubeMat${i}`, scene)
        cube.material.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random())
        cube.material.specularColor = new BABYLON.Color3(0, 0, 0) // No specular reflection
        cube.material.roughness = 0.5 // Slightly rough surface
        cube.material.metallic = 0.2 // Slight metallic effect
        cube.receiveShadows = true // Enable shadow receiving
        if (shadowGenerator.value) {
            shadowGenerator.value.addShadowCaster(cube) // Add to shadow generator
        }
        allMeshes.value.push(cube) // Add to all meshes for graphics settings

        enhanceMaterial(cube.material, BABYLON) // Enhance material for studio lighting
        
        console.log(`Created sample cube ${i}`)
    }

    console.log('All models loaded and positioned in grid')
}

function setupRealisticLighting(BABYLON, scene) {
    // Set a neutral studio background
    scene.clearColor = new BABYLON.Color3(0.9, 0.9, 0.9) // Light gray background
    
    // 1. Key light (Main directional light) - soft studio lighting
    const keyLight = new BABYLON.DirectionalLight(
        'keyLight',
        new BABYLON.Vector3(-0.5, -1, -0.3),
        scene
    )
    keyLight.intensity = 2.0
    keyLight.diffuse = new BABYLON.Color3(1, 1, 1) // Pure white light
    keyLight.specular = new BABYLON.Color3(0.8, 0.8, 0.8)

    // Enable soft shadows
    const shadowGen = new BABYLON.ShadowGenerator(2048, keyLight)
    shadowGen.useBlurExponentialShadowMap = true
    shadowGen.blurScale = 1.2 // Reduced blur for more defined shadows
    shadowGen.darkness = 0.4 // Increased darkness for more visible shadows

    // 2. Fill light (Opposite side, softer)
    const fillLight = new BABYLON.DirectionalLight(
        'fillLight',
        new BABYLON.Vector3(0.8, -0.5, 0.2),
        scene
    )
    fillLight.intensity = 1.0
    fillLight.diffuse = new BABYLON.Color3(0.9, 0.95, 1.0) // Slightly cool fill light

    // 3. Ambient light (Overall soft illumination)
    const ambientLight = new BABYLON.HemisphericLight(
        'ambientLight',
        new BABYLON.Vector3(0, 1, 0),
        scene
    )
    ambientLight.intensity = 0.9
    ambientLight.diffuse = new BABYLON.Color3(0.95, 0.95, 1.0) // Very soft cool ambient
    ambientLight.groundColor = new BABYLON.Color3(0.8, 0.8, 0.8) // Neutral ground reflection

    // 4. Create invisible ground that receives shadows
    const groundPlane = BABYLON.MeshBuilder.CreateGround(
        'ground',
        { width: 100, height: 100 },
        scene
    )
    
    // Create transparent shadow-receiving material
    const groundMaterial = new BABYLON.StandardMaterial('shadowOnlyMaterial', scene)
    groundMaterial.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95) // Very light gray for better shadow contrast
    groundMaterial.alpha = 0.1 // Slightly visible to show shadows better
    groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0) // No specular reflection
    
    // Enable shadow-only mode
    groundMaterial.disableLighting = false
    groundPlane.material = groundMaterial
    groundPlane.receiveShadows = true
    
    // Make ground completely invisible except for shadows
    groundPlane.visibility = 1.0 // Keep full visibility but material is transparent

    // Store references for the settings component
    lights.value = {
        keyLight,
        fillLight,
        ambientLight
    }
    ground.value = groundPlane
    shadowGenerator.value = shadowGen

    console.log('Studio lighting setup complete')
}

function enhanceMaterial(material, BABYLON) {
    // If it's already a PBR material, enhance it for studio lighting
    if (material instanceof BABYLON.PBRMaterial) {
        // Enhance existing PBR material
        if (material.metallicFactor === undefined) material.metallicFactor = 0.2
        if (material.roughnessFactor === undefined) material.roughnessFactor = 0.6
        material.environmentIntensity = 0.8
        
        // Ensure proper lighting response
        if (!material.baseColor) {
            material.baseColor = new BABYLON.Color3(0.8, 0.8, 0.8)
        }
        return
    }

    // If it's a standard material, enhance for studio lighting
    if (material instanceof BABYLON.StandardMaterial) {
        // Enhance standard material properties
        material.specularPower = 64
        material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1)
        
        // Ensure material responds to lighting properly
        if (!material.diffuseColor) {
            material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8)
        }
        
        // Remove reflection effects for cleaner studio look
        material.reflectionTexture = null
        material.reflectionFresnelParameters = null
    }
}

function onResize() {
    if (engine) {
        engine.resize()
    }
}

function onWheel(event) {
    // Only prevent default if we're not in a custom view mode that handles its own wheel events
    if (!viewManager.value || viewManager.value.getCurrentMode() === 'orbit') {
        // Prevent the scroll event from bubbling up to the document
        event.preventDefault()
        event.stopPropagation()
        
        // The camera controls will still handle the wheel event for zooming
        // since Babylon.js attaches its own wheel listeners directly to the canvas
    }
}

// Modeling Toolbar Event Handlers
let currentCamera = null

function onViewToolChanged(data) {
    console.log(`View tool changed to: ${data.tool}`)
    
    if (modelingToolbar.value) {
            modelingToolbar.value.deactivateModelingTools()
    }
}

function onModelingToolChanged(data) {
    console.log('Active modeling tool changed:', data.tool)
    
    // When a modeling tool is activated, deactivate view tools (return to orbit)
    if (data.tool && viewToolbar.value) {
        viewToolbar.value.deactivateViewTools()
    }
    
    // Store camera reference if not already stored
    if (!currentCamera && scene.value) {
        currentCamera = scene.value.activeCamera
    }
    // Manage camera controls based on active tool
    if (data.tool === 'pencil' || data.tool === 'pushpull') {
        // For drawing and push-pull tools, we may want to keep camera controls
        // but with lower priority - the tools handle events in capture phase
        console.log(`${data.tool} tool active - modeling tools have event priority`)
    } else {
        // Selection tool can work alongside camera controls
        console.log(`${data.tool} tool active - camera controls normal`)
    }
}

function onSelectionChanged(data) {
    console.log('Selection changed:', data)
    // Handle selection changes - you could emit this to parent components
    // or update global state as needed
    
}

onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize)
    if (renderCanvas.value) {
        renderCanvas.value.removeEventListener('wheel', onWheel)
    }
    if (selectionManager.value) {
        selectionManager.value.dispose()
    }
    if (viewManager.value) {
        viewManager.value.dispose()
    }
    if (snapManager.value) {
        snapManager.value.dispose()
    }
    if (engine) {
        engine.dispose()
    }
})
</script>