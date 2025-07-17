class SnapManager {
    /**
     * @param {BABYLON.Scene} scene The Babylon.js scene.
     * @param {object} options Optional parameters.
     * @param {number} options.snapRadius The radius in pixels to search for snap points.
     * @param {boolean} options.snapToGround Whether to allow snapping to a mesh named "ground".
     */
    constructor(scene, { snapRadius = 15, snapToGround = false } = {}) {
        this.scene = scene;
        this.snapRadius = snapRadius;
        this.snapToGround = snapToGround; // Setting is now controlled via code
        
        this.snapMarker = this.createSnapMarker();
        this.snapMode = "None";
        this.snapPoint = null;
        this.isEnabled = false;
    }

    /** Enables the snapping manager. */
    enable() {
        this.isEnabled = true;
    }

    /** Disables the snapping manager and hides the snap marker. */
    disable() {
        this.isEnabled = false;
        this.hideSnapMarker();
    }

    /** Creates a small sphere to visualize the snap point. */
    createSnapMarker() {
        const marker = BABYLON.MeshBuilder.CreateSphere("snapMarker", { diameter: 0.15 }, this.scene);
        marker.material = new BABYLON.StandardMaterial("snapMarkerMat", this.scene);
        marker.material.disableLighting = true;
        marker.setEnabled(false); // Initially hidden
        marker.isPickable = false;
        return marker;
    }

    /** Main update function to be called in the render loop. */
    update() {
        if (!this.isEnabled) {
            return;
        }

        const pickPredicate = (mesh) => {
            if (mesh.name === "snapMarker") return false;
            if (!this.snapToGround && mesh.name === "ground") return false;
            return true;
        };

        const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY, pickPredicate);

        if (pickResult.hit && pickResult.pickedMesh) {
            const mesh = pickResult.pickedMesh;
            const pointer = new BABYLON.Vector2(this.scene.pointerX, this.scene.pointerY);

            // 1. Check for vertex snapping
            let snapResult = this.findClosestVertex(mesh, pointer);
            if (snapResult) {
                this.snapToPoint(snapResult.point, "Vertex");
            }
            else{
                // 2. Check for edge snapping
                snapResult = this.findClosestEdgePoint(mesh, pointer);
                if (snapResult) {
                    this.snapToPoint(snapResult.point, "Edge");
                }
                else{
                    if (pickResult.pickedPoint) {
                        this.snapToPoint(pickResult.pickedPoint, "Face");
                    }
                }
            }
            
            this.updateMarkerSize();

        } else {
            this.hideSnapMarker();
        }
    }

    /** Dynamically scales the marker to maintain a constant screen size. */
    updateMarkerSize() {
        const camera = this.scene.activeCamera;
        if (!camera) return;
        const initialDiameter = 0.15;
        const desiredScreenSize = 25;
        const engine = this.scene.getEngine();
        const renderHeight = engine.getRenderHeight();
        
        if (renderHeight <= 0) return;

        const distance = BABYLON.Vector3.Distance(camera.position, this.snapMarker.position);
        const worldSize = (desiredScreenSize / renderHeight) * distance * 2.0 * Math.tan(camera.fov / 2.0);
        const scale = worldSize / initialDiameter;

        this.snapMarker.scaling.setAll(scale);
    }

    /** Finds the closest vertex on the mesh to the mouse pointer. */
    /** Finds the closest vertex on the mesh to the mouse pointer. */
    findClosestVertex(mesh, pointer) {
        const vertices = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        if (!vertices) return null;

        const worldMatrix = mesh.getWorldMatrix();
        const transformMatrix = this.scene.getTransformMatrix();
        const engine = this.scene.getEngine();
        const camera = this.scene.activeCamera;
        
        // Get the device pixel ratio
        const devicePixelRatio = window.devicePixelRatio || 1; // Fallback to 1 if not available
        
        let minDistanceSq = this.snapRadius * this.snapRadius;
        let closestVertex = null;

        for (let i = 0; i < vertices.length; i += 3) {
            const vertex = BABYLON.Vector3.TransformCoordinates(
                new BABYLON.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]),
                worldMatrix
            );

            // Project the 3D vertex to 2D screen coordinates (these will be in physical pixels)
            const projectedPoint = BABYLON.Vector3.Project(
                vertex,
                BABYLON.Matrix.Identity(),
                transformMatrix,
                camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
            );

            // Convert the projectedPoint from physical pixels back to CSS pixels
            const projectedPointCSS = new BABYLON.Vector2(
                projectedPoint.x / devicePixelRatio,
                projectedPoint.y / devicePixelRatio
            );

            // Now compare with the pointer (which is in CSS pixels)
            const distSq = BABYLON.Vector2.DistanceSquared(pointer, projectedPointCSS);

            if (distSq < minDistanceSq) {
                minDistanceSq = distSq;
                closestVertex = vertex;
            }
        }

        return closestVertex ? { point: closestVertex, distance: Math.sqrt(minDistanceSq) } : null;
    }

    /** Finds the closest point on any edge of the mesh to the mouse pointer. */
    findClosestEdgePoint(mesh, pointer) {
        const vertices = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const indices = mesh.getIndices();
        if (!vertices || !indices) return null;

        const worldMatrix = mesh.getWorldMatrix();
        const transformMatrix = this.scene.getTransformMatrix();
        const engine = this.scene.getEngine();
        const camera = this.scene.activeCamera;

        const devicePixelRatio = window.devicePixelRatio || 1; // Get device pixel ratio

        let minDistanceSq = this.snapRadius * this.snapRadius;
        let closestPointOnEdge = null;

        for (let i = 0; i < indices.length; i += 3) {
            const v1 = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(vertices[indices[i] * 3], vertices[indices[i] * 3 + 1], vertices[indices[i] * 3 + 2]), worldMatrix);
            const v2 = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(vertices[indices[i + 1] * 3], vertices[indices[i + 1] * 3 + 1], vertices[indices[i + 1] * 3 + 2]), worldMatrix);
            const v3 = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(vertices[indices[i + 2] * 3], vertices[indices[i + 2] * 3 + 1], vertices[indices[i + 2] * 3 + 2]), worldMatrix);

            const edges = [[v1, v2], [v2, v3], [v3, v1]];

            for (const edge of edges) {
                // Project 3D edge points to 2D screen coordinates (physical pixels)
                const p1_2d_physical = BABYLON.Vector3.Project(edge[0], BABYLON.Matrix.Identity(), transformMatrix, camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()));
                const p2_2d_physical = BABYLON.Vector3.Project(edge[1], BABYLON.Matrix.Identity(), transformMatrix, camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()));

                // Convert projected points to CSS pixels
                const p1_2d = new BABYLON.Vector2(p1_2d_physical.x / devicePixelRatio, p1_2d_physical.y / devicePixelRatio);
                const p2_2d = new BABYLON.Vector2(p2_2d_physical.x / devicePixelRatio, p2_2d_physical.y / devicePixelRatio);

                const closestResult = this.getClosestPointOnLine(p1_2d, p2_2d, pointer);
                const distSq = BABYLON.Vector2.DistanceSquared(pointer, closestResult.point);

                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    closestPointOnEdge = BABYLON.Vector3.Lerp(edge[0], edge[1], closestResult.t);
                }
            }
        }
        
        return closestPointOnEdge ? { point: closestPointOnEdge, distance: Math.sqrt(minDistanceSq) } : null;
    }
    
    /** Helper function to find the closest point on a 2D line segment. */
    getClosestPointOnLine(p1, p2, p) {
        const L2 = BABYLON.Vector2.DistanceSquared(p1, p2);
        if (L2 === 0) return { point: p1, t: 0 };
        
        let t = ((p.x - p1.x) * (p2.x - p1.x) + (p.y - p1.y) * (p2.y - p1.y)) / L2;
        t = Math.max(0, Math.min(1, t)); // Clamp t to the segment
        
        return {
            point: new BABYLON.Vector2(p1.x + t * (p2.x - p1.x), p1.y + t * (p2.y - p1.y)),
            t: t
        };
    }

    /** Positions the marker at the snap point. */
    snapToPoint(point, mode) {
        this.snapMarker.position = point;
        this.snapMarker.setEnabled(true);
        this.snapMode = mode;
        this.snapPoint = point;

        const markerMat = this.snapMarker.material;
        switch (mode) {
            case "Vertex":
                markerMat.emissiveColor = BABYLON.Color3.Red();
                break;
            case "Edge":
                markerMat.emissiveColor = BABYLON.Color3.Green();
                break;
            case "Face":
                markerMat.emissiveColor = BABYLON.Color3.Blue();
                break;
        }
    }

    /** Hides the marker and resets the state. */
    hideSnapMarker() {
        if (this.snapMarker.isEnabled()) {
            this.snapMarker.setEnabled(false);
        }
        this.snapMode = "None";
        this.snapPoint = null;
    }

    dispose()
    {
        if (this.snapMarker) {
            this.snapMarker.dispose();
            this.snapMarker = null;
        }
        this.scene = null;
    }
}

export default SnapManager;

        