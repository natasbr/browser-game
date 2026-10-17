/**
 * Three.js 3D Scene Manager for Primordial Soup Evolution Simulator.
 * Enforces:
 * - Composite 3-12 part procedural models for every organism
 * - Studio PBR lighting with RoomEnvironment, soft shadows, caustic floor
 * - Post-processing tilt-shift microscope macro lens
 * - Instanced micro-particles and food pellets
 * - WebXR 6DOF support for Meta Quest 3
 * Zero emojis.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { PrimordialSimulation } from '../simulation/physicsEngine';
import { CreatureState, DetritusChunk, FoodPellet } from '../types/simulation';
import { TiltShiftShader, CausticsFloorShader } from './shaders';

// Scratch math helpers to avoid per-frame GC allocations
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3Up = new THREE.Vector3(0, 1, 0);
const _colorA = new THREE.Color();
const _matrix4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();

interface CreatureMeshBundle {
  rootGroup: THREE.Group;
  segmentMeshes: THREE.Mesh[];
  nucleusMesh: THREE.Mesh;
  outerMembraneMesh: THREE.Mesh;
  spikesGroup: THREE.Group;
  flagellaLines: THREE.Line[];
  shadowPlanes: THREE.Mesh[];
  vacuoleMeshes: THREE.Mesh[];
}

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  public composer: EffectComposer;
  public tiltShiftPass: ShaderPass;
  public causticsMat: THREE.ShaderMaterial;

  public simulation: PrimordialSimulation;
  public selectedCreatureId: string | null = null;
  public followCamera = false;
  public cameraMode: 'perspective' | 'top_down' = 'perspective';

  // Graphic bundles
  private creatureMeshes = new Map<string, CreatureMeshBundle>();
  private detritusMeshes = new Map<string, THREE.Mesh>();
  private foodInstancedMesh!: THREE.InstancedMesh;
  private particleInstancedMesh!: THREE.InstancedMesh;
  private particlePositions: { x: number; y: number; z: number; speed: number }[] = [];
  private ventGroups: THREE.Group[] = [];

  // Shared reusable geometries & materials
  private sphereGeom = new THREE.SphereGeometry(1, 16, 14);
  private coneGeom = new THREE.ConeGeometry(0.2, 0.9, 6);
  private shadowPlaneGeom = new THREE.PlaneGeometry(1, 1);
  private contactShadowTexture: THREE.CanvasTexture;

  private isDisposed = false;
  private animFrameId: number | null = null;
  private lastTime = 0;

  constructor(container: HTMLElement, simulation: PrimordialSimulation) {
    this.simulation = simulation;

    // 1. Scene & Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x051019);
    this.scene.fog = new THREE.FogExp2(0x051019, 0.0075);

    // 2. Camera
    const aspect = container.clientWidth / container.clientHeight || 1;
    this.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 500);
    this.camera.position.set(0, 75, 45);

    // 3. Renderer with ACESFilmicToneMapping & PBR setup
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: false,
    });
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // WebXR for Meta Quest 3 & 6DOF VR headsets
    this.renderer.xr.enabled = true;
    container.appendChild(this.renderer.domElement);

    const vrBtn = VRButton.createButton(this.renderer);
    vrBtn.id = 'vr-button-mount';
    vrBtn.style.position = 'absolute';
    vrBtn.style.top = '16px';
    vrBtn.style.right = '16px';
    vrBtn.style.bottom = 'auto';
    vrBtn.style.left = 'auto';
    vrBtn.style.zIndex = '50';
    vrBtn.style.padding = '6px 14px';
    vrBtn.style.borderRadius = '8px';
    vrBtn.style.background = '#09111e';
    vrBtn.style.color = '#38bdf8';
    vrBtn.style.border = '1px solid rgba(56, 189, 248, 0.4)';
    vrBtn.style.fontSize = '11px';
    vrBtn.style.fontWeight = '600';
    vrBtn.style.fontFamily = 'monospace';
    container.appendChild(vrBtn);

    // 4. Studio Environment Reflection Map
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 5. Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI * 0.48; // prevent going beneath floor
    this.controls.minDistance = 6;
    this.controls.maxDistance = 180;
    this.controls.target.set(0, 0, 0);

    // 6. Lighting Rig (3 shadow casters max, warm key + cool hemisphere fill)
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f2334, 1.4);
    hemiLight.position.set(0, 60, 0);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(40, 70, 30);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 10;
    keyLight.shadow.camera.far = 180;
    const shadowD = 90;
    keyLight.shadow.camera.left = -shadowD;
    keyLight.shadow.camera.right = shadowD;
    keyLight.shadow.camera.top = shadowD;
    keyLight.shadow.camera.bottom = -shadowD;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.2);
    rimLight.position.set(-50, 40, -40);
    this.scene.add(rimLight);

    // 7. Soft contact shadow texture generated procedurally
    this.contactShadowTexture = this.generateRadialShadowTexture();

    // 8. Caustic Seabed Floor
    this.causticsMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(CausticsFloorShader.uniforms),
      vertexShader: CausticsFloorShader.vertexShader,
      fragmentShader: CausticsFloorShader.fragmentShader,
      side: THREE.DoubleSide,
    });
    const floorGeom = new THREE.PlaneGeometry(360, 360, 32, 32);
    const floorMesh = new THREE.Mesh(floorGeom, this.causticsMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -6.5;
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    // Arena Boundary Ring (Petri Dish Glass Rim)
    const ringGeom = new THREE.TorusGeometry(this.simulation.worldRadius, 1.6, 16, 64);
    const ringMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.85,
      thickness: 1.2,
      opacity: 0.7,
      transparent: true,
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -4.5;
    this.scene.add(ringMesh);

    // 9. Post-Processing Pipeline (Tilt-Shift Macro Lens)
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.tiltShiftPass = new ShaderPass(TiltShiftShader);
    this.tiltShiftPass.uniforms.resolution.value.set(container.clientWidth, container.clientHeight);
    this.tiltShiftPass.uniforms.focusY.value = 0.5;
    this.tiltShiftPass.uniforms.focusWidth.value = 0.22;
    this.tiltShiftPass.uniforms.blurMax.value = 3.2;
    this.tiltShiftPass.uniforms.enabled.value = 1.0;
    this.composer.addPass(this.tiltShiftPass);

    // 10. Instanced Meshes for Food & Marine Snow
    this.initInstancedSystems();

    // 11. Build Hydrothermal Vent Structures
    this.initVents();

    // 12. Window Resize Handler
    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize);

    // 13. Start Render Loop
    this.lastTime = performance.now();
    this.renderer.setAnimationLoop(this.animate.bind(this));
  }

  private generateRadialShadowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.28)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private initInstancedSystems() {
    // Food Pellets InstancedMesh (up to 400 pellets)
    const foodGeom = new THREE.IcosahedronGeometry(0.7, 2);
    const foodMat = new THREE.MeshStandardMaterial({
      roughness: 0.35,
      metalness: 0.1,
      emissive: new THREE.Color(0x22c55e),
      emissiveIntensity: 0.45,
    });
    this.foodInstancedMesh = new THREE.InstancedMesh(foodGeom, foodMat, 400);
    this.foodInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.foodInstancedMesh.castShadow = true;
    this.foodInstancedMesh.frustumCulled = false;
    this.scene.add(this.foodInstancedMesh);

    // Plankton / Marine Snow Particles (450 particles)
    const particleGeom = new THREE.TetrahedronGeometry(0.22, 1);
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.45,
    });
    this.particleInstancedMesh = new THREE.InstancedMesh(particleGeom, particleMat, 450);
    this.particleInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.particleInstancedMesh.frustumCulled = false;

    for (let i = 0; i < 450; i++) {
      const x = (Math.random() - 0.5) * this.simulation.worldRadius * 2.1;
      const y = -5 + Math.random() * 18;
      const z = (Math.random() - 0.5) * this.simulation.worldRadius * 2.1;
      this.particlePositions.push({ x, y, z, speed: 0.2 + Math.random() * 0.4 });

      _matrix4.makeTranslation(x, y, z);
      this.particleInstancedMesh.setMatrixAt(i, _matrix4);
    }
    this.particleInstancedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.particleInstancedMesh);
  }

  private initVents() {
    for (const vent of this.simulation.vents) {
      const ventGroup = new THREE.Group();
      ventGroup.position.set(vent.x, -6.5, vent.z);

      // Vent Chimney cone with rough rocky texture
      const cone = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 4.5, 5.0, 10),
        new THREE.MeshStandardMaterial({
          color: 0x1c1917,
          roughness: 0.9,
          metalness: 0.1,
        })
      );
      cone.position.y = 2.5;
      cone.castShadow = true;
      cone.receiveShadow = true;
      ventGroup.add(cone);

      // Vent glowing caldera mouth
      const mouth = new THREE.Mesh(
        new THREE.RingGeometry(0.2, 1.3, 12),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
        })
      );
      mouth.rotation.x = -Math.PI / 2;
      mouth.position.y = 5.05;
      ventGroup.add(mouth);

      // Vent glow point light
      const pLight = new THREE.PointLight(0x06b6d4, 1.5, 18);
      pLight.position.y = 5.8;
      ventGroup.add(pLight);

      this.ventGroups.push(ventGroup);
      this.scene.add(ventGroup);
    }
  }

  /**
   * Builds a composite 3 to 12 part procedural model for an organism:
   * 1. Multi-segment spine spheres
   * 2. Pulsing luminous chromatin nucleus
   * 3. Outer cytoplasm translucent envelope
   * 4. Trailing swimming flagella line
   * 5. Dorsal armor ridge spikes
   * 6. Soft ground contact shadow plane
   */
  private createCreatureMeshBundle(c: CreatureState): CreatureMeshBundle {
    const rootGroup = new THREE.Group();
    rootGroup.name = c.id;

    const baseColor = new THREE.Color().setHSL(c.genes.hue / 360, 0.85, 0.55);
    const interiorColor = new THREE.Color().setHSL((c.genes.hue + 25) / 360, 0.95, 0.65);

    // 1. Spine Segment Meshes
    const segmentMeshes: THREE.Mesh[] = [];
    const shadowPlanes: THREE.Mesh[] = [];

    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: baseColor,
      roughness: 0.25,
      metalness: 0.15,
      transmission: 0.45,
      thickness: 0.8,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      emissive: baseColor,
      emissiveIntensity: 0.2,
    });

    const shadowMat = new THREE.MeshBasicMaterial({
      map: this.contactShadowTexture,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });

    for (let i = 0; i < c.segmentCount; i++) {
      const segMesh = new THREE.Mesh(this.sphereGeom, bodyMat);
      segMesh.castShadow = true;
      segMesh.receiveShadow = true;
      rootGroup.add(segMesh);
      segmentMeshes.push(segMesh);

      // Contact shadow plane beneath each segment
      const shadowPlane = new THREE.Mesh(this.shadowPlaneGeom, shadowMat);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -6.45;
      this.scene.add(shadowPlane);
      shadowPlanes.push(shadowPlane);
    }

    // 2. Glowing Organelle Nucleus inside head segment
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: interiorColor,
      emissive: interiorColor,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    });
    const nucleusMesh = new THREE.Mesh(this.sphereGeom, nucleusMat);
    nucleusMesh.scale.setScalar(c.segmentRadii[0] * 0.45);
    rootGroup.add(nucleusMesh);

    // 3. Outer Translucent Cytoplasm Envelope on head
    const outerMembraneMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.85,
      roughness: 0.1,
      ior: 1.33,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const outerMembraneMesh = new THREE.Mesh(this.sphereGeom, outerMembraneMat);
    outerMembraneMesh.scale.setScalar(c.segmentRadii[0] * 1.15);
    rootGroup.add(outerMembraneMesh);

    // 4. Dorsal Armor Ridge / Spikes (Accent details)
    const spikesGroup = new THREE.Group();
    if (c.genes.armor > 0.2) {
      const spikeMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.4,
        roughness: 0.3,
      });
      const spikeCount = Math.floor(3 + c.genes.armor * 5);
      for (let s = 0; s < spikeCount; s++) {
        const spike = new THREE.Mesh(this.coneGeom, spikeMat);
        spike.position.set(0, c.segmentRadii[0] * 0.95, -s * (c.genes.size * 0.5));
        spike.rotation.x = 0.25;
        spike.scale.set(c.genes.size * 0.7, c.genes.size * (0.8 + c.genes.armor * 0.8), c.genes.size * 0.7);
        spike.castShadow = true;
        spikesGroup.add(spike);
      }
    }
    rootGroup.add(spikesGroup);

    // 5. Trailing Swimming Flagella Line (2 tentacles)
    const flagellaLines: THREE.Line[] = [];
    const lineMat = new THREE.LineBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.7,
      linewidth: 2,
    });

    for (let f = 0; f < 2; f++) {
      const lineGeom = new THREE.BufferGeometry();
      const positions = new Float32Array(15 * 3);
      lineGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const flagellaLine = new THREE.Line(lineGeom, lineMat);
      flagellaLine.frustumCulled = false;
      this.scene.add(flagellaLine);
      flagellaLines.push(flagellaLine);
    }

    this.scene.add(rootGroup);

    return {
      rootGroup,
      segmentMeshes,
      nucleusMesh,
      outerMembraneMesh,
      spikesGroup,
      flagellaLines,
      shadowPlanes,
      vacuoleMeshes: [],
    };
  }

  private createDetritusMesh(d: DetritusChunk): THREE.Mesh {
    const geom = new THREE.DodecahedronGeometry(d.radius, 1);
    // Deform vertices for irregular rocky chunk
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const noise = 1.0 + Math.sin(x * 2.5 + z * 1.5) * 0.25;
      pos.setXYZ(i, x * noise, y * 0.7 * noise, z * noise);
    }
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    return mesh;
  }

  private animate(timestamp: number) {
    if (this.isDisposed) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    // 1. Step Simulation
    this.simulation.update(dt);

    // 2. Update Caustics Seabed time uniform
    if (this.causticsMat) {
      this.causticsMat.uniforms.uTime.value = this.simulation.simTime;
    }

    // 3. Update Marine Snow Particles
    for (let i = 0; i < this.particlePositions.length; i++) {
      const p = this.particlePositions[i];
      p.y -= p.speed * dt * 2.5;
      p.x += Math.sin(this.simulation.simTime * 0.5 + i) * dt * 0.6;
      if (p.y < -6.0) {
        p.y = 12.0;
        p.x = (Math.random() - 0.5) * this.simulation.worldRadius * 2.0;
        p.z = (Math.random() - 0.5) * this.simulation.worldRadius * 2.0;
      }
      _matrix4.makeTranslation(p.x, p.y, p.z);
      this.particleInstancedMesh.setMatrixAt(i, _matrix4);
    }
    this.particleInstancedMesh.instanceMatrix.needsUpdate = true;

    // 4. Update Food Pellets Instanced Mesh
    const foodList = this.simulation.foods;
    const foodCount = Math.min(foodList.length, 400);
    this.foodInstancedMesh.count = foodCount;

    for (let i = 0; i < foodCount; i++) {
      const f = foodList[i];
      _vec3A.set(f.x, f.y, f.z);
      _quat.setFromAxisAngle(_vec3Up, f.age * 2.0);
      _vec3B.setScalar(f.radius);
      _matrix4.compose(_vec3A, _quat, _vec3B);
      this.foodInstancedMesh.setMatrixAt(i, _matrix4);

      _colorA.setHSL(f.hue / 360, 0.85, 0.5);
      this.foodInstancedMesh.setColorAt(i, _colorA);
    }
    this.foodInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.foodInstancedMesh.instanceColor) {
      this.foodInstancedMesh.instanceColor.needsUpdate = true;
    }

    // 5. Update Detritus Meshes
    const activeDetritusIds = new Set(this.simulation.detritus.map((d) => d.id));
    for (const [id, mesh] of this.detritusMeshes.entries()) {
      if (!activeDetritusIds.has(id)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        this.detritusMeshes.delete(id);
      }
    }
    for (const d of this.simulation.detritus) {
      let mesh = this.detritusMeshes.get(d.id);
      if (!mesh) {
        mesh = this.createDetritusMesh(d);
        this.detritusMeshes.set(d.id, mesh);
      }
      mesh.position.set(d.x, d.y, d.z);
      mesh.rotation.set(d.rotX, d.rotY, d.rotZ);
    }

    // 6. Update Creature Procedural Composite Meshes
    const activeCreatureIds = new Set(this.simulation.creatures.map((c) => c.id));
    for (const [id, bundle] of this.creatureMeshes.entries()) {
      if (!activeCreatureIds.has(id)) {
        this.scene.remove(bundle.rootGroup);
        for (const sp of bundle.shadowPlanes) {
          this.scene.remove(sp);
        }
        for (const fl of bundle.flagellaLines) {
          this.scene.remove(fl);
          fl.geometry.dispose();
        }
        this.creatureMeshes.delete(id);
      }
    }

    for (const c of this.simulation.creatures) {
      let bundle = this.creatureMeshes.get(c.id);
      if (!bundle) {
        bundle = this.createCreatureMeshBundle(c);
        this.creatureMeshes.set(c.id, bundle);
      }

      // Root position & heading
      bundle.rootGroup.position.set(c.x, c.y, c.z);
      bundle.rootGroup.rotation.y = -c.heading;

      // Soft-body squish deformation scale
      const squishX = c.squishFactor;
      const squishZ = 1.0 / Math.max(0.5, Math.sqrt(squishX));

      // Segment positioning (world coordinates mapped to root)
      for (let s = 0; s < c.segmentCount; s++) {
        const segPos = c.segmentPositions[s];
        const segMesh = bundle.segmentMeshes[s];
        const shadowPlane = bundle.shadowPlanes[s];
        const r = c.segmentRadii[s];

        if (segMesh) {
          // Convert global segPos to rootGroup local pos
          _vec3A.set(segPos.x - c.x, segPos.y - c.y, segPos.z - c.z);
          _vec3A.applyAxisAngle(_vec3Up, c.heading);
          segMesh.position.copy(_vec3A);
          segMesh.scale.set(r * squishX, r, r * squishZ);
        }

        if (shadowPlane) {
          shadowPlane.position.set(segPos.x, -6.45, segPos.z);
          const shadowScale = r * 2.8;
          shadowPlane.scale.set(shadowScale, shadowScale, 1);
        }
      }

      // Nucleus pulse inside head
      const nScale = c.segmentRadii[0] * (0.42 + Math.sin(c.wigglePhase * 1.5) * 0.08);
      bundle.nucleusMesh.scale.setScalar(nScale);

      // Flagella undulation tentacles
      const tailIndex = c.segmentCount - 1;
      const tailPos = c.segmentPositions[tailIndex];
      for (let f = 0; f < bundle.flagellaLines.length; f++) {
        const line = bundle.flagellaLines[f];
        const posAttr = line.geometry.attributes.position as THREE.BufferAttribute;
        const count = 15;
        const fOffset = f === 0 ? 0.35 : -0.35;

        for (let k = 0; k < count; k++) {
          const t = k / (count - 1);
          const wave = Math.sin(c.wigglePhase * 1.2 - k * 0.6 + f * Math.PI) * (0.4 + t * 0.8) * c.genes.size;
          const lx = tailPos.x - Math.cos(c.heading) * (k * c.genes.size * 0.45) - Math.sin(c.heading) * (wave + fOffset);
          const lz = tailPos.z - Math.sin(c.heading) * (k * c.genes.size * 0.45) + Math.cos(c.heading) * (wave + fOffset);
          const ly = tailPos.y + Math.cos(c.wigglePhase * 0.8 + k * 0.3) * 0.2;
          posAttr.setXYZ(k, lx, ly, lz);
        }
        posAttr.needsUpdate = true;
      }
    }

    // 7. Camera Follow Mode
    if (this.followCamera && this.selectedCreatureId) {
      const selected = this.simulation.creatures.find((c) => c.id === this.selectedCreatureId);
      if (selected) {
        const targetX = selected.x;
        const targetZ = selected.z;
        this.controls.target.x = THREE.MathUtils.damp(this.controls.target.x, targetX, 5.0, dt);
        this.controls.target.z = THREE.MathUtils.damp(this.controls.target.z, targetZ, 5.0, dt);

        if (this.cameraMode === 'top_down') {
          this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetX, 4.0, dt);
          this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetZ + 0.01, 4.0, dt);
        }
      }
    }

    // 8. Controls Update & Render
    this.controls.update();

    if (this.renderer.xr.isPresenting) {
      // In WebXR VR mode, render directly with stereo cameras
      this.renderer.render(this.scene, this.camera);
    } else {
      // In Desktop / Mobile browser, render through Tilt-Shift Postprocessing pass
      this.composer.render();
    }
  }

  public setCameraPreset(mode: 'perspective' | 'top_down' | 'macro') {
    this.cameraMode = mode === 'top_down' ? 'top_down' : 'perspective';
    if (mode === 'top_down') {
      this.camera.position.set(0, 95, 0.1);
      this.controls.target.set(0, 0, 0);
    } else if (mode === 'macro') {
      // Macro zoom tilt-shift view
      this.camera.position.set(0, 24, 18);
      this.tiltShiftPass.uniforms.blurMax.value = 4.2;
      this.tiltShiftPass.uniforms.focusWidth.value = 0.14;
    } else {
      this.camera.position.set(0, 75, 45);
      this.tiltShiftPass.uniforms.blurMax.value = 3.2;
      this.tiltShiftPass.uniforms.focusWidth.value = 0.22;
    }
  }

  public setTiltShift(enabled: boolean, blurStrength: number = 3.2) {
    this.tiltShiftPass.uniforms.enabled.value = enabled ? 1.0 : 0.0;
    this.tiltShiftPass.uniforms.blurMax.value = blurStrength;
  }

  private onWindowResize() {
    const parent = this.renderer.domElement.parentElement;
    if (!parent) return;
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
    this.tiltShiftPass.uniforms.resolution.value.set(width, height);
  }

  public raycast(clientX: number, clientY: number): { creatureId: string | null; worldPoint: THREE.Vector3 | null } {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);

    // Check creatures
    let closestCreature: string | null = null;
    let minCreatureDist = Infinity;

    for (const c of this.simulation.creatures) {
      const distToRay = raycaster.ray.distanceToPoint(_vec3A.set(c.x, c.y, c.z));
      const hitRadius = c.genes.size * 1.5;
      if (distToRay < hitRadius && distToRay < minCreatureDist) {
        minCreatureDist = distToRay;
        closestCreature = c.id;
      }
    }

    // Intersect floor plane for ground coordinates
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersect);

    return {
      creatureId: closestCreature,
      worldPoint: intersect,
    };
  }

  public dispose() {
    this.isDisposed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    this.controls.dispose();
    this.renderer.dispose();
    this.sphereGeom.dispose();
    this.coneGeom.dispose();
    this.shadowPlaneGeom.dispose();
    this.contactShadowTexture.dispose();
  }
}
