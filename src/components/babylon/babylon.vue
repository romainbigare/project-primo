<template>
    <div ref="renderCanvasContainer" class="babylon-container">
        <canvas ref="renderCanvas" class="babylon-canvas"></canvas>
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

let engine = null
let scene = null

const renderCanvas = ref(null)

onMounted(async () => {
    // Dynamically import Babylon.js to avoid SSR issues
    const BABYLON = await import('babylonjs')

    engine = new BABYLON.Engine(renderCanvas.value, true)
    scene = new BABYLON.Scene(engine)

    // Camera
    const camera = new BABYLON.ArcRotateCamera(
        'camera',
        Math.PI / 2,
        Math.PI / 2.5,
        5,
        BABYLON.Vector3.Zero(),
        scene
    )
    camera.attachControl(renderCanvas.value, true)

    // Light
    const light = new BABYLON.HemisphericLight(
        'light',
        new BABYLON.Vector3(1, 1, 0),
        scene
    )

    // Simple sphere
    const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 2 }, scene)

    engine.runRenderLoop(() => {
        scene.render()
    })

    // Prevent scroll events from propagating to the page
    renderCanvas.value.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('resize', onResize)
})

function onResize() {
    if (engine) {
        engine.resize()
    }
}

function onWheel(event) {
    // Prevent the scroll event from bubbling up to the document
    event.preventDefault()
    event.stopPropagation()
    
    // The camera controls will still handle the wheel event for zooming
    // since Babylon.js attaches its own wheel listeners directly to the canvas
}

onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize)
    if (renderCanvas.value) {
        renderCanvas.value.removeEventListener('wheel', onWheel)
    }
    if (engine) {
        engine.dispose()
    }
})
</script>