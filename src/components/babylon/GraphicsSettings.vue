<template>
    <div class="graphics-settings-container">
        <!-- Settings Dialog -->
        <Dialog 
            :visible="visible" 
            @update:visible="$emit('update:visible', $event)"
            modal 
            header="Graphics Settings"
            :style="{ width: '450px' }"
            class="graphics-dialog"
        >
            <div class="settings-content">
                
                <!-- Lighting Controls -->
                <div class="setting-group">
                    <h4>Lighting</h4>
                    
                    <div class="setting-item">
                        <label>Key Light Intensity</label>
                        <Slider 
                            v-model="settings.keyLightIntensity" 
                            :min="0" 
                            :max="5" 
                            :step="0.1"
                            @update:modelValue="updateKeyLight"
                        />
                        <span class="value-display">{{ settings.keyLightIntensity }}</span>
                    </div>
                    
                    <div class="setting-item">
                        <label>Fill Light Intensity</label>
                        <Slider 
                            v-model="settings.fillLightIntensity" 
                            :min="0" 
                            :max="3" 
                            :step="0.1"
                            @update:modelValue="updateFillLight"
                        />
                        <span class="value-display">{{ settings.fillLightIntensity }}</span>
                    </div>
                    
                    <div class="setting-item">
                        <label>Ambient Light Intensity</label>
                        <Slider 
                            v-model="settings.ambientIntensity" 
                            :min="0" 
                            :max="2" 
                            :step="0.1"
                            @update:modelValue="updateAmbientLight"
                        />
                        <span class="value-display">{{ settings.ambientIntensity }}</span>
                    </div>
                </div>

                <!-- Sun Position Controls -->
                <div class="setting-group">
                    <h4>Sun Position</h4>
                    
                    <div class="setting-item">
                        <label>Sun Angle X</label>
                        <Slider 
                            v-model="settings.sunAngleX" 
                            :min="-2" 
                            :max="2" 
                            :step="0.1"
                            @update:modelValue="updateSunPosition"
                        />
                        <span class="value-display">{{ settings.sunAngleX }}</span>
                    </div>
                    
                    <div class="setting-item">
                        <label>Sun Angle Y</label>
                        <Slider 
                            v-model="settings.sunAngleY" 
                            :min="-2" 
                            :max="0" 
                            :step="0.1"
                            @update:modelValue="updateSunPosition"
                        />
                        <span class="value-display">{{ settings.sunAngleY }}</span>
                    </div>
                    
                    <div class="setting-item">
                        <label>Sun Angle Z</label>
                        <Slider 
                            v-model="settings.sunAngleZ" 
                            :min="-2" 
                            :max="2" 
                            :step="0.1"
                            @update:modelValue="updateSunPosition"
                        />
                        <span class="value-display">{{ settings.sunAngleZ }}</span>
                    </div>
                </div>

                <!-- Shadow Controls -->
                <div class="setting-group">
                    <h4>Shadows</h4>
                    
                    <div class="setting-item">
                        <label>Shadow Darkness</label>
                        <Slider 
                            v-model="settings.shadowDarkness" 
                            :min="0" 
                            :max="1" 
                            :step="0.05"
                            @update:modelValue="updateShadows"
                        />
                        <span class="value-display">{{ settings.shadowDarkness }}</span>
                    </div>
                    
                    <div class="setting-item">
                        <label>Shadow Blur</label>
                        <Slider 
                            v-model="settings.shadowBlur" 
                            :min="0.5" 
                            :max="4" 
                            :step="0.1"
                            @update:modelValue="updateShadows"
                        />
                        <span class="value-display">{{ settings.shadowBlur }}</span>
                    </div>
                </div>

                <!-- Ground Controls -->
                <div class="setting-group">
                    <h4>Ground</h4>
                    
                    <div class="setting-item">
                        <label>Ground Opacity</label>
                        <Slider 
                            v-model="settings.groundOpacity" 
                            :min="0" 
                            :max="1" 
                            :step="0.05"
                            @update:modelValue="updateGround"
                        />
                        <span class="value-display">{{ settings.groundOpacity }}</span>
                    </div>
                    
                    <div class="setting-item checkbox-item">
                        <Checkbox 
                            v-model="settings.showGround" 
                            binary
                            @update:modelValue="updateGround"
                        />
                        <label>Show Ground Plane</label>
                    </div>
                </div>

                <!-- Exposure Controls -->
                <div class="setting-group">
                    <h4>Image Processing</h4>
                    
                    <div class="setting-item">
                        <label>Exposure</label>
                        <Slider 
                            v-model="settings.exposure" 
                            :min="0.1" 
                            :max="2" 
                            :step="0.1"
                            @update:modelValue="updateImageProcessing"
                        />
                        <span class="value-display">{{ settings.exposure }}</span>
                    </div>
                    
                    <div class="setting-item">
                        <label>Contrast</label>
                        <Slider 
                            v-model="settings.contrast" 
                            :min="0.5" 
                            :max="2" 
                            :step="0.1"
                            @update:modelValue="updateImageProcessing"
                        />
                        <span class="value-display">{{ settings.contrast }}</span>
                    </div>
                </div>

                <!-- Rendering Effects -->
                <div class="setting-group">
                    <h4>Rendering Effects</h4>
                    
                    <div class="setting-item checkbox-item">
                        <Checkbox 
                            v-model="settings.showEdges" 
                            binary
                            @update:modelValue="updateEdges"
                        />
                        <label>Show Edges</label>
                    </div>
                    
                    <div class="setting-item" v-if="settings.showEdges">
                        <label>Edge Color</label>
                        <ColorPicker 
                            v-model="settings.edgeColor" 
                            format="hex"
                            @update:modelValue="updateEdges"
                        />
                    </div>
                    
                    <div class="setting-item" v-if="settings.showEdges">
                        <label>Edge Width</label>
                        <Slider 
                            v-model="settings.edgeWidth" 
                            :min="0.1" 
                            :max="8" 
                            :step="0.1"
                            @update:modelValue="updateEdges"
                        />
                        <span class="value-display">{{ settings.edgeWidth }}</span>
                    </div>
                    
                    <div class="setting-item checkbox-item" v-if="settings.showEdges">
                        <Checkbox 
                            v-model="settings.sketchEdges" 
                            binary
                            @update:modelValue="updateEdges"
                        />
                        <label>Sketch-style Edges (Post Process)</label>
                    </div>
                    
                    <div class="setting-item" v-if="settings.showEdges && settings.sketchEdges">
                        <label>Edge Intensity</label>
                        <Slider 
                            v-model="settings.edgeIntensity" 
                            :min="0.1" 
                            :max="2" 
                            :step="0.1"
                            @update:modelValue="updateEdges"
                        />
                        <span class="value-display">{{ settings.edgeIntensity }}</span>
                    </div>
                    
                    <div class="setting-item checkbox-item">
                        <Checkbox 
                            v-model="settings.whiteMaterials" 
                            binary
                            @update:modelValue="updateMaterials"
                        />
                        <label>Replace All Materials with White</label>
                    </div>
                    
                    <div class="setting-item checkbox-item">
                        <Checkbox 
                            v-model="settings.watercolorEffect" 
                            binary
                            @update:modelValue="updateMaterials"
                        />
                        <label>Watercolor Effect</label>
                    </div>
                    
                    <div class="setting-item" v-if="settings.watercolorEffect">
                        <label>Watercolor Intensity</label>
                        <Slider 
                            v-model="settings.watercolorIntensity" 
                            :min="0.1" 
                            :max="2" 
                            :step="0.1"
                            @update:modelValue="updateMaterials"
                        />
                        <span class="value-display">{{ settings.watercolorIntensity }}</span>
                    </div>
                </div>

                <!-- Post-Processing Effects -->
                <div class="setting-group">
                    <h4>Post-Processing Effects</h4>
                    
                    <div class="setting-item checkbox-item">
                        <Checkbox 
                            v-model="settings.fxaa" 
                            binary
                            @update:modelValue="updatePostProcessing"
                        />
                        <label>FXAA (Anti-aliasing)</label>
                    </div>
                    
                    <div class="setting-item checkbox-item">
                        <Checkbox 
                            v-model="settings.bloom" 
                            binary
                            @update:modelValue="updatePostProcessing"
                        />
                        <label>Bloom</label>
                    </div>
                    
                    <div class="setting-item" v-if="settings.bloom">
                        <label>Bloom Weight</label>
                        <Slider 
                            v-model="settings.bloomWeight" 
                            :min="0" 
                            :max="1" 
                            :step="0.05"
                            @update:modelValue="updatePostProcessing"
                        />
                        <span class="value-display">{{ settings.bloomWeight }}</span>
                    </div>
                </div>

                <!-- Color Correction -->
                <div class="setting-group">
                    <h4>Color Correction</h4>
                    
                    <div class="setting-item checkbox-item">
                        <Checkbox 
                            v-model="settings.colorCurves" 
                            binary
                            @update:modelValue="updatePostProcessing"
                        />
                        <label>Color Curves</label>
                    </div>
                    
                    <div class="setting-item" v-if="settings.colorCurves">
                        <label>Global Hue</label>
                        <Slider 
                            v-model="settings.globalHue" 
                            :min="0" 
                            :max="360" 
                            :step="1"
                            @update:modelValue="updatePostProcessing"
                        />
                        <span class="value-display">{{ settings.globalHue }}</span>
                    </div>
                    
                    <div class="setting-item" v-if="settings.colorCurves">
                        <label>Global Density</label>
                        <Slider 
                            v-model="settings.globalDensity" 
                            :min="0" 
                            :max="100" 
                            :step="1"
                            @update:modelValue="updatePostProcessing"
                        />
                        <span class="value-display">{{ settings.globalDensity }}</span>
                    </div>
                    
                    <div class="setting-item" v-if="settings.colorCurves">
                        <label>Global Saturation</label>
                        <Slider 
                            v-model="settings.globalSaturation" 
                            :min="0" 
                            :max="100" 
                            :step="1"
                            @update:modelValue="updatePostProcessing"
                        />
                        <span class="value-display">{{ settings.globalSaturation }}</span>
                    </div>
                    
                    <div class="setting-item" v-if="settings.colorCurves">
                        <label>Highlights Hue</label>
                        <Slider 
                            v-model="settings.highlightsHue" 
                            :min="0" 
                            :max="360" 
                            :step="1"
                            @update:modelValue="updatePostProcessing"
                        />
                        <span class="value-display">{{ settings.highlightsHue }}</span>
                    </div>
                    
                    <div class="setting-item" v-if="settings.colorCurves">
                        <label>Highlights Density</label>
                        <Slider 
                            v-model="settings.highlightsDensity" 
                            :min="0" 
                            :max="100" 
                            :step="1"
                            @update:modelValue="updatePostProcessing"
                        />
                        <span class="value-display">{{ settings.highlightsDensity }}</span>
                    </div>
                    
                    <div class="setting-item" v-if="settings.colorCurves">
                        <label>Highlights Saturation</label>
                        <Slider 
                            v-model="settings.highlightsSaturation" 
                            :min="-100" 
                            :max="100" 
                            :step="1"
                            @update:modelValue="updatePostProcessing"
                        />
                        <span class="value-display">{{ settings.highlightsSaturation }}</span>
                    </div>
                    
                    <div class="setting-item" v-if="settings.colorCurves">
                        <label>Shadows Hue</label>
                        <Slider 
                            v-model="settings.shadowsHue" 
                            :min="0" 
                            :max="360" 
                            :step="1"
                            @update:modelValue="updatePostProcessing"
                        />
                        <span class="value-display">{{ settings.shadowsHue }}</span>
                    </div>
                    
                    <div class="setting-item" v-if="settings.colorCurves">
                        <label>Shadows Density</label>
                        <Slider 
                            v-model="settings.shadowsDensity" 
                            :min="0" 
                            :max="100" 
                            :step="1"
                            @update:modelValue="updatePostProcessing"
                        />
                        <span class="value-display">{{ settings.shadowsDensity }}</span>
                    </div>
                    
                    <div class="setting-item" v-if="settings.colorCurves">
                        <label>Shadows Saturation</label>
                        <Slider 
                            v-model="settings.shadowsSaturation" 
                            :min="-100" 
                            :max="100" 
                            :step="1"
                            @update:modelValue="updatePostProcessing"
                        />
                        <span class="value-display">{{ settings.shadowsSaturation }}</span>
                    </div>
                </div>

            </div>
            
            <template #footer>
                <Button label="Save" @click="saveSettings" severity="secondary" />
                <Button label="Load" @click="loadSettings" severity="secondary" />
                <Button label="Reset" @click="resetSettings" severity="secondary" />
                <Button label="Close" @click="$emit('update:visible', false)" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Slider from 'primevue/slider'
import Checkbox from 'primevue/checkbox'
import ColorPicker from 'primevue/colorpicker'

const toast = useToast()

// --- Props and State (Unchanged) ---
const props = defineProps({
    scene: Object,
    lights: Object,
    ground: Object,
    shadowGenerator: Object,
    meshes: Array,
    visible: Boolean,
    pipeline: Object // Added pipeline prop
})

const emit = defineEmits(['update:visible'])

const settings = reactive({
    keyLightIntensity: 2.0,
    fillLightIntensity: 1.0,
    ambientIntensity: 0.9,
    sunAngleX: 0.4,
    sunAngleY: -1,
    sunAngleZ: -1.2,
    shadowDarkness: 0.4,
    shadowBlur: 1.2,
    groundOpacity: 0.1,
    showGround: true,
    exposure: 1.0,
    contrast: 1.1,
    showEdges: false,
    edgeColor: '#000000',
    edgeWidth: 1.0,
    sketchEdges: false,
    edgeIntensity: 1.0,
    whiteMaterials: false,
    watercolorEffect: false,
    watercolorIntensity: 1.0,
    // Post-processing
    fxaa: false,
    bloom: false,
    bloomWeight: 0.5,
    // Color Correction
    colorCurves: false,
    globalHue: 200,
    globalDensity: 80,
    globalSaturation: 80,
    highlightsHue: 20,
    highlightsDensity: 80,
    highlightsSaturation: -80,
    shadowsHue: 2,
    shadowsDensity: 80,
    shadowsSaturation: 40
})

const defaultSettings = JSON.parse(JSON.stringify(settings))
let originalMaterials = new Map()
let edgeDetectionPostProcess = null

// Load saved settings when component is mounted
onMounted(() => {
    loadSettings(false) // Don't show feedback on auto-load
})

function updateKeyLight() { if (props.lights?.keyLight) props.lights.keyLight.intensity = settings.keyLightIntensity }
function updateFillLight() { if (props.lights?.fillLight) props.lights.fillLight.intensity = settings.fillLightIntensity }
function updateAmbientLight() { if (props.lights?.ambientLight) props.lights.ambientLight.intensity = settings.ambientIntensity }
function updateSunPosition() { 
    if (!props.lights?.keyLight) return;
    
    import('babylonjs').then(BABYLON => {
        props.lights.keyLight.direction = new BABYLON.Vector3(settings.sunAngleX, settings.sunAngleY, settings.sunAngleZ);
    });
}
function updateShadows() { if (props.shadowGenerator) { props.shadowGenerator.darkness = settings.shadowDarkness; props.shadowGenerator.blurScale = settings.shadowBlur } }
function updateGround() { if (props.ground) { props.ground.visibility = settings.showGround ? 1.0 : 0.0; if (props.ground.material) props.ground.material.alpha = settings.groundOpacity } }
function updateImageProcessing() { if (props.scene?.imageProcessingConfiguration) { props.scene.imageProcessingConfiguration.exposure = settings.exposure; props.scene.imageProcessingConfiguration.contrast = settings.contrast } }

let colorCurvesInstance = null; // Declare a variable to hold the single instance of ColorCurves

function updatePostProcessing() {
    if (!props.pipeline) return;

    import('babylonjs').then(BABYLON => { // Import Babylon.js inside the function
        props.pipeline.fxaaEnabled = settings.fxaa;
        props.pipeline.bloomEnabled = settings.bloom;
        props.pipeline.bloomWeight = settings.bloomWeight;
       
        if (props.pipeline.imageProcessing) {
            props.pipeline.imageProcessing.colorCurvesEnabled = settings.colorCurves;
            if (settings.colorCurves) {
                // Create the ColorCurves instance only once
                if (!colorCurvesInstance) {
                    colorCurvesInstance = new BABYLON.ColorCurves();
                }

                // Update the properties of the existing instance
                colorCurvesInstance.globalHue = settings.globalHue;
                colorCurvesInstance.globalDensity = settings.globalDensity;
                colorCurvesInstance.globalSaturation = settings.globalSaturation;
                colorCurvesInstance.highlightsHue = settings.highlightsHue;
                colorCurvesInstance.highlightsDensity = settings.highlightsDensity;
                colorCurvesInstance.highlightsSaturation = settings.highlightsSaturation;
                colorCurvesInstance.shadowsHue = settings.shadowsHue;
                colorCurvesInstance.shadowsDensity = settings.shadowsDensity;
                colorCurvesInstance.shadowsSaturation = settings.shadowsSaturation;
                
                // Assign the instance to the pipeline (only needs to be done once, but safe to do here)
                props.pipeline.imageProcessing.colorCurves = colorCurvesInstance;
            } else {
                // If color curves are disabled, you might want to dispose of the instance
                // to free up resources, or just leave it for potential re-enabling.
                // For now, setting colorCurvesEnabled to false is sufficient to disable the effect.
                if (colorCurvesInstance) {
                    // If you want to dispose it:
                    // colorCurvesInstance.dispose(); 
                    // colorCurvesInstance = null;
                }
            }
        }
    });
}

function updateEdges() {
    if (!props.scene || !props.meshes) return
    
    Promise.all([
        import('babylonjs'),
        import('@babylonjs/post-processes/edgeDetection/edgeDetectionPostProcess'),
    ]).then(([BABYLON, { EdgeDetectionPostProcess }]) => {
        const edgeColor = BABYLON.Color3.FromHexString('#'+settings.edgeColor)
        
        // Handle edge detection post process for sketch-style edges
        if (settings.showEdges && settings.sketchEdges) {
            // Remove existing post process if it exists
            if (edgeDetectionPostProcess) {
                edgeDetectionPostProcess.dispose()
                edgeDetectionPostProcess = null
            }
            
            // Create new edge detection post process
            const camera = props.scene.activeCamera
            if (camera) {
                try {
                    // Enable geometry buffer renderer if not already enabled
                    if (!props.scene.geometryBufferRenderer) {
                        props.scene.enableGeometryBufferRenderer()
                    }
                    
                    // Use the imported EdgeDetectionPostProcess class
                    // Pass ratio as a fraction (0.5 for half resolution, 1.0 for full resolution)
                    const options = {
                        size: 1.0,
                    }
                    edgeDetectionPostProcess = new EdgeDetectionPostProcess("EdgeDetection", props.scene, options, camera)
                    edgeDetectionPostProcess.edgeWidth = settings.edgeWidth
                    edgeDetectionPostProcess.edgeIntensity = settings.edgeIntensity
                    edgeDetectionPostProcess.edgeColor = edgeColor
                } catch (error) {
                    console.error('Failed to create EdgeDetectionPostProcess:', error)
                }
            }
            
            // Disable mesh-based edge rendering when using post process
            props.meshes.forEach(mesh => {
                if (mesh) {
                    try {
                        mesh.disableEdgesRendering()
                    } catch (error) {
                        console.warn('Failed to disable edge rendering for mesh:', mesh.name, error)
                    }
                }
            })
        } else if (settings.showEdges && !settings.sketchEdges) {
            // Dispose of post process if using mesh-based edges
            if (edgeDetectionPostProcess) {
                edgeDetectionPostProcess.dispose()
                edgeDetectionPostProcess = null
            }
            
            // Use mesh-based edge rendering
            props.meshes.forEach(mesh => {
                if (!mesh) return
                
                try {
                    // Check if the mesh has geometry data and is not already rendering edges
                    if (mesh.geometry || mesh._geometry) {
                        mesh.enableEdgesRendering(0.2)
                        mesh.edgesColor = BABYLON.Color4.FromColor3(edgeColor, 1.0)
                        mesh.edgesWidth = settings.edgeWidth
                    } else {
                        console.warn('Mesh does not have geometry for edge rendering:', mesh.name)
                    }
                } catch (error) {
                    console.warn('Failed to enable edge rendering for mesh:', mesh.name, error)
                }
            })
        } else {
            // Disable all edge rendering
            if (edgeDetectionPostProcess) {
                edgeDetectionPostProcess.dispose()
                edgeDetectionPostProcess = null
            }
            
            props.meshes.forEach(mesh => {
                if (mesh) {
                    try {
                        mesh.disableEdgesRendering()
                    } catch (error) {
                        console.warn('Failed to disable edge rendering for mesh:', mesh.name, error)
                    }
                }
            })
        }
    }).catch(error => {
        console.error('Error importing Babylon.js for edge rendering:', error)
    })
}

// --- FIXED updateMaterials Function ---
function updateMaterials() {
    if (!props.scene || !props.meshes) return

    import('babylonjs').then(BABYLON => {
        props.meshes.forEach(mesh => {
            if (!mesh || !mesh.material) return
            
            // Store original material if not already stored
            if (!originalMaterials.has(mesh.id)) {
                originalMaterials.set(mesh.id, mesh.material)
            }
            
            const originalMaterial = originalMaterials.get(mesh.id)
            let newMaterial = originalMaterial; // Default to restoring the original

            if (settings.whiteMaterials) {
                let whiteMaterial = props.scene.getMaterialByName('whiteMaterial')
                if (!whiteMaterial) {
                    whiteMaterial = new BABYLON.PBRMaterial('whiteMaterial', props.scene)
                    whiteMaterial.albedoColor = new BABYLON.Color3(1, 1, 1)
                    whiteMaterial.metallic = 0.1
                    whiteMaterial.roughness = 0.7
                }
                newMaterial = whiteMaterial
            } else if (settings.watercolorEffect) {
                // Clone the original material to create a unique watercolor version
                const watercolorMaterial = originalMaterial.clone(`${mesh.id}_watercolor`)
                const intensity = settings.watercolorIntensity
                
                // ADDED: Handle both PBR and Standard materials
                if (watercolorMaterial instanceof BABYLON.PBRMaterial) {
                    watercolorMaterial.alpha = 0.9
                    watercolorMaterial.metallic = 0.0
                    watercolorMaterial.roughness = Math.max(0, 1.0 - (intensity * 0.2))
                    
                    if (watercolorMaterial.albedoColor) {
                         const variation = (Math.random() - 0.5) * 0.1 * intensity
                         watercolorMaterial.albedoColor.r = Math.max(0, Math.min(1, watercolorMaterial.albedoColor.r + variation))
                         watercolorMaterial.albedoColor.g = Math.max(0, Math.min(1, watercolorMaterial.albedoColor.g + variation))
                         watercolorMaterial.albedoColor.b = Math.max(0, Math.min(1, watercolorMaterial.albedoColor.b + variation))
                    }
                } else if (watercolorMaterial instanceof BABYLON.StandardMaterial) {
                    watercolorMaterial.alpha = 0.9
                    watercolorMaterial.specularPower = Math.max(16, 64 / intensity)
                    if (watercolorMaterial.specularColor) {
                       watercolorMaterial.specularColor = watercolorMaterial.specularColor.scale(0.5)
                    }
                    if (watercolorMaterial.diffuseColor) {
                        const variation = (Math.random() - 0.5) * 0.2 * intensity
                        watercolorMaterial.diffuseColor.r = Math.max(0, Math.min(1, watercolorMaterial.diffuseColor.r + variation))
                        watercolorMaterial.diffuseColor.g = Math.max(0, Math.min(1, watercolorMaterial.diffuseColor.g + variation))
                        watercolorMaterial.diffuseColor.b = Math.max(0, Math.min(1, watercolorMaterial.diffuseColor.b + variation))
                    }
                }
                newMaterial = watercolorMaterial;
            }
            
            // Apply the new material, only if it's different from the current one
            if (mesh.material !== newMaterial) {
                // If the new material is a clone, dispose of the old one to prevent memory leaks
                if (mesh.material.name.includes('_watercolor')) {
                    mesh.material.dispose();
                }
                mesh.material = newMaterial
            }
        })
    })
}

// --- Helper Functions (hexToColor3 is removed as Babylon.js has a built-in) ---
function saveSettings() {
    try {
        const settingsToSave = JSON.stringify(settings)
        localStorage.setItem('babylonGraphicsSettings', settingsToSave)
        console.log('Graphics settings saved successfully')
        
        // Show success toast
        toast.add({
            severity: 'success',
            summary: 'Settings Saved',
            detail: 'Graphics settings saved successfully!',
            life: 3000
        })
        
    } catch (error) {
        console.error('Failed to save graphics settings:', error)
        
        // Show error toast
        toast.add({
            severity: 'error',
            summary: 'Save Failed',
            detail: 'Failed to save settings',
            life: 3000
        })
    }
}

function loadSettings(showFeedback = true) {
    try {
        const savedSettings = localStorage.getItem('babylonGraphicsSettings')
        if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings)
            Object.assign(settings, parsedSettings)
            
            // Apply all the loaded settings
            updateKeyLight()
            updateFillLight()
            updateAmbientLight()
            updateSunPosition()
            updateShadows()
            updateGround()
            updateImageProcessing()
            updateEdges()
            updateMaterials()
            updatePostProcessing()
            
            console.log('Graphics settings loaded successfully')
            
            // Show success toast only if feedback is requested
            if (showFeedback) {
                toast.add({
                    severity: 'success',
                    summary: 'Settings Loaded',
                    detail: 'Settings loaded successfully!',
                    life: 3000
                })
            }
            
            return true
        } else {
            // Show info toast when no saved settings exist (only if feedback requested)
            if (showFeedback) {
                toast.add({
                    severity: 'info',
                    summary: 'No Saved Settings',
                    detail: 'No saved settings found',
                    life: 3000
                })
            }
            return false
        }
    } catch (error) {
        console.error('Failed to load graphics settings:', error)
        
        // Show error toast only if feedback is requested
        if (showFeedback) {
            toast.add({
                severity: 'error',
                summary: 'Load Failed',
                detail: 'Failed to load settings',
                life: 3000
            })
        }
        
        return false
    }
}

function resetSettings() {
    Object.assign(settings, JSON.parse(JSON.stringify(defaultSettings)))
    
    // Clean up post process
    if (edgeDetectionPostProcess) {
        edgeDetectionPostProcess.dispose()
        edgeDetectionPostProcess = null
    }
    
    // Trigger all update functions
    updateKeyLight()
    updateFillLight()
    updateAmbientLight()
    updateSunPosition()
    updateShadows()
    updateGround()
    updateImageProcessing()
    updateEdges()
    updateMaterials()
    updatePostProcessing()

    // Restore original materials explicitly on reset
    if (originalMaterials.size > 0) {
        props.meshes.forEach(mesh => {
            if (mesh && originalMaterials.has(mesh.id)) {
                const originalMaterial = originalMaterials.get(mesh.id)
                if (mesh.material !== originalMaterial) {
                    // If the current material is a clone or temporary, dispose it
                    if (mesh.material && (mesh.material.name.includes('_watercolor') || mesh.material.name === 'whiteMaterial')) {
                        // Do not dispose the shared white material, it's managed by the scene
                        if (!mesh.material.name.includes('whiteMaterial')) {
                             mesh.material.dispose()
                        }
                    }
                    mesh.material = originalMaterial
                }
            }
        })
        originalMaterials.clear()
    }
}
</script>

<style scoped>
.graphics-settings-container .p-dialog-content {
    padding: 1.5rem;
    background-color: #f8f9fa;
}
.setting-group {
    margin-bottom: 2rem;
    border-bottom: 1px solid #dee2e6;
    padding-bottom: 1.5rem;
}
.setting-group:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}
.setting-group h4 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-weight: 600;
    color: #495057;
}
.setting-item {
    display: flex;
    align-items: center;
    margin-bottom: 1.2rem;
    gap: 1rem;
}
.setting-item label {
    flex: 1;
    font-size: 0.9rem;
    color: #6c757d;
}
.setting-item .p-slider {
    flex: 2;
}
.setting-item .value-display {
    flex-basis: 50px;
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
}
.checkbox-item {
    justify-content: flex-start;
}
.checkbox-item label {
    margin-left: 0.5rem;
    flex: unset;
}
.graphics-dialog .p-dialog-header {
    background-color: #6366F1;
    color: white;
}
.graphics-dialog .p-dialog-header-icon {
    color: white !important;
}
</style>
