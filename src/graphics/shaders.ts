/**
 * Custom Shaders for Primordial Soup:
 * 1. Tilt-Shift Microscope Macro Lens Shader Pass
 * 2. Animated Caustics Floor Shader
 * Zero emojis.
 */

import * as THREE from 'three';

// Tilt-Shift Macro Microscope Shader
export const TiltShiftShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    focusY: { value: 0.5 },       // Center focus line (0.0 to 1.0)
    focusWidth: { value: 0.18 },   // Sharp focus band thickness
    blurMax: { value: 3.5 },       // Maximum blur strength at edges
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    enabled: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float focusY;
    uniform float focusWidth;
    uniform float blurMax;
    uniform vec2 resolution;
    uniform float enabled;
    varying vec2 vUv;

    void main() {
      if (enabled < 0.5) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }

      // Calculate distance from horizontal/center focal plane
      float dist = abs(vUv.y - focusY);
      float blurAmount = smoothstep(focusWidth * 0.5, focusWidth * 1.8, dist) * blurMax;

      if (blurAmount < 0.05) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }

      // 9-tap Poisson/Gaussian directional blur sample
      vec4 sum = vec4(0.0);
      vec2 texel = vec2(1.0 / resolution.x, 1.0 / resolution.y) * blurAmount;

      sum += texture2D(tDiffuse, vUv + vec2(0.0, 0.0)) * 0.22;
      sum += texture2D(tDiffuse, vUv + vec2(-0.8, -1.2) * texel) * 0.11;
      sum += texture2D(tDiffuse, vUv + vec2( 0.8, -1.2) * texel) * 0.11;
      sum += texture2D(tDiffuse, vUv + vec2(-1.2,  0.4) * texel) * 0.11;
      sum += texture2D(tDiffuse, vUv + vec2( 1.2,  0.4) * texel) * 0.11;
      sum += texture2D(tDiffuse, vUv + vec2(-0.4,  1.4) * texel) * 0.09;
      sum += texture2D(tDiffuse, vUv + vec2( 0.4,  1.4) * texel) * 0.09;
      sum += texture2D(tDiffuse, vUv + vec2(-1.6, -0.6) * texel) * 0.08;
      sum += texture2D(tDiffuse, vUv + vec2( 1.6,  0.6) * texel) * 0.08;

      gl_FragColor = sum;
    }
  `,
};

// Caustic ground projection shader for primordial seabed / floor
export const CausticsFloorShader = {
  uniforms: {
    uTime: { value: 0 },
    uColorWater: { value: new THREE.Color(0x040d16) },
    uColorCaustic: { value: new THREE.Color(0x0ea5e9) },
    uIntensity: { value: 0.45 },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldPos;
    void main() {
      vUv = uv;
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColorWater;
    uniform vec3 uColorCaustic;
    uniform float uIntensity;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    // Organic caustic ripple synthesis with smooth multidirectional harmonics
    float causticPattern(vec2 p) {
      vec2 p1 = p * 0.08 + vec2(uTime * 0.04, uTime * 0.02);
      vec2 p2 = p * 0.11 + vec2(-uTime * 0.03, uTime * 0.05);
      vec2 p3 = p * 0.15 + vec2(uTime * 0.02, -uTime * 0.04);

      float c1 = sin(p1.x * 2.4 + cos(p2.y * 2.0));
      float c2 = cos(p2.x * 2.2 + sin(p3.y * 2.6));
      float c3 = sin(p3.x * 2.0 + cos(p1.y * 2.4));

      float val = pow(abs(c1 * c2 + c2 * c3 + c3 * c1) * 0.45, 2.6);
      return val * 1.8;
    }

    void main() {
      vec2 pos = vWorldPos.xz;
      float c = causticPattern(pos);

      // Radial fade towards the outer boundaries
      float d = length(vWorldPos.xz) / 135.0;
      float rimFade = 1.0 - smoothstep(0.55, 1.0, d);

      vec3 finalColor = mix(uColorWater, uColorCaustic, c * uIntensity * rimFade);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};
