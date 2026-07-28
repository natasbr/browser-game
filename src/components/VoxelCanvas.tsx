import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  PlayerInputState,
  MonsterType,
  StageTheme,
  GameStatePayload,
  CollectibleItem,
} from '../types';
import { sound } from '../lib/sound';

interface VoxelCanvasProps {
  p1Input: PlayerInputState;
  p2Input: PlayerInputState;
  p1MonsterType?: MonsterType;
  p2MonsterType?: MonsterType;
  stageTheme?: StageTheme;
  onGameStateUpdate?: (state: GameStatePayload) => void;
  isHostView?: boolean;
}

// Biome Color Palette Configuration
interface BiomeConfig {
  name: string;
  bgColor: THREE.Color;
  grid1Color: THREE.Color;
  grid2Color: THREE.Color;
  pillarGlow: THREE.Color;
  fogDensity: number;
}

const BIOMES: Record<StageTheme, BiomeConfig> = {
  cyber_grid: {
    name: 'Cyber Grid',
    bgColor: new THREE.Color(0x0c0d18),
    grid1Color: new THREE.Color(0x3b82f6),
    grid2Color: new THREE.Color(0x1e293b),
    pillarGlow: new THREE.Color(0x38bdf8),
    fogDensity: 0.02,
  },
  volcanic_pit: {
    name: 'Volcanic Pit',
    bgColor: new THREE.Color(0x1a0808),
    grid1Color: new THREE.Color(0xef4444),
    grid2Color: new THREE.Color(0x450a0a),
    pillarGlow: new THREE.Color(0xf97316),
    fogDensity: 0.025,
  },
  neon_dojo: {
    name: 'Neon Dojo',
    bgColor: new THREE.Color(0x12072b),
    grid1Color: new THREE.Color(0xa855f7),
    grid2Color: new THREE.Color(0x3b0764),
    pillarGlow: new THREE.Color(0xec4899),
    fogDensity: 0.02,
  },
  crystal_cave: {
    name: 'Crystal Cave',
    bgColor: new THREE.Color(0x051a1a),
    grid1Color: new THREE.Color(0x10b981),
    grid2Color: new THREE.Color(0x064e3b),
    pillarGlow: new THREE.Color(0x34d399),
    fogDensity: 0.022,
  },
  verdant_forest: {
    name: 'Verdant Forest',
    bgColor: new THREE.Color(0x06180e),
    grid1Color: new THREE.Color(0x22c55e),
    grid2Color: new THREE.Color(0x14532d),
    pillarGlow: new THREE.Color(0x84cc16),
    fogDensity: 0.02,
  },
};

const THEME_ORDER: StageTheme[] = [
  'cyber_grid',
  'verdant_forest',
  'crystal_cave',
  'volcanic_pit',
  'neon_dojo',
];

export const VoxelCanvas: React.FC<VoxelCanvasProps> = ({
  p1Input,
  p2Input,
  p1MonsterType = 'blaze_dino',
  p2MonsterType = 'frost_wolf',
  stageTheme = 'cyber_grid',
  onGameStateUpdate,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const p1InputRef = useRef<PlayerInputState>(p1Input);
  p1InputRef.current = p1Input;
  const p2InputRef = useRef<PlayerInputState>(p2Input);
  p2InputRef.current = p2Input;

  const forcedThemeRef = useRef<StageTheme>(stageTheme);
  forcedThemeRef.current = stageTheme;

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 500;

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();

    const currentBiomeKey = forcedThemeRef.current;
    const initialBiome = BIOMES[currentBiomeKey];

    const activeBgColor = initialBiome.bgColor.clone();
    const activeGrid1Color = initialBiome.grid1Color.clone();
    const activeGrid2Color = initialBiome.grid2Color.clone();
    const activePillarGlow = initialBiome.pillarGlow.clone();

    scene.background = activeBgColor;
    scene.fog = new THREE.FogExp2(activeBgColor.getHex(), initialBiome.fogDensity);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 7.5, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;

    mountRef.current.appendChild(renderer.domElement);

    // --- LIGHTS ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(6, 14, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 512;
    dirLight.shadow.mapSize.height = 512;
    scene.add(dirLight);

    // --- ARENA STAGE (3D EXPANDED GRID) ---
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    const floorSize = 28;
    const tileSize = 1;
    const floorGeo = new THREE.BoxGeometry(tileSize, 0.2, tileSize);

    for (let x = -floorSize / 2; x < floorSize / 2; x++) {
      for (let z = -floorSize / 2; z < floorSize / 2; z++) {
        const isAlt = (x + z) % 2 === 0;
        const mat = new THREE.MeshLambertMaterial({
          color: isAlt ? 0x1e2030 : 0x141522,
        });
        const tile = new THREE.Mesh(floorGeo, mat);
        tile.position.set(x + 0.5, -0.1, z + 0.5);
        tile.receiveShadow = true;
        stageGroup.add(tile);
      }
    }

    const gridHelper = new THREE.GridHelper(floorSize, floorSize, activeGrid1Color, activeGrid2Color);
    gridHelper.position.y = 0.01;
    stageGroup.add(gridHelper);

    // Pillars & Deco Meshes
    const pillarGeo = new THREE.BoxGeometry(0.8, 5, 0.8);
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x2d2f45 });
    const topGlowMat = new THREE.MeshBasicMaterial({ color: activePillarGlow });

    const pillarGlowMeshes: THREE.Mesh[] = [];

    const pillarPositions = [
      [-12, -12], [12, -12], [-12, 12], [12, 12],
      [-12, 0], [12, 0], [0, -12], [0, 12],
    ];

    pillarPositions.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(px, 2.5, pz);
      pillar.castShadow = true;
      stageGroup.add(pillar);

      const glowMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.9), topGlowMat);
      glowMesh.position.set(px, 5.1, pz);
      stageGroup.add(glowMesh);
      pillarGlowMeshes.push(glowMesh);
    });

    // --- VOXEL MONSTER MESH BUILDER ---
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    function createVoxelBox(
      w: number,
      h: number,
      d: number,
      color: number,
      x: number,
      y: number,
      z: number,
      parent: THREE.Object3D
    ) {
      const mat = new THREE.MeshLambertMaterial({ color });
      const mesh = new THREE.Mesh(boxGeo, mat);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }

    function buildMonsterMesh(mType: MonsterType) {
      const monsterGroup = new THREE.Group();
      const bodyGroup = new THREE.Group();
      monsterGroup.add(bodyGroup);

      let primary = 0xef4444; // Blaze Dino
      let belly = 0xfef08a;
      let eyes = 0x22c55e;
      let horns = 0xd97706;

      if (mType === 'frost_wolf') {
        primary = 0x06b6d4;
        belly = 0xe0f2fe;
        eyes = 0x3b82f6;
        horns = 0x0284c7;
      } else if (mType === 'volt_dragon') {
        primary = 0xeab308;
        belly = 0xfef08a;
        eyes = 0xef4444;
        horns = 0xca8a04;
      } else if (mType === 'terra_golem') {
        primary = 0x10b981;
        belly = 0x064e3b;
        eyes = 0xf59e0b;
        horns = 0x334155;
      } else if (mType === 'shadow_beast') {
        primary = 0x8b5cf6;
        belly = 0x3b0764;
        eyes = 0xef4444;
        horns = 0x4c1d95;
      }

      // Torso
      createVoxelBox(0.9, 0.9, 0.8, primary, 0, 0.9, 0, bodyGroup);
      createVoxelBox(0.7, 0.7, 0.1, belly, 0, 0.9, 0.41, bodyGroup);

      // Head
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.4, 0.1);
      bodyGroup.add(headGroup);

      createVoxelBox(0.95, 0.8, 0.9, primary, 0, 0.2, 0, headGroup);
      createVoxelBox(0.75, 0.45, 0.5, primary, 0, 0.05, 0.55, headGroup);
      createVoxelBox(0.8, 0.08, 0.52, 0x1e293b, 0, -0.08, 0.55, headGroup);

      // Eyes
      createVoxelBox(0.18, 0.22, 0.1, eyes, 0.32, 0.28, 0.46, headGroup);
      createVoxelBox(0.18, 0.22, 0.1, eyes, -0.32, 0.28, 0.46, headGroup);
      createVoxelBox(0.08, 0.12, 0.11, 0x000000, 0.34, 0.28, 0.47, headGroup);
      createVoxelBox(0.08, 0.12, 0.11, 0x000000, -0.34, 0.28, 0.47, headGroup);

      // Horns
      createVoxelBox(0.2, 0.35, 0.2, horns, 0, 0.75, -0.2, headGroup);
      createVoxelBox(0.15, 0.25, 0.15, horns, 0.25, 0.65, -0.2, headGroup);
      createVoxelBox(0.15, 0.25, 0.15, horns, -0.25, 0.65, -0.2, headGroup);

      // Arms
      const leftArm = new THREE.Group();
      leftArm.position.set(-0.55, 1.0, 0);
      bodyGroup.add(leftArm);
      createVoxelBox(0.28, 0.5, 0.28, primary, 0, -0.15, 0, leftArm);

      const rightArm = new THREE.Group();
      rightArm.position.set(0.55, 1.0, 0);
      bodyGroup.add(rightArm);
      createVoxelBox(0.28, 0.5, 0.28, primary, 0, -0.15, 0, rightArm);

      // Legs
      const leftLeg = new THREE.Group();
      leftLeg.position.set(-0.3, 0.45, 0);
      bodyGroup.add(leftLeg);
      createVoxelBox(0.32, 0.5, 0.35, primary, 0, -0.15, 0, leftLeg);

      const rightLeg = new THREE.Group();
      rightLeg.position.set(0.3, 0.45, 0);
      bodyGroup.add(rightLeg);
      createVoxelBox(0.32, 0.5, 0.35, primary, 0, -0.15, 0, rightLeg);

      // Tail
      const tail = new THREE.Group();
      tail.position.set(0, 0.6, -0.4);
      bodyGroup.add(tail);
      createVoxelBox(0.3, 0.3, 0.6, primary, 0, 0, -0.25, tail);

      return {
        monsterGroup,
        bodyGroup,
        headGroup,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
      };
    }

    const p1Mesh = buildMonsterMesh(p1MonsterType);
    const p2Mesh = buildMonsterMesh(p2MonsterType);
    scene.add(p1Mesh.monsterGroup);
    scene.add(p2Mesh.monsterGroup);

    // --- CO-OP COLLECTIBLES (GEMS, STARS, CHESTS) ---
    const collectibleMeshes: Map<string, THREE.Group> = new Map();

    const initialItems: CollectibleItem[] = [
      { id: '1', x: -4, y: 0.6, z: -3, type: 'gem', points: 100, active: true, color: '#38bdf8' },
      { id: '2', x: 4, y: 0.6, z: -3, type: 'gem', points: 100, active: true, color: '#f43f5e' },
      { id: '3', x: 0, y: 0.6, z: 4, type: 'star', points: 250, active: true, color: '#eab308' },
      { id: '4', x: -5, y: 0.6, z: 5, type: 'gem', points: 100, active: true, color: '#a855f7' },
      { id: '5', x: 5, y: 0.6, z: -6, type: 'relic', points: 300, active: true, color: '#10b981' },
      { id: '6', x: 0, y: 0.8, z: 0, type: 'chest', points: 500, active: true, color: '#f59e0b' },
    ];

    function createItemMesh(item: CollectibleItem): THREE.Group {
      const group = new THREE.Group();
      group.position.set(item.x, item.y, item.z);

      if (item.type === 'chest') {
        // Treasure Chest
        const baseMat = new THREE.MeshLambertMaterial({ color: 0xb45309 });
        const trimMat = new THREE.MeshLambertMaterial({ color: 0xfef08a });

        const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.6), baseMat);
        base.castShadow = true;
        group.add(base);

        const lid = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.3, 0.65), trimMat);
        lid.position.y = 0.4;
        group.add(lid);
      } else if (item.type === 'star') {
        const mat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
        const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.45), mat);
        group.add(star);
      } else if (item.type === 'relic') {
        const mat = new THREE.MeshLambertMaterial({ color: 0x10b981 });
        const relic = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4), mat);
        relic.castShadow = true;
        group.add(relic);
      } else {
        // Standard Gem
        const mat = new THREE.MeshLambertMaterial({ color: item.color });
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), mat);
        gem.castShadow = true;
        group.add(gem);
      }

      scene.add(group);
      return group;
    }

    initialItems.forEach((item) => {
      collectibleMeshes.set(item.id, createItemMesh(item));
    });

    // Floating Score Sparkle Effects
    const sparkleGroup = new THREE.Group();
    scene.add(sparkleGroup);

    // --- GAME ENGINE STATE ---
    let p1State = {
      x: -2.5,
      y: 0,
      z: 2.0,
      vx: 0,
      vy: 0,
      vz: 0,
      facing: 'right' as 'left' | 'right' | 'up' | 'down',
      isGrounded: true,
      isDashing: false,
      dashTimer: 0,
      score: 0,
      gemsCollected: 0,
      actionText: 'CO-OP READY!',
    };

    let p2State = {
      x: 2.5,
      y: 0,
      z: 2.0,
      vx: 0,
      vy: 0,
      vz: 0,
      facing: 'left' as 'left' | 'right' | 'up' | 'down',
      isGrounded: true,
      isDashing: false,
      dashTimer: 0,
      score: 0,
      gemsCollected: 0,
      actionText: 'CO-OP READY!',
    };

    let teamTotalScore = 0;
    let totalDistanceExplored = 0;
    let activeBiomeIndex = 0;
    let announcementText = 'EXPLORE & COLLECT CO-OP GEMS!';

    let prevP1Input = { jump: false, dash: false };
    let prevP2Input = { jump: false, dash: false };

    // --- ANIMATION & PHYSICS LOOP ---
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const dt = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      const speed = 5.2;

      // 1. UPDATE PLAYER 1 (X & Z AXIS MOVEMENT)
      const in1 = p1InputRef.current;
      let p1MoveX = 0;
      let p1MoveZ = 0;

      if (in1.left) p1MoveX -= 1;
      if (in1.right) p1MoveX += 1;
      if (in1.up) p1MoveZ -= 1;
      if (in1.down) p1MoveZ += 1;

      // Normalize diagonal speed
      if (p1MoveX !== 0 && p1MoveZ !== 0) {
        p1MoveX *= 0.7071;
        p1MoveZ *= 0.7071;
      }

      if (p1MoveX !== 0 || p1MoveZ !== 0) {
        const mult = p1State.isDashing ? 2.2 : 1.0;
        p1State.vx = p1MoveX * speed * mult;
        p1State.vz = p1MoveZ * speed * mult;

        if (Math.abs(p1MoveX) > Math.abs(p1MoveZ)) {
          p1State.facing = p1MoveX > 0 ? 'right' : 'left';
        } else {
          p1State.facing = p1MoveZ > 0 ? 'down' : 'up';
        }
      } else {
        p1State.vx *= 0.7;
        p1State.vz *= 0.7;
      }

      // Dash Skill
      if (in1.dash && !prevP1Input.dash && !p1State.isDashing) {
        p1State.isDashing = true;
        p1State.dashTimer = 0.25;
        sound.playDash();
        p1State.actionText = 'P1 DASH!';
      }
      prevP1Input.dash = in1.dash;

      if (p1State.isDashing) {
        p1State.dashTimer -= dt;
        if (p1State.dashTimer <= 0) p1State.isDashing = false;
      }

      // Jump (Y)
      if (in1.jump && !prevP1Input.jump && p1State.isGrounded) {
        p1State.vy = 7.0;
        p1State.isGrounded = false;
        sound.playJump();
        p1State.actionText = 'P1 JUMP!';
      }
      prevP1Input.jump = in1.jump;

      if (!p1State.isGrounded) {
        p1State.vy -= 22 * dt;
        p1State.y += p1State.vy * dt;
        if (p1State.y <= 0) {
          p1State.y = 0;
          p1State.vy = 0;
          p1State.isGrounded = true;
        }
      }

      p1State.x += p1State.vx * dt;
      p1State.z += p1State.vz * dt;
      p1State.x = Math.max(-13, Math.min(13, p1State.x));
      p1State.z = Math.max(-13, Math.min(13, p1State.z));

      // 2. UPDATE PLAYER 2 (X & Z AXIS MOVEMENT)
      const in2 = p2InputRef.current;
      let p2MoveX = 0;
      let p2MoveZ = 0;

      if (in2.left) p2MoveX -= 1;
      if (in2.right) p2MoveX += 1;
      if (in2.up) p2MoveZ -= 1;
      if (in2.down) p2MoveZ += 1;

      if (p2MoveX !== 0 && p2MoveZ !== 0) {
        p2MoveX *= 0.7071;
        p2MoveZ *= 0.7071;
      }

      if (p2MoveX !== 0 || p2MoveZ !== 0) {
        const mult = p2State.isDashing ? 2.2 : 1.0;
        p2State.vx = p2MoveX * speed * mult;
        p2State.vz = p2MoveZ * speed * mult;

        if (Math.abs(p2MoveX) > Math.abs(p2MoveZ)) {
          p2State.facing = p2MoveX > 0 ? 'right' : 'left';
        } else {
          p2State.facing = p2MoveZ > 0 ? 'down' : 'up';
        }
      } else {
        p2State.vx *= 0.7;
        p2State.vz *= 0.7;
      }

      // Dash
      if (in2.dash && !prevP2Input.dash && !p2State.isDashing) {
        p2State.isDashing = true;
        p2State.dashTimer = 0.25;
        sound.playDash();
        p2State.actionText = 'P2 DASH!';
      }
      prevP2Input.dash = in2.dash;

      if (p2State.isDashing) {
        p2State.dashTimer -= dt;
        if (p2State.dashTimer <= 0) p2State.isDashing = false;
      }

      // Jump
      if (in2.jump && !prevP2Input.jump && p2State.isGrounded) {
        p2State.vy = 7.0;
        p2State.isGrounded = false;
        sound.playJump();
        p2State.actionText = 'P2 JUMP!';
      }
      prevP2Input.jump = in2.jump;

      if (!p2State.isGrounded) {
        p2State.vy -= 22 * dt;
        p2State.y += p2State.vy * dt;
        if (p2State.y <= 0) {
          p2State.y = 0;
          p2State.vy = 0;
          p2State.isGrounded = true;
        }
      }

      p2State.x += p2State.vx * dt;
      p2State.z += p2State.vz * dt;
      p2State.x = Math.max(-13, Math.min(13, p2State.x));
      p2State.z = Math.max(-13, Math.min(13, p2State.z));

      // 3. DISTANCE EXPLORED & GRADUAL DYNAMIC THEME SHIFT
      const moveDistThisFrame =
        Math.hypot(p1State.vx, p1State.vz) * dt + Math.hypot(p2State.vx, p2State.vz) * dt;

      totalDistanceExplored += moveDistThisFrame;

      // Determine target biome from distance or dropdown override
      const targetBiomeTheme =
        forcedThemeRef.current !== 'cyber_grid'
          ? forcedThemeRef.current
          : THEME_ORDER[Math.floor(totalDistanceExplored / 45) % THEME_ORDER.length];

      const targetBiome = BIOMES[targetBiomeTheme];

      // Smooth lerp scene colors to naturally shift theme
      activeBgColor.lerp(targetBiome.bgColor, 0.03);
      activeGrid1Color.lerp(targetBiome.grid1Color, 0.03);
      activeGrid2Color.lerp(targetBiome.grid2Color, 0.03);
      activePillarGlow.lerp(targetBiome.pillarGlow, 0.03);

      scene.background = activeBgColor;
      if (scene.fog) {
        (scene.fog as THREE.FogExp2).color = activeBgColor;
      }

      gridHelper.color1.copy(activeGrid1Color);
      gridHelper.color2.copy(activeGrid2Color);

      pillarGlowMeshes.forEach((gm) => {
        (gm.material as THREE.MeshBasicMaterial).color.copy(activePillarGlow);
      });

      // 4. CO-OP ITEM PICKUP & DOUBLE COMBO DETECTION
      initialItems.forEach((item) => {
        if (!item.active) return;

        const meshGroup = collectibleMeshes.get(item.id);
        if (meshGroup) {
          meshGroup.rotation.y += dt * 2.5;
          meshGroup.position.y = item.y + Math.sin(time * 3 + Number(item.id)) * 0.15;
        }

        const d1 = Math.hypot(p1State.x - item.x, p1State.z - item.z);
        const d2 = Math.hypot(p2State.x - item.x, p2State.z - item.z);
        const playerDist = Math.hypot(p1State.x - p2State.x, p1State.z - p2State.z);

        // CO-OP DOUBLE TEAM BONUS (both players near chest/relic)
        if (d1 < 1.8 && d2 < 1.8 && (item.type === 'chest' || item.type === 'relic')) {
          item.active = false;
          if (meshGroup) meshGroup.visible = false;

          const bonus = item.points * 2 + 300;
          teamTotalScore += bonus;
          p1State.score += bonus / 2;
          p2State.score += bonus / 2;
          p1State.gemsCollected += 1;
          p2State.gemsCollected += 1;

          announcementText = `🌟 CO-OP DOUBLE TEAM BONUS! +${bonus} PTS!`;
          p1State.actionText = 'CO-OP TEAM BONUS!';
          p2State.actionText = 'CO-OP TEAM BONUS!';
          sound.playChestOpen();

          // Respawn item
          setTimeout(() => {
            item.x = (Math.random() - 0.5) * 20;
            item.z = (Math.random() - 0.5) * 20;
            item.active = true;
            if (meshGroup) {
              meshGroup.position.set(item.x, item.y, item.z);
              meshGroup.visible = true;
            }
          }, 6000);
        }
        // Individual P1 pickup
        else if (d1 < 1.2 && p1State.y < 1.5) {
          item.active = false;
          if (meshGroup) meshGroup.visible = false;

          teamTotalScore += item.points;
          p1State.score += item.points;
          p1State.gemsCollected += 1;
          p1State.actionText = `P1 GETS ${item.type.toUpperCase()} (+${item.points})`;
          sound.playGemCollect();

          setTimeout(() => {
            item.x = (Math.random() - 0.5) * 20;
            item.z = (Math.random() - 0.5) * 20;
            item.active = true;
            if (meshGroup) {
              meshGroup.position.set(item.x, item.y, item.z);
              meshGroup.visible = true;
            }
          }, 5000);
        }
        // Individual P2 pickup
        else if (d2 < 1.2 && p2State.y < 1.5) {
          item.active = false;
          if (meshGroup) meshGroup.visible = false;

          teamTotalScore += item.points;
          p2State.score += item.points;
          p2State.gemsCollected += 1;
          p2State.actionText = `P2 GETS ${item.type.toUpperCase()} (+${item.points})`;
          sound.playGemCollect();

          setTimeout(() => {
            item.x = (Math.random() - 0.5) * 20;
            item.z = (Math.random() - 0.5) * 20;
            item.active = true;
            if (meshGroup) {
              meshGroup.position.set(item.x, item.y, item.z);
              meshGroup.visible = true;
            }
          }, 5000);
        }
      });

      // 5. UPDATE MESH POSITIONS & ROTATIONS
      // P1 Mesh
      p1Mesh.monsterGroup.position.set(p1State.x, p1State.y, p1State.z);

      let p1Rot = 0;
      if (p1State.facing === 'right') p1Rot = Math.PI / 2;
      else if (p1State.facing === 'left') p1Rot = -Math.PI / 2;
      else if (p1State.facing === 'up') p1Rot = Math.PI;
      else if (p1State.facing === 'down') p1Rot = 0;

      p1Mesh.monsterGroup.rotation.y += (p1Rot - p1Mesh.monsterGroup.rotation.y) * 0.25;

      const p1Moving = Math.hypot(p1State.vx, p1State.vz) > 0.4;
      if (p1Moving) {
        const w = time * 14;
        p1Mesh.leftLeg.rotation.x = Math.sin(w) * 0.8;
        p1Mesh.rightLeg.rotation.x = -Math.sin(w) * 0.8;
        p1Mesh.leftArm.rotation.x = -Math.sin(w) * 0.8;
        p1Mesh.rightArm.rotation.x = Math.sin(w) * 0.8;
      } else {
        p1Mesh.leftLeg.rotation.x = 0;
        p1Mesh.rightLeg.rotation.x = 0;
        p1Mesh.bodyGroup.position.y = Math.sin(time * 3) * 0.05;
      }

      // P2 Mesh
      p2Mesh.monsterGroup.position.set(p2State.x, p2State.y, p2State.z);

      let p2Rot = 0;
      if (p2State.facing === 'right') p2Rot = Math.PI / 2;
      else if (p2State.facing === 'left') p2Rot = -Math.PI / 2;
      else if (p2State.facing === 'up') p2Rot = Math.PI;
      else if (p2State.facing === 'down') p2Rot = 0;

      p2Mesh.monsterGroup.rotation.y += (p2Rot - p2Mesh.monsterGroup.rotation.y) * 0.25;

      const p2Moving = Math.hypot(p2State.vx, p2State.vz) > 0.4;
      if (p2Moving) {
        const w = time * 14;
        p2Mesh.leftLeg.rotation.x = Math.sin(w) * 0.8;
        p2Mesh.rightLeg.rotation.x = -Math.sin(w) * 0.8;
        p2Mesh.leftArm.rotation.x = -Math.sin(w) * 0.8;
        p2Mesh.rightArm.rotation.x = Math.sin(w) * 0.8;
      } else {
        p2Mesh.leftLeg.rotation.x = 0;
        p2Mesh.rightLeg.rotation.x = 0;
        p2Mesh.bodyGroup.position.y = Math.sin(time * 3) * 0.05;
      }

      // 6. CAMERA FOLLOWS 3D MIDPOINT OF P1 AND P2
      const midX = (p1State.x + p2State.x) / 2;
      const midZ = (p1State.z + p2State.z) / 2;

      camera.position.x += (midX - camera.position.x) * 0.08;
      camera.position.z += (midZ + 11 - camera.position.z) * 0.08;
      camera.lookAt(camera.position.x, 0, camera.position.z - 11);

      renderer.render(scene, camera);

      // Report State to Parent Component
      if (onGameStateUpdate) {
        onGameStateUpdate({
          p1: {
            x: Math.round(p1State.x * 10) / 10,
            y: Math.round(p1State.y * 10) / 10,
            z: Math.round(p1State.z * 10) / 10,
            facing: p1State.facing,
            score: p1State.score,
            gemsCollected: p1State.gemsCollected,
            isDashing: p1State.isDashing,
            monsterType: p1MonsterType,
            actionText: p1State.actionText,
          },
          p2: {
            x: Math.round(p2State.x * 10) / 10,
            y: Math.round(p2State.y * 10) / 10,
            z: Math.round(p2State.z * 10) / 10,
            facing: p2State.facing,
            score: p2State.score,
            gemsCollected: p2State.gemsCollected,
            isDashing: p2State.isDashing,
            monsterType: p2MonsterType,
            actionText: p2State.actionText,
          },
          teamScore: teamTotalScore,
          stageTheme: targetBiomeTheme,
          biomeName: targetBiome.name,
          distanceExplored: Math.round(totalDistanceExplored),
          collectibles: initialItems.filter((it) => it.active),
          announcement: announcementText,
        });
      }
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [p1MonsterType, p2MonsterType]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-950 rounded-lg overflow-hidden border-2 border-slate-700">
      <div ref={mountRef} className="w-full h-full min-h-[380px]" />
      <div className="crt-overlay absolute inset-0 pointer-events-none" />
    </div>
  );
};
