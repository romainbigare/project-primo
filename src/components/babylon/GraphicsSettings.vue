<template>
    <div class="graphics-settings-container">
        <!-- Settings Button -->
        <Button 
            icon="pi pi-cog" 
            class="settings-button" 
            @click="showDialog = true"
            severity="secondary"
            rounded
            text
        />
        
        <!-- Settings Dialog -->
        <Dialog 
            v-model:visible="showDialog" 
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
                            :min="0.5" 
                            :max="5" 
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
                        <label>Sketch-style Edges (Irregular)</label>
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

            </div>
            
            <template #footer>
                <Button label="Reset to Default" @click="resetSettings" severity="secondary" />
                <Button label="Close" @click="showDialog = false" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Slider from 'primevue/slider'
import Checkbox from 'primevue/checkbox'
import ColorPicker from 'primevue/colorpicker'

// --- Props and State (Unchanged) ---
const props = defineProps({
    scene: Object,
    lights: Object,
    ground: Object,
    shadowGenerator: Object,
    meshes: Array
})

const showDialog = ref(false)

const settings = reactive({
    keyLightIntensity: 2.0,
    fillLightIntensity: 1.0,
    ambientIntensity: 0.8,
    sunAngleX: -0.5,
    sunAngleY: -1,
    sunAngleZ: -0.3,
    shadowDarkness: 0.4,
    shadowBlur: 1.2,
    groundOpacity: 0.1,
    showGround: true,
    exposure: 0.8,
    contrast: 1.1,
    showEdges: false,
    edgeColor: '#000000',
    edgeWidth: 1.0,
    sketchEdges: false,
    whiteMaterials: false,
    watercolorEffect: false,
    watercolorIntensity: 1.0
})

const defaultSettings = JSON.parse(JSON.stringify(settings))
let originalMaterials = new Map()

function updateKeyLight() { if (props.lights?.keyLight) props.lights.keyLight.intensity = settings.keyLightIntensity }
function updateFillLight() { if (props.lights?.fillLight) props.lights.fillLight.intensity = settings.fillLightIntensity }
function updateAmbientLight() { if (props.lights?.ambientLight) props.lights.ambientLight.intensity = settings.ambientIntensity }
function updateSunPosition() { if (props.lights?.keyLight) props.lights.keyLight.direction = new BABYLON.Vector3(settings.sunAngleX, settings.sunAngleY, settings.sunAngleZ) }
function updateShadows() { if (props.shadowGenerator) { props.shadowGenerator.darkness = settings.shadowDarkness; props.shadowGenerator.blurScale = settings.shadowBlur } }
function updateGround() { if (props.ground) { props.ground.visibility = settings.showGround ? 1.0 : 0.0; if (props.ground.material) props.ground.material.alpha = settings.groundOpacity } }
function updateImageProcessing() { if (props.scene?.imageProcessingConfiguration) { props.scene.imageProcessingConfiguration.exposure = settings.exposure; props.scene.imageProcessingConfiguration.contrast = settings.contrast } }

function updateEdges() {
    if (!props.scene || !props.meshes) return
    
    import('babylonjs').then(BABYLON => {
        const edgeColor = BABYLON.Color3.FromHexString(settings.edgeColor)
        
        props.meshes.forEach(mesh => {
            if (!mesh) return
            
            if (settings.showEdges) {
                mesh.enableEdgesRendering()
                mesh.edgesColor = edgeColor
                
                // The sketch effect is basic, but now it correctly modifies the width
                if (settings.sketchEdges) {
                    mesh.edgesWidth = settings.edgeWidth * (1 + (Math.random() - 0.5) * 0.4)
                } else {
                    mesh.edgesWidth = settings.edgeWidth
                }
            } else {
                mesh.disableEdgesRendering()
            }
        })
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
function resetSettings() {
    Object.assign(settings, JSON.parse(JSON.stringify(defaultSettings)))
    
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

    // Restore original materials explicitly on reset
    if (originalMaterials.size > 0) {
        props.meshes.forEach(mesh => {
            if (mesh && originalMaterials.has(mesh.id)) {
                 // Dispose of temp materials before restoring
                if (mesh.material.name.includes('_watercolor') || mesh.material.name === 'whiteMaterial') {
                    // Be careful not to dispose the shared whiteMaterial if another mesh still uses it
                } else {
                     mesh.material = originalMaterials.get(mesh.id)
                }
            }
        })
    }
}
</script>

<style scoped>
.graphics-settings-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
}

.settings-button {
    background: rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    color: #666 !important;
    width: 48px;
    height: 48px;
    transition: all 0.3s ease;
}

.settings-button:hover {
    background: rgba(255, 255, 255, 0.2) !important;
    color: #333 !important;
    transform: rotate(45deg);
}

.graphics-dialog .settings-content {
    max-height: 600px;
    overflow-y: auto;
}

.setting-group {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #eee;
}

.setting-group:last-child {
    border-bottom: none;
}

.setting-group h4 {
    margin: 0 0 16px 0;
    color: #333;
    font-weight: 600;
}

.setting-item {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    gap: 12px;
}

.setting-item label {
    min-width: 140px;
    font-weight: 500;
    color: #555;
}

.setting-item .p-slider {
    flex: 1;
}

.value-display {
    min-width: 40px;
    text-align: right;
    font-family: monospace;
    color: #666;
    font-size: 0.9em;
}

.checkbox-item {
    gap: 8px;
}

.checkbox-item label {
    min-width: auto;
    margin-left: 8px;
}

/* Custom scrollbar for dialog content */
.settings-content::-webkit-scrollbar {
    width: 6px;
}

.settings-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.settings-content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.settings-content::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
}
</style>
