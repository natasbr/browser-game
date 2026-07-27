import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PlayerInputState, MonsterType, StageTheme, GameStatePayload, PlayerSlot } from '../types';
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

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 500;

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    
    // Theme colors
    let bgColor = 0x0c0d18;
    let grid1Color = 0x3b82f6;
    let grid2Color = 0x1e293b;
    let pillarGlow = 0xf59e0b;

    if (stageTheme === 'volcanic_pit') {
      bgColor = 0x180808;
      grid1Color = 0xef4444;
      grid2Color = 0x450a0a;
      pillarGlow = 0xf97316;
    } else if (stageTheme === 'neon_dojo') {
      bgColor = 0x12072b;
      grid1Color = 0x06b6d4;
      grid2Color = 0x3b0764;
      pillarGlow = 0xec4899;
    } else if (stageTheme === 'crystal_cave') {
      bgColor = 0x051a1a;
      grid1Color = 0x10b981;
      grid2Color = 0x064e3b;
      pillarGlow = 0x34d399;
    }

    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4.2, 11);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;

    mountRef.current.appendChild(renderer.domElement);

    // --- LIGHTS ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 512;
    dirLight.shadow.mapSize.height = 512;
    scene.add(dirLight);

    // --- ARENA STAGE ---
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    const floorSize = 22;
    const tileSize = 1;
    const floorGeo = new THREE.BoxGeometry(tileSize, 0.2, tileSize);

    for (let x = -floorSize / 2; x < floorSize / 2; x++) {
      for (let z = -floorSize / 2; z < floorSize / 2; z++) {
        const isAlt = (x + z) % 2 === 0;
        const mat = new THREE.MeshLambertMaterial({
          color: isAlt ? 0x222436 : 0x181926,
        });
        const tile = new THREE.Mesh(floorGeo, mat);
        tile.position.set(x + 0.5, -0.1, z + 0.5);
        tile.receiveShadow = true;
        stageGroup.add(tile);
      }
    }

    const gridHelper = new THREE.GridHelper(floorSize, floorSize, grid1Color, grid2Color);
    gridHelper.position.y = 0.01;
    stageGroup.add(gridHelper);

    // Monolith Pillars
    const pillarGeo = new THREE.BoxGeometry(0.8, 4.5, 0.8);
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x313244 });
    const pillarGlowMat = new THREE.MeshBasicMaterial({ color: pillarGlow });

    for (let i = -10; i <= 10; i += 4) {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(i, 2.25, -7);
      pillar.castShadow = true;
      stageGroup.add(pillar);

      const topGlow = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.6), pillarGlowMat);
      topGlow.position.set(i, 4.6, -7);
      stageGroup.add(topGlow);
    }

    // --- MONSTER CREATOR HELPER ---
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

    function buildVoxelMonsterMesh(mType: MonsterType) {
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
      // Horns/Spikes
      createVoxelBox(0.2, 0.35, 0.2, horns, 0, 0.75, -0.2, headGroup);
      createVoxelBox(0.15, 0.25, 0.15, horns, 0.25, 0.65, -0.2, headGroup);
      createVoxelBox(0.15, 0.25, 0.15, horns, -0.25, 0.65, -0.2, headGroup);

      // Arms
      const leftArm = new THREE.Group();
      leftArm.position.set(-0.55, 1.0, 0);
      bodyGroup.add(leftArm);
      createVoxelBox(0.28, 0.5, 0.28, primary, 0, -0.15, 0, leftArm);
      createVoxelBox(0.22, 0.15, 0.25, 0xffffff, 0, -0.42, 0.08, leftArm);

      const rightArm = new THREE.Group();
      rightArm.position.set(0.55, 1.0, 0);
      bodyGroup.add(rightArm);
      createVoxelBox(0.28, 0.5, 0.28, primary, 0, -0.15, 0, rightArm);
      createVoxelBox(0.22, 0.15, 0.25, 0xffffff, 0, -0.42, 0.08, rightArm);

      // Legs
      const leftLeg = new THREE.Group();
      leftLeg.position.set(-0.3, 0.45, 0);
      bodyGroup.add(leftLeg);
      createVoxelBox(0.32, 0.5, 0.35, primary, 0, -0.15, 0, leftLeg);
      createVoxelBox(0.36, 0.2, 0.55, primary, 0, -0.38, 0.12, leftLeg);

      const rightLeg = new THREE.Group();
      rightLeg.position.set(0.3, 0.45, 0);
      bodyGroup.add(rightLeg);
      createVoxelBox(0.32, 0.5, 0.35, primary, 0, -0.15, 0, rightLeg);
      createVoxelBox(0.36, 0.2, 0.55, primary, 0, -0.38, 0.12, rightLeg);

      // Tail
      const tail = new THREE.Group();
      tail.position.set(0, 0.6, -0.4);
      bodyGroup.add(tail);
      createVoxelBox(0.3, 0.3, 0.6, primary, 0, 0, -0.25, tail);
      createVoxelBox(0.2, 0.2, 0.4, horns, 0, 0.1, -0.65, tail);

      return {
        monsterGroup,
        bodyGroup,
        headGroup,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        tail,
      };
    }

    // --- INSTANTIATE P1 AND P2 MONSTERS ---
    const p1Mesh = buildVoxelMonsterMesh(p1MonsterType);
    const p2Mesh = buildVoxelMonsterMesh(p2MonsterType);
    scene.add(p1Mesh.monsterGroup);
    scene.add(p2Mesh.monsterGroup);

    // Attack FX Groups
    const p1FxGroup = new THREE.Group();
    p1FxGroup.visible = false;
    scene.add(p1FxGroup);
    const p1FxParticles: THREE.Mesh[] = [];
    const p1FxMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    for (let i = 0; i < 12; i++) {
      const p = new THREE.Mesh(boxGeo, p1FxMat);
      p.scale.set(0.2, 0.2, 0.2);
      p1FxGroup.add(p);
      p1FxParticles.push(p);
    }

    const p2FxGroup = new THREE.Group();
    p2FxGroup.visible = false;
    scene.add(p2FxGroup);
    const p2FxParticles: THREE.Mesh[] = [];
    const p2FxMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    for (let i = 0; i < 12; i++) {
      const p = new THREE.Mesh(boxGeo, p2FxMat);
      p.scale.set(0.2, 0.2, 0.2);
      p2FxGroup.add(p);
      p2FxParticles.push(p);
    }

    // --- POWER-UP ITEM ORB ---
    const itemMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    itemMesh.position.set(0, 1.2, 0);
    scene.add(itemMesh);

    // --- GAME ENGINE STATE ---
    let p1State = {
      x: -3.5,
      y: 0,
      vx: 0,
      vy: 0,
      facing: 'right' as 'left' | 'right',
      isGrounded: true,
      isAttacking: false,
      isSpecialAttacking: false,
      attackTimer: 0,
      hp: 100,
      maxHp: 100,
      energy: 0,
      score: 0,
      wins: 0,
      isHit: false,
      hitTimer: 0,
      actionText: 'READY!',
    };

    let p2State = {
      x: 3.5,
      y: 0,
      vx: 0,
      vy: 0,
      facing: 'left' as 'left' | 'right',
      isGrounded: true,
      isAttacking: false,
      isSpecialAttacking: false,
      attackTimer: 0,
      hp: 100,
      maxHp: 100,
      energy: 0,
      score: 0,
      wins: 0,
      isHit: false,
      hitTimer: 0,
      actionText: 'READY!',
    };

    let roundNumber = 1;
    let roundTimer = 99;
    let timerAcc = 0;
    let currentWinner: PlayerSlot | 'DRAW' | null = null;
    let isResettingRound = false;

    let itemState = {
      x: 0,
      y: 1.2,
      type: 'health' as 'health' | 'energy',
      active: true,
      respawnTimer: 0,
    };

    let prevP1Input = { attack: false, jump: false, special: false };
    let prevP2Input = { attack: false, jump: false, special: false };

    // --- ANIMATION LOOP ---
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const dt = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      // Update timer
      if (!isResettingRound) {
        timerAcc += dt;
        if (timerAcc >= 1) {
          timerAcc -= 1;
          roundTimer = Math.max(0, roundTimer - 1);
        }
      }

      // 1. UPDATE P1 PHYSICS & CONTROLS
      const in1 = p1InputRef.current;
      const speed = 4.5;

      let p1Dir = 0;
      if (in1.left) p1Dir -= 1;
      if (in1.right) p1Dir += 1;

      if (p1Dir !== 0 && !p1State.isHit) {
        p1State.vx = p1Dir * speed;
        p1State.facing = p1Dir > 0 ? 'right' : 'left';
      } else {
        p1State.vx *= 0.7;
      }

      p1State.x += p1State.vx * dt;
      if (p1State.x < -8.5) p1State.x = -8.5;
      if (p1State.x > 8.5) p1State.x = 8.5;

      if (in1.jump && !prevP1Input.jump && p1State.isGrounded && !p1State.isHit) {
        p1State.vy = 7.5;
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

      // P1 Basic Attack
      if (in1.attack && !prevP1Input.attack && !p1State.isAttacking && !p1State.isHit) {
        p1State.isAttacking = true;
        p1State.attackTimer = 0.4;
        sound.playAttack();
        p1State.actionText = 'P1 ATTACK!';
        p1State.energy = Math.min(100, p1State.energy + 20);

        p1FxGroup.visible = true;
        p1FxGroup.position.set(p1State.x + (p1State.facing === 'right' ? 1.2 : -1.2), p1State.y + 1.2, 0);

        // Hit Detection against P2
        const dist = Math.abs((p1State.x + (p1State.facing === 'right' ? 1 : -1)) - p2State.x);
        if (dist < 1.8 && Math.abs(p1State.y - p2State.y) < 1.2) {
          p2State.hp = Math.max(0, p2State.hp - 10);
          p2State.isHit = true;
          p2State.hitTimer = 0.25;
          p1State.score += 100;
          sound.playHit();
          p1State.actionText = 'HIT P2! +100';
          p2State.x += p1State.facing === 'right' ? 0.8 : -0.8;
        }
      }
      prevP1Input.attack = in1.attack;

      // P1 Special Attack (Requires 100 Energy)
      if (in1.special && !prevP1Input.special && p1State.energy >= 100 && !p1State.isHit) {
        p1State.energy = 0;
        p1State.isSpecialAttacking = true;
        p1State.isAttacking = true;
        p1State.attackTimer = 0.6;
        sound.playAttack();
        p1State.actionText = 'P1 SUPER BLAST!';

        p1FxGroup.visible = true;
        p1FxGroup.position.set(p1State.x + (p1State.facing === 'right' ? 1.5 : -1.5), p1State.y + 1.2, 0);

        const dist = Math.abs(p1State.x - p2State.x);
        if (dist < 3.2) {
          p2State.hp = Math.max(0, p2State.hp - 25);
          p2State.isHit = true;
          p2State.hitTimer = 0.4;
          p1State.score += 300;
          sound.playHit();
          p2State.x += p1State.facing === 'right' ? 1.5 : -1.5;
        }
      }
      prevP1Input.special = in1.special;

      if (p1State.isAttacking) {
        p1State.attackTimer -= dt;
        if (p1State.attackTimer <= 0) {
          p1State.isAttacking = false;
          p1State.isSpecialAttacking = false;
          p1FxGroup.visible = false;
        }
      }

      if (p1State.isHit) {
        p1State.hitTimer -= dt;
        if (p1State.hitTimer <= 0) p1State.isHit = false;
      }

      // 2. UPDATE P2 PHYSICS & CONTROLS
      const in2 = p2InputRef.current;

      let p2Dir = 0;
      if (in2.left) p2Dir -= 1;
      if (in2.right) p2Dir += 1;

      if (p2Dir !== 0 && !p2State.isHit) {
        p2State.vx = p2Dir * speed;
        p2State.facing = p2Dir > 0 ? 'right' : 'left';
      } else {
        p2State.vx *= 0.7;
      }

      p2State.x += p2State.vx * dt;
      if (p2State.x < -8.5) p2State.x = -8.5;
      if (p2State.x > 8.5) p2State.x = 8.5;

      if (in2.jump && !prevP2Input.jump && p2State.isGrounded && !p2State.isHit) {
        p2State.vy = 7.5;
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

      // P2 Basic Attack
      if (in2.attack && !prevP2Input.attack && !p2State.isAttacking && !p2State.isHit) {
        p2State.isAttacking = true;
        p2State.attackTimer = 0.4;
        sound.playAttack();
        p2State.actionText = 'P2 ATTACK!';
        p2State.energy = Math.min(100, p2State.energy + 20);

        p2FxGroup.visible = true;
        p2FxGroup.position.set(p2State.x + (p2State.facing === 'right' ? 1.2 : -1.2), p2State.y + 1.2, 0);

        // Hit Detection against P1
        const dist = Math.abs((p2State.x + (p2State.facing === 'right' ? 1 : -1)) - p1State.x);
        if (dist < 1.8 && Math.abs(p2State.y - p1State.y) < 1.2) {
          p1State.hp = Math.max(0, p1State.hp - 10);
          p1State.isHit = true;
          p1State.hitTimer = 0.25;
          p2State.score += 100;
          sound.playHit();
          p2State.actionText = 'HIT P1! +100';
          p1State.x += p2State.facing === 'right' ? 0.8 : -0.8;
        }
      }
      prevP2Input.attack = in2.attack;

      // P2 Special Attack
      if (in2.special && !prevP2Input.special && p2State.energy >= 100 && !p2State.isHit) {
        p2State.energy = 0;
        p2State.isSpecialAttacking = true;
        p2State.isAttacking = true;
        p2State.attackTimer = 0.6;
        sound.playAttack();
        p2State.actionText = 'P2 SUPER BLAST!';

        p2FxGroup.visible = true;
        p2FxGroup.position.set(p2State.x + (p2State.facing === 'right' ? 1.5 : -1.5), p2State.y + 1.2, 0);

        const dist = Math.abs(p2State.x - p1State.x);
        if (dist < 3.2) {
          p1State.hp = Math.max(0, p1State.hp - 25);
          p1State.isHit = true;
          p1State.hitTimer = 0.4;
          p2State.score += 300;
          sound.playHit();
          p1State.x += p2State.facing === 'right' ? 1.5 : -1.5;
        }
      }
      prevP2Input.special = in2.special;

      if (p2State.isAttacking) {
        p2State.attackTimer -= dt;
        if (p2State.attackTimer <= 0) {
          p2State.isAttacking = false;
          p2State.isSpecialAttacking = false;
          p2FxGroup.visible = false;
        }
      }

      if (p2State.isHit) {
        p2State.hitTimer -= dt;
        if (p2State.hitTimer <= 0) p2State.isHit = false;
      }

      // 3. POWERUP ITEM MECHANICS
      if (itemState.active) {
        itemMesh.rotation.y += dt * 3;
        itemMesh.position.y = 1.0 + Math.sin(time * 4) * 0.2;

        // P1 item pickup
        if (Math.abs(p1State.x - itemState.x) < 1.0 && p1State.y < 1.2) {
          itemState.active = false;
          itemState.respawnTimer = 8;
          sound.playConnectFanfare();
          if (itemState.type === 'health') {
            p1State.hp = Math.min(100, p1State.hp + 30);
            p1State.actionText = 'P1 HEAL +30 HP!';
          } else {
            p1State.energy = 100;
            p1State.actionText = 'P1 FULL ENERGY!';
          }
        }
        // P2 item pickup
        else if (Math.abs(p2State.x - itemState.x) < 1.0 && p2State.y < 1.2) {
          itemState.active = false;
          itemState.respawnTimer = 8;
          sound.playConnectFanfare();
          if (itemState.type === 'health') {
            p2State.hp = Math.min(100, p2State.hp + 30);
            p2State.actionText = 'P2 HEAL +30 HP!';
          } else {
            p2State.energy = 100;
            p2State.actionText = 'P2 FULL ENERGY!';
          }
        }
      } else {
        itemState.respawnTimer -= dt;
        if (itemState.respawnTimer <= 0) {
          itemState.active = true;
          itemState.x = (Math.random() - 0.5) * 6;
          itemState.type = Math.random() > 0.5 ? 'health' : 'energy';
          itemMesh.position.x = itemState.x;
          (itemMesh.material as THREE.MeshBasicMaterial).color.setHex(
            itemState.type === 'health' ? 0x22c55e : 0xeab308
          );
        }
      }
      itemMesh.visible = itemState.active;

      // 4. ROUND WIN / KO CHECK
      if (!isResettingRound) {
        if (p1State.hp <= 0 || p2State.hp <= 0 || roundTimer <= 0) {
          isResettingRound = true;

          if (p1State.hp > p2State.hp) {
            currentWinner = 'P1';
            p1State.wins += 1;
            p1State.actionText = 'K.O.! PLAYER 1 WINS ROUND!';
          } else if (p2State.hp > p1State.hp) {
            currentWinner = 'P2';
            p2State.wins += 1;
            p2State.actionText = 'K.O.! PLAYER 2 WINS ROUND!';
          } else {
            currentWinner = 'DRAW';
            p1State.actionText = 'TIME UP! DRAW!';
          }

          sound.playConnectFanfare();

          // Reset round after 3 seconds
          setTimeout(() => {
            p1State.hp = 100;
            p1State.energy = 0;
            p1State.x = -3.5;
            p1State.y = 0;
            p1State.facing = 'right';

            p2State.hp = 100;
            p2State.energy = 0;
            p2State.x = 3.5;
            p2State.y = 0;
            p2State.facing = 'left';

            roundTimer = 99;
            roundNumber += 1;
            currentWinner = null;
            isResettingRound = false;
            p1State.actionText = `ROUND ${roundNumber} START!`;
            p2State.actionText = `ROUND ${roundNumber} START!`;
          }, 3000);
        }
      }

      // 5. MESH ANIMATIONS
      // P1 Mesh
      p1Mesh.monsterGroup.position.set(p1State.x, p1State.y, 0);
      const targetRot1 = p1State.facing === 'right' ? Math.PI / 2 : -Math.PI / 2;
      p1Mesh.monsterGroup.rotation.y += (targetRot1 - p1Mesh.monsterGroup.rotation.y) * 0.2;

      if (p1State.isHit) {
        p1Mesh.bodyGroup.rotation.z = Math.sin(time * 30) * 0.3;
      } else {
        p1Mesh.bodyGroup.rotation.z = 0;
        if (Math.abs(p1State.vx) > 0.5) {
          const w = time * 14;
          p1Mesh.leftLeg.rotation.x = Math.sin(w) * 0.8;
          p1Mesh.rightLeg.rotation.x = -Math.sin(w) * 0.8;
          p1Mesh.leftArm.rotation.x = -Math.sin(w) * 0.8;
          p1Mesh.rightArm.rotation.x = Math.sin(w) * 0.8;
        } else {
          p1Mesh.leftLeg.rotation.x = 0;
          p1Mesh.rightLeg.rotation.x = 0;
          p1Mesh.bodyGroup.position.y = Math.sin(time * 3) * 0.04;
        }
      }

      // P2 Mesh
      p2Mesh.monsterGroup.position.set(p2State.x, p2State.y, 0);
      const targetRot2 = p2State.facing === 'right' ? Math.PI / 2 : -Math.PI / 2;
      p2Mesh.monsterGroup.rotation.y += (targetRot2 - p2Mesh.monsterGroup.rotation.y) * 0.2;

      if (p2State.isHit) {
        p2Mesh.bodyGroup.rotation.z = Math.sin(time * 30) * 0.3;
      } else {
        p2Mesh.bodyGroup.rotation.z = 0;
        if (Math.abs(p2State.vx) > 0.5) {
          const w = time * 14;
          p2Mesh.leftLeg.rotation.x = Math.sin(w) * 0.8;
          p2Mesh.rightLeg.rotation.x = -Math.sin(w) * 0.8;
          p2Mesh.leftArm.rotation.x = -Math.sin(w) * 0.8;
          p2Mesh.rightArm.rotation.x = Math.sin(w) * 0.8;
        } else {
          p2Mesh.leftLeg.rotation.x = 0;
          p2Mesh.rightLeg.rotation.x = 0;
          p2Mesh.bodyGroup.position.y = Math.sin(time * 3) * 0.04;
        }
      }

      // Particle FX Animation
      if (p1FxGroup.visible) {
        p1FxParticles.forEach((p, idx) => {
          const spread = (p1State.facing === 'right' ? 1 : -1) * (0.4 + idx * 0.15);
          p.position.set(spread, Math.sin(time * 20 + idx) * 0.3, Math.cos(time * 15 + idx) * 0.3);
        });
      }
      if (p2FxGroup.visible) {
        p2FxParticles.forEach((p, idx) => {
          const spread = (p2State.facing === 'right' ? 1 : -1) * (0.4 + idx * 0.15);
          p.position.set(spread, Math.sin(time * 20 + idx) * 0.3, Math.cos(time * 15 + idx) * 0.3);
        });
      }

      // Camera smoothly tracks mid-point between P1 and P2
      const midX = (p1State.x + p2State.x) / 2;
      camera.position.x += (midX * 0.4 - camera.position.x) * 0.05;

      renderer.render(scene, camera);

      // Report state back to parent
      if (onGameStateUpdate) {
        onGameStateUpdate({
          p1: {
            x: Math.round(p1State.x * 10) / 10,
            y: Math.round(p1State.y * 10) / 10,
            facing: p1State.facing,
            hp: p1State.hp,
            maxHp: p1State.maxHp,
            energy: p1State.energy,
            score: p1State.score,
            wins: p1State.wins,
            isAttacking: p1State.isAttacking,
            isSpecialAttacking: p1State.isSpecialAttacking,
            isHit: p1State.isHit,
            monsterType: p1MonsterType,
            actionText: p1State.actionText,
          },
          p2: {
            x: Math.round(p2State.x * 10) / 10,
            y: Math.round(p2State.y * 10) / 10,
            facing: p2State.facing,
            hp: p2State.hp,
            maxHp: p2State.maxHp,
            energy: p2State.energy,
            score: p2State.score,
            wins: p2State.wins,
            isAttacking: p2State.isAttacking,
            isSpecialAttacking: p2State.isSpecialAttacking,
            isHit: p2State.isHit,
            monsterType: p2MonsterType,
            actionText: p2State.actionText,
          },
          stageTheme,
          timer: roundTimer,
          winner: currentWinner,
          round: roundNumber,
          announcement: currentWinner
            ? `K.O.! ${currentWinner} WINS!`
            : `ROUND ${roundNumber}`,
          item: {
            x: itemState.x,
            y: itemState.y,
            type: itemState.type,
            active: itemState.active,
          },
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
  }, [p1MonsterType, p2MonsterType, stageTheme]);

  return (
    <div className="relative w-full h-full min-h-[360px] bg-slate-950 rounded-lg overflow-hidden border-2 border-slate-700">
      <div ref={mountRef} className="w-full h-full min-h-[360px]" />
      <div className="crt-overlay absolute inset-0 pointer-events-none" />
    </div>
  );
};
