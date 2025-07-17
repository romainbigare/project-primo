import * as BABYLON from "babylonjs";
import { PBRCustomMaterial } from "babylonjs-materials";

export class LineMaterial extends PBRCustomMaterial {
    constructor(name, scene) {
        super(name, scene);

        this.FragmentShader = `
            // Helper functions from original shader
            #define TAU 6.28318530718
            #define PI 3.141592653589793

            vec2 hash( vec2 p ) {
                p = vec2( dot(p,vec2(127.1,311.7)),
                    dot(p,vec2(269.5,183.3)) );
                return -1.0 + 2.0*fract(sin(p)*43758.5453123);
            }

            float noise( in vec2 p ) {
                const float K1 = 0.366025404; // (sqrt(3)-1)/2;
                const float K2 = 0.211324865; // (3-sqrt(3))/6;
                
                vec2 i = floor( p + (p.x+p.y)*K1 );
                
                vec2 a = p - i + (i.x+i.y)*K2;
                vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
                vec2 b = a - o + K2;
                vec2 c = a - 1.0 + 2.0*K2;
                
                vec3 h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
                
                vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
                
                return dot( n, vec3(70.0) );
            }

            float luma(vec3 color) {
                return dot(color, vec3(0.299, 0.587, 0.114));
            }

            float lines( in float l, in vec2 fragCoord, in vec2 resolution, in float thickness, in float e){
                vec2 center = vec2(resolution.x/2., resolution.y/2.);
                vec2 uv = fragCoord.xy * resolution;
            
                float c = (.5 + .5 * sin(uv.x*.5));
                float f = (c+thickness)*l;
                f = smoothstep(.5-e, .5+e, f);
                return f;
            }
            
            vec3 blendDarken(vec3 base, vec3 blend, float opacity) {
                return (min(blend,base) * opacity + base * (1.0 - opacity));
            }
        `;
        
        // This is where the main logic from Three.js is injected.
        // It runs after the standard PBR lighting is calculated and stored in `baseColor`.
        this.CustomParts.Fragment_MainEnd = `
            // Calculate luminance from the PBR base color
            float l = luma(baseColor.rgb);
            l = range.x + l * (range.y - range.x);

            // Use world normal and view direction (provided by Babylon.js)
            vec3 n = normalize(vNormalW);
            float a = atan(n.y, n.x);
            a = round(a * angleStep) / angleStep;

            float r = max(0., abs(dot(normalize(vNormalW), normalize(viewDirectionW))));
            float de = .001 * length(vec2(dFdx(gl_FragCoord.x), dFdy(gl_FragCoord.y)));
            float e = .1 * de; 
            vec2 coords = scale * 100. * (vPositionW.xy / (de * 500.)) + linesNoiseAmplitude * noise(linesNoiseScale * vPositionW.xy);

            float border = pow(smoothstep(0., .25, r), rim);
            l *= border;

            r = smoothstep(.8, .8 + e, r);
            a *= 1. - r;

            a += PI / 2.;
            a += angle;
            
            float s = sin(a);
            float c = cos(a);
            mat2 rot = mat2(c, -s, s, c);
            coords = rot * coords;

            float lineVal = lines(l, coords, vec2(5.), thickness + noiseAmplitude * noise(noiseScale * coords.xy), e);

            vec4 paper = texture(paperTexture, vUV); // Use mesh UVs for paper texture
            // Or use screen coordinates for paper texture:
            // vec4 paper = texture(paperTexture, gl_FragCoord.xy / vScreenSize);

            // Blend the final PBR color with the ink lines
            color.rgb = blendDarken(paper.rgb, inkColor, 1.0 - lineVal);
        `;

        // Define all the custom uniforms the shader needs
        this.AddUniform("paperTexture", "sampler2D", null);
        this.AddUniform("inkColor", "vec3", new BABYLON.Color3(0.016, 0.286, 0.349));
        this.AddUniform("range", "vec2", new BABYLON.Vector2(0.17, 1.0));
        this.AddUniform("vScreenSize", "vec2", BABYLON.Vector2.Zero()); // For screen-space textures
        this.AddUniform("scale", "float", 0.65);
        this.AddUniform("angleStep", "float", 4.0);
        this.AddUniform("angle", "float", 0.0);
        this.AddUniform("thickness", "float", 0.9);
        this.AddUniform("rim", "float", 0.9);
        this.AddUniform("noiseScale", "float", 0.1);
        this.AddUniform("noiseAmplitude", "float", 0.3);
        this.AddUniform("linesNoiseScale", "float", 5.0);
        this.AddUniform("linesNoiseAmplitude", "float", 0.5);

        // Standard PBR properties
        this.roughness = 0.4;
        this.metallic = 0.1;

        // Ensure uniforms are updated when properties change
        this.onBind = (mesh) => {
            const effect = this.getEffect();
            const scene = this.getScene();
            const engine = scene.getEngine();
            effect.setVector2("vScreenSize", new BABYLON.Vector2(engine.getRenderWidth(), engine.getRenderHeight()));
        };
    }

    // Add setters to easily control uniforms from your JS code
    set inkColor(value) { this.getEffect().setColor3("inkColor", value); }
    set paperTexture(value) { this.getEffect().setTexture("paperTexture", value); }
    set scale(value) { this.getEffect().setFloat("scale", value); }
    set angleStep(value) { this.getEffect().setFloat("angleStep", value); }
    set angle(value) { this.getEffect().setFloat("angle", value); }
    set thickness(value) { this.getEffect().setFloat("thickness", value); }
    set range(value) { this.getEffect().setVector2("range", value); }
    set rim(value) { this.getEffect().setFloat("rim", value); }
    set noiseScale(value) { this.getEffect().setFloat("noiseScale", value); }
    set noiseAmplitude(value) { this.getEffect().setFloat("noiseAmplitude", value); }
    set linesNoiseScale(value) { this.getEffect().setFloat("linesNoiseScale", value); }
    set linesNoiseAmplitude(value) { this.getEffect().setFloat("linesNoiseAmplitude", value); }
}