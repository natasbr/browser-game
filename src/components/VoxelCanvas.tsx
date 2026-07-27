import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PlayerInputState, MonsterType } from '../types';
import { sound } from '../lib/sound';

interface VoxelCanvasProps {
  inputState: PlayerInputState;
  monsterType?: MonsterType;
  onGameStateUpdate?: (state: {
    x: number;
    y: number;
    facing: 'left' | 'right';
    hp: number;
    score: number;
    actionText: string;
    isAttacking: boolean;
  }) => void;
  isHostView?: boolean;
}

export const VoxelCanvas: React.FC<VoxelCanvasProps> = ({
  inputState,
  monsterType = 'voxel_agumon',
  onGameStateUpdate,
  isHostView = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<PlayerInputState>(inputState);
  inputRef.current = inputState;

  useEffect(() => {
    if (!mountRef.current) return;

    // --- THREE.JS SCENE SETUP ---
    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0d18);
    scene.fog = new THREE.FogExp2(0x0c0d18, 0.03);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.5, 9);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;

    mountRef.current.appendChild(renderer.domElement);

    // --- LIGHTING (PS1 STYLE) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff0dd, 1.2);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 512;
    dirLight.shadow.mapSize.height = 512;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xf59e0b, 1.5, 10);
    pointLight.position.set(0, 2, 2);
    scene.add(pointLight);

    // --- ARENA / STAGE (MEGA DRIVE / PS1 DIGIMON GRID) ---
    // Checkerboard Grid Floor
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    const floorSize = 20;
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

    // Grid border glowing wires
    const gridHelper = new THREE.GridHelper(floorSize, floorSize, 0x3b82f6, 0x1e293b);
    gridHelper.position.y = 0.01;
    stageGroup.add(gridHelper);

    // Stage Back Pillars / Retro PS1 Digital Monoliths
    const pillarGeo = new THREE.BoxGeometry(0.8, 4, 0.8);
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x313244 });
    const pillarGlowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    for (let i = -8; i <= 8; i += 4) {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(i, 2, -6);
      pillar.castShadow = true;
      stageGroup.add(pillar);

      const topGlow = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.6), pillarGlowMat);
      topGlow.position.set(i, 4.1, -6);
      stageGroup.add(topGlow);
    }

    // --- VOXEL DIGIMON CHARACTER BUILDER ---
    const characterGroup = new THREE.Group();
    scene.add(characterGroup);

    // Colors according to monster type
    let primaryColor = 0xf97316; // Agumon Orange
    let bellyColor = 0xfef08a; // Yellowish belly
    let eyeColor = 0x22c55e; // Green eyes
    let stripeColor = 0xc2410c; // Dark Orange

    if (monsterType === 'voxel_gabumon') {
      primaryColor = 0x3b82f6;
      bellyColor = 0xe0e7ff;
      eyeColor = 0xef4444;
      stripeColor = 0x1e3a8a;
    } else if (monsterType === 'voxel_veemon') {
      primaryColor = 0x0284c7;
      bellyColor = 0xf8fafc;
      eyeColor = 0xeab308;
      stripeColor = 0x0369a1;
    }

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

    // Body
    const bodyGroup = new THREE.Group();
    characterGroup.add(bodyGroup);

    // Torso (Voxel block)
    createVoxelBox(0.9, 0.9, 0.8, primaryColor, 0, 0.9, 0, bodyGroup);
    // Belly patch
    createVoxelBox(0.7, 0.7, 0.1, bellyColor, 0, 0.9, 0.41, bodyGroup);

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.4, 0.1);
    bodyGroup.add(headGroup);

    // Head block
    createVoxelBox(0.95, 0.8, 0.9, primaryColor, 0, 0.2, 0, headGroup);
    // Snout
    createVoxelBox(0.75, 0.45, 0.5, primaryColor, 0, 0.05, 0.55, headGroup);
    // Nostrils / Mouth seam
    createVoxelBox(0.8, 0.08, 0.52, 0x7c2d12, 0, -0.08, 0.55, headGroup);
    // Eyes (Right & Left)
    createVoxelBox(0.18, 0.22, 0.1, eyeColor, 0.32, 0.28, 0.46, headGroup);
    createVoxelBox(0.18, 0.22, 0.1, eyeColor, -0.32, 0.28, 0.46, headGroup);
    // Pupils
    createVoxelBox(0.08, 0.12, 0.11, 0x000000, 0.34, 0.28, 0.47, headGroup);
    createVoxelBox(0.08, 0.12, 0.11, 0x000000, -0.34, 0.28, 0.47, headGroup);
    // Head Horns / Spikes (Digimon style)
    createVoxelBox(0.2, 0.35, 0.2, stripeColor, 0, 0.75, -0.2, headGroup);
    createVoxelBox(0.15, 0.25, 0.15, stripeColor, 0.25, 0.65, -0.2, headGroup);
    createVoxelBox(0.15, 0.25, 0.15, stripeColor, -0.25, 0.65, -0.2, headGroup);

    // Arms
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.55, 1.0, 0);
    bodyGroup.add(leftArmGroup);
    createVoxelBox(0.28, 0.5, 0.28, primaryColor, 0, -0.15, 0, leftArmGroup);
    // Claw
    createVoxelBox(0.22, 0.15, 0.25, 0xffffff, 0, -0.42, 0.08, leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.55, 1.0, 0);
    bodyGroup.add(rightArmGroup);
    createVoxelBox(0.28, 0.5, 0.28, primaryColor, 0, -0.15, 0, rightArmGroup);
    // Claw
    createVoxelBox(0.22, 0.15, 0.25, 0xffffff, 0, -0.42, 0.08, rightArmGroup);

    // Legs
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.3, 0.45, 0);
    bodyGroup.add(leftLegGroup);
    createVoxelBox(0.32, 0.5, 0.35, primaryColor, 0, -0.15, 0, leftLegGroup);
    // Foot
    createVoxelBox(0.36, 0.2, 0.55, primaryColor, 0, -0.38, 0.12, leftLegGroup);
    // Toe claws
    createVoxelBox(0.32, 0.12, 0.12, 0xffffff, 0, -0.38, 0.42, leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.3, 0.45, 0);
    bodyGroup.add(rightLegGroup);
    createVoxelBox(0.32, 0.5, 0.35, primaryColor, 0, -0.15, 0, rightLegGroup);
    // Foot
    createVoxelBox(0.36, 0.2, 0.55, primaryColor, 0, -0.38, 0.12, rightLegGroup);
    // Toe claws
    createVoxelBox(0.32, 0.12, 0.12, 0xffffff, 0, -0.38, 0.42, rightLegGroup);

    // Tail
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.6, -0.4);
    bodyGroup.add(tailGroup);
    createVoxelBox(0.3, 0.3, 0.6, primaryColor, 0, 0, -0.25, tailGroup);
    createVoxelBox(0.2, 0.2, 0.4, stripeColor, 0, 0.1, -0.65, tailGroup);

    // Flame FX Group (for attack)
    const flameGroup = new THREE.Group();
    flameGroup.visible = false;
    scene.add(flameGroup);

    const flameParticles: THREE.Mesh[] = [];
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const flameCoreMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    for (let i = 0; i < 12; i++) {
      const size = 0.15 + Math.random() * 0.25;
      const mesh = new THREE.Mesh(boxGeo, i % 2 === 0 ? flameMat : flameCoreMat);
      mesh.scale.set(size, size, size);
      flameGroup.add(mesh);
      flameParticles.push(mesh);
    }

    // --- TARGET DUMMY (TRAINING TARGET) ---
    const targetGroup = new THREE.Group();
    targetGroup.position.set(3.5, 0.8, 0);
    scene.add(targetGroup);

    const dummyBase = createVoxelBox(0.8, 0.2, 0.8, 0x45475a, 0, -0.7, 0, targetGroup);
    const dummyPole = createVoxelBox(0.2, 1.2, 0.2, 0xa6adc8, 0, 0, 0, targetGroup);
    const dummyHead = createVoxelBox(0.7, 0.7, 0.7, 0xf38ba8, 0, 0.7, 0, targetGroup);
    // Target Face crosshair
    createVoxelBox(0.5, 0.1, 0.72, 0x11111b, 0, 0.7, 0, targetGroup);
    createVoxelBox(0.1, 0.5, 0.72, 0x11111b, 0, 0.7, 0, targetGroup);

    // --- GAME PHYSICS & STATE ---
    let charX = 0;
    let charY = 0;
    let velX = 0;
    let velY = 0;
    let isGrounded = true;
    let facing: 'left' | 'right' = 'right';
    let isAttacking = false;
    let attackTimer = 0;
    let hp = 100;
    let score = 0;
    let actionText = 'READY!';
    let prevAttackInput = false;
    let prevJumpInput = false;
    let dummyHitTimer = 0;

    // --- ANIMATION LOOP ---
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const dt = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();
      const currentInput = inputRef.current;

      // 1. HORIZONTAL MOVEMENT
      const speed = 4.2;
      let moveDir = 0;
      if (currentInput.left) moveDir -= 1;
      if (currentInput.right) moveDir += 1;

      if (moveDir !== 0) {
        velX = moveDir * speed;
        facing = moveDir > 0 ? 'right' : 'left';
      } else {
        velX *= 0.7; // friction
      }

      charX += velX * dt;
      // Boundaries
      if (charX < -7) charX = -7;
      if (charX > 7) charX = 7;

      // 2. JUMPING PHYSICS
      if (currentInput.jump && !prevJumpInput && isGrounded) {
        velY = 7.5;
        isGrounded = false;
        sound.playJump();
        actionText = 'JUMP!';
      }
      prevJumpInput = currentInput.jump;

      // Gravity
      if (!isGrounded) {
        velY -= 22 * dt;
        charY += velY * dt;
        if (charY <= 0) {
          charY = 0;
          velY = 0;
          isGrounded = true;
        }
      }

      // 3. SPECIAL ACTION / ATTACK
      if (currentInput.attack && !prevAttackInput && !isAttacking) {
        isAttacking = true;
        attackTimer = 0.45; // 450ms attack animation
        sound.playAttack();
        actionText = monsterType === 'voxel_agumon' ? 'PEPPER BREATH!' : 'VOXEL BLAST!';

        // Flame FX positioning
        flameGroup.visible = true;
        flameGroup.position.set(
          charX + (facing === 'right' ? 1.2 : -1.2),
          charY + 1.2,
          0
        );

        // Check Target Hit
        const targetX = targetGroup.position.x;
        const distToTarget = Math.abs(flameGroup.position.x - targetX);
        if (distToTarget < 1.8) {
          score += 100;
          dummyHitTimer = 0.3;
          sound.playHit();
          actionText = 'TARGET HIT! +100';
        }
      }
      prevAttackInput = currentInput.attack;

      if (isAttacking) {
        attackTimer -= dt;
        if (attackTimer <= 0) {
          isAttacking = false;
          flameGroup.visible = false;
        }
      }

      // Flame Particles Animation
      if (flameGroup.visible) {
        flameParticles.forEach((p, idx) => {
          const spread = (facing === 'right' ? 1 : -1) * (0.5 + Math.sin(time * 20 + idx) * 0.4);
          p.position.set(
            spread * (1 + idx * 0.15),
            (Math.sin(time * 30 + idx) - 0.2) * 0.3,
            (Math.cos(time * 20 + idx) - 0.2) * 0.3
          );
        });
      }

      // Dummy Hit Wobble Animation
      if (dummyHitTimer > 0) {
        dummyHitTimer -= dt;
        targetGroup.rotation.z = Math.sin(time * 40) * 0.3;
        (dummyHead.material as THREE.MeshLambertMaterial).color.setHex(0xff0000);
      } else {
        targetGroup.rotation.z = 0;
        (dummyHead.material as THREE.MeshLambertMaterial).color.setHex(0xf38ba8);
      }

      // 4. VOXEL CHARACTER ANIMATION PROCEDURES
      characterGroup.position.set(charX, charY, 0);

      // Facing Rotation
      const targetRotY = facing === 'right' ? Math.PI / 2 : -Math.PI / 2;
      characterGroup.rotation.y += (targetRotY - characterGroup.rotation.y) * 0.2;

      // Limb animation speeds
      if (!isGrounded) {
        // Jump pose
        leftLegGroup.rotation.x = -0.6;
        rightLegGroup.rotation.x = 0.4;
        leftArmGroup.rotation.x = 0.8;
        rightArmGroup.rotation.x = -0.8;
        headGroup.rotation.x = -0.2;
      } else if (Math.abs(velX) > 0.5) {
        // Walk wobble
        const walkCycle = time * 12;
        leftLegGroup.rotation.x = Math.sin(walkCycle) * 0.8;
        rightLegGroup.rotation.x = -Math.sin(walkCycle) * 0.8;
        leftArmGroup.rotation.x = -Math.sin(walkCycle) * 0.8;
        rightArmGroup.rotation.x = Math.sin(walkCycle) * 0.8;
        tailGroup.rotation.y = Math.sin(walkCycle * 0.5) * 0.4;
        bodyGroup.position.y = Math.abs(Math.sin(walkCycle)) * 0.08;
      } else {
        // Idle breathing
        const idleCycle = time * 3;
        leftLegGroup.rotation.x = 0;
        rightLegGroup.rotation.x = 0;
        leftArmGroup.rotation.x = Math.sin(idleCycle) * 0.1;
        rightArmGroup.rotation.x = -Math.sin(idleCycle) * 0.1;
        tailGroup.rotation.y = Math.sin(idleCycle) * 0.25;
        bodyGroup.position.y = Math.sin(idleCycle) * 0.04;
        headGroup.rotation.x = Math.sin(idleCycle * 0.5) * 0.05;
      }

      if (isAttacking) {
        headGroup.rotation.x = -0.3; // Tilt back/forward
        bodyGroup.position.z = facing === 'right' ? 0.3 : -0.3;
      } else {
        bodyGroup.position.z = 0;
      }

      // Camera smoothly follows character position
      camera.position.x += (charX * 0.5 - camera.position.x) * 0.05;

      // Render Scene
      renderer.render(scene, camera);

      // Report state back to parent (for Host to send to Cast over network)
      if (onGameStateUpdate) {
        onGameStateUpdate({
          x: Math.round(charX * 10) / 10,
          y: Math.round(charY * 10) / 10,
          facing,
          hp,
          score,
          actionText,
          isAttacking,
        });
      }
    };

    animate();

    // --- RESIZE HANDLER ---
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
  }, [monsterType]);

  return (
    <div className="relative w-full h-full min-h-[350px] bg-slate-950 rounded-lg overflow-hidden border-2 border-slate-700">
      <div ref={mountRef} className="w-full h-full min-h-[350px]" />
      <div className="crt-overlay absolute inset-0 pointer-events-none" />
    </div>
  );
};
