/**
 * Primordial Soup - Cell & Creature Evolution Simulator 3D
 * Features:
 * - 3D soft-body kinematic worms & blobs
 * - 7-gene genetics, inheritance, mutation, and neural steering
 * - Biological needs (hunger, digestion vacuoles, mitosis, predation)
 * - Deformable detritus chunks, hydrothermal vents, caustics floor
 * - Tilt-shift microscope macro lens
 * - WebXR 6DOF support for Meta Quest 3 & VR headsets
 * Zero emojis.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PrimordialSimulation } from './simulation/physicsEngine';
import { SceneManager } from './graphics/sceneManager';
import { ControlDock, SpawnBrushType } from './components/ControlDock';
import { InspectorModal } from './components/InspectorModal';
import { CreatureState, SimulationStats } from './types/simulation';
import { biologicalAudio } from './simulation/audioSynth';
import { Dna, ShieldAlert, Sparkles } from 'lucide-react';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const simulationRef = useRef<PrimordialSimulation>(new PrimordialSimulation());

  // UI state
  const [stats, setStats] = useState<SimulationStats>(() => simulationRef.current.getStats());
  const [isPaused, setIsPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [tiltShiftEnabled, setTiltShiftEnabled] = useState(true);
  const [tiltShiftBlur, setTiltShiftBlur] = useState(3.2);
  const [activeBrush, setActiveBrush] = useState<SpawnBrushType>('micro');
  const [cameraPreset, setCameraPreset] = useState<'perspective' | 'top_down' | 'macro'>('perspective');
  const [followCamera, setFollowCamera] = useState(false);
  const [selectedCreature, setSelectedCreature] = useState<CreatureState | null>(null);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Initialize Three.js scene once
  useEffect(() => {
    if (!mountRef.current) return;

    const sim = simulationRef.current;
    const sm = new SceneManager(mountRef.current, sim);
    sceneManagerRef.current = sm;

    // Periodic UI stats updater (every 120ms to keep 60fps WebGL decoupled from React re-renders)
    const interval = setInterval(() => {
      setStats(sim.getStats());

      // If a creature is selected, update its telemetry in real-time
      if (sm.selectedCreatureId) {
        const found = sim.creatures.find((c) => c.id === sm.selectedCreatureId);
        setSelectedCreature(found || null);
        if (!found) {
          sm.selectedCreatureId = null;
        }
      }
    }, 120);

    return () => {
      clearInterval(interval);
      sm.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  // Hotkey handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
      } else if (e.code === 'KeyC') {
        toggleFollowCamera();
      } else if (e.code === 'KeyM') {
        toggleMute();
      } else if (e.code === 'Digit1') setActiveBrush('micro');
      else if (e.code === 'Digit2') setActiveBrush('herbivore');
      else if (e.code === 'Digit3') setActiveBrush('carnivore');
      else if (e.code === 'Digit4') setActiveBrush('apex');
      else if (e.code === 'Digit5') setActiveBrush('food');
      else if (e.code === 'Digit6') setActiveBrush('detritus');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showNotice = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => {
      setBannerNotice(null);
    }, 2500);
  };

  // Canvas pointer/click handler for raycasting selection & spawning
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to primary button
    if (e.button !== 0) return;
    const sm = sceneManagerRef.current;
    if (!sm) return;

    const hit = sm.raycast(e.clientX, e.clientY);

    // If tapped directly on an organism, select it
    if (hit.creatureId) {
      sm.selectedCreatureId = hit.creatureId;
      const found = sm.simulation.creatures.find((c) => c.id === hit.creatureId);
      setSelectedCreature(found || null);
      return;
    }

    // Otherwise, if clicked on fluid/floor, spawn current brush entity
    if (hit.worldPoint) {
      const wx = hit.worldPoint.x;
      const wz = hit.worldPoint.z;

      switch (activeBrush) {
        case 'micro':
          sm.simulation.spawnCreature({
            x: wx,
            z: wz,
            diet: 'herbivore',
            genes: {
              size: 0.6,
              speed: 2.2,
              hue: 135,
              armor: 0.1,
            },
          });
          biologicalAudio.playEat(1.6);
          showNotice('Seeded Micro Blob');
          break;
        case 'herbivore':
          sm.simulation.spawnCreature({
            x: wx,
            z: wz,
            diet: 'herbivore',
            genes: {
              size: 1.3,
              speed: 1.5,
              hue: 165,
              armor: 0.3,
            },
          });
          biologicalAudio.playEat(1.2);
          showNotice('Seeded Herbivore Organism');
          break;
        case 'carnivore':
          sm.simulation.spawnCreature({
            x: wx,
            z: wz,
            diet: 'carnivore',
            genes: {
              size: 2.2,
              speed: 2.3,
              hue: 350,
              armor: 0.45,
            },
          });
          biologicalAudio.playBite(false);
          showNotice('Seeded Carnivore Hunter');
          break;
        case 'apex':
          sm.simulation.spawnCreature({
            x: wx,
            z: wz,
            diet: 'apex',
            genes: {
              size: 5.0,
              speed: 1.1,
              hue: 280,
              armor: 0.85,
            },
            name: 'Apex Leviathan Sovereign',
          });
          biologicalAudio.playApexRoar();
          showNotice('Apex Colossus Emerged!');
          break;
        case 'food':
          for (let i = 0; i < 5; i++) {
            sm.simulation.spawnFood(
              wx + (Math.random() - 0.5) * 6,
              wz + (Math.random() - 0.5) * 6,
              Math.random() > 0.4 ? 'algae' : 'nutrient'
            );
          }
          biologicalAudio.playEat(1.4);
          showNotice('Dispensed Nutrient Cluster');
          break;
        case 'detritus':
          sm.simulation.spawnDetritus(wx, wz, 2.8 + Math.random() * 2.0);
          showNotice('Dropped Deformable Detritus');
          break;
      }
    }
  };

  const handleSpawnDirect = (type: SpawnBrushType) => {
    const sm = sceneManagerRef.current;
    if (!sm) return;
    const sim = sm.simulation;
    const x = (Math.random() - 0.5) * 40;
    const z = (Math.random() - 0.5) * 40;

    switch (type) {
      case 'micro':
        sim.spawnCreature({ x, z, diet: 'herbivore', genes: { size: 0.6, speed: 2.2, hue: 135 } });
        showNotice('Spawned Micro Blob');
        break;
      case 'herbivore':
        sim.spawnCreature({ x, z, diet: 'herbivore', genes: { size: 1.3, speed: 1.5, hue: 165 } });
        showNotice('Spawned Herbivore');
        break;
      case 'carnivore':
        sim.spawnCreature({ x, z, diet: 'carnivore', genes: { size: 2.2, speed: 2.3, hue: 350 } });
        showNotice('Spawned Hunter');
        break;
      case 'apex':
        sim.spawnCreature({ x, z, diet: 'apex', genes: { size: 5.0, speed: 1.1, hue: 280 } });
        biologicalAudio.playApexRoar();
        showNotice('Spawned Apex Titan');
        break;
      case 'food':
        for (let i = 0; i < 6; i++) {
          sim.spawnFood(x + (Math.random() - 0.5) * 8, z + (Math.random() - 0.5) * 8, 'algae');
        }
        showNotice('Spawned Nutrient Batch');
        break;
      case 'detritus':
        sim.spawnDetritus(x, z, 3.2);
        showNotice('Spawned Detritus Chunk');
        break;
    }
  };

  const togglePause = useCallback(() => {
    const sm = sceneManagerRef.current;
    if (!sm) return;
    const nextState = !isPaused;
    sm.simulation.timeScale = nextState ? 0 : timeScale;
    setIsPaused(nextState);
  }, [isPaused, timeScale]);

  const changeSpeed = useCallback((speed: number) => {
    const sm = sceneManagerRef.current;
    if (!sm) return;
    sm.simulation.timeScale = speed;
    setTimeScale(speed);
    setIsPaused(false);
  }, []);

  const toggleMute = useCallback(() => {
    const nextMute = !isMuted;
    biologicalAudio.setMute(nextMute);
    setIsMuted(nextMute);
  }, [isMuted]);

  const toggleTiltShift = useCallback(() => {
    const sm = sceneManagerRef.current;
    if (!sm) return;
    const nextVal = !tiltShiftEnabled;
    sm.setTiltShift(nextVal, tiltShiftBlur);
    setTiltShiftEnabled(nextVal);
  }, [tiltShiftEnabled, tiltShiftBlur]);

  const changeTiltShiftBlur = useCallback((val: number) => {
    const sm = sceneManagerRef.current;
    if (!sm) return;
    sm.setTiltShift(tiltShiftEnabled, val);
    setTiltShiftBlur(val);
  }, [tiltShiftEnabled]);

  const changeCameraPreset = useCallback((preset: 'perspective' | 'top_down' | 'macro') => {
    const sm = sceneManagerRef.current;
    if (!sm) return;
    sm.setCameraPreset(preset);
    setCameraPreset(preset);
  }, []);

  const toggleFollowCamera = useCallback(() => {
    const sm = sceneManagerRef.current;
    if (!sm) return;
    const nextVal = !followCamera;
    sm.followCamera = nextVal;
    setFollowCamera(nextVal);
  }, [followCamera]);

  const resetSimulation = useCallback(() => {
    const sm = sceneManagerRef.current;
    if (!sm) return;
    sm.simulation.seedDefaultEnvironment();
    sm.selectedCreatureId = null;
    setSelectedCreature(null);
    showNotice('Primordial Extinction & Evolution Bloom Triggered');
  }, []);

  // Specimen inspector actions
  const handleFeedCreature = useCallback((id: string) => {
    const sm = sceneManagerRef.current;
    if (!sm) return;
    const target = sm.simulation.creatures.find((c) => c.id === id);
    if (target) {
      target.energy = Math.min(target.maxEnergy, target.energy + 35);
      target.health = Math.min(target.maxHealth, target.health + 20);
      biologicalAudio.playEat(1.0);
      showNotice(`Injected Nutrients into ${target.name}`);
    }
  }, []);

  const handleCloneCreature = useCallback((id: string) => {
    const sm = sceneManagerRef.current;
    if (!sm) return;
    const target = sm.simulation.creatures.find((c) => c.id === id);
    if (target) {
      const clone = sm.simulation.spawnCreature({
        x: target.x + 3,
        z: target.z + 3,
        genes: {
          ...target.genes,
          hue: (target.genes.hue + 15) % 360,
        },
        neuralWeights: { ...target.neuralWeights },
        diet: target.diet,
        generation: target.generation + 1,
        name: `${target.name} Prime-II`,
      });
      biologicalAudio.playMitosis(target.genes.hue);
      sm.selectedCreatureId = clone.id;
      setSelectedCreature(clone);
      showNotice(`Cloned ${target.name} with Mutation`);
    }
  }, []);

  const handleKillCreature = useCallback((id: string) => {
    const sm = sceneManagerRef.current;
    if (!sm) return;
    const idx = sm.simulation.creatures.findIndex((c) => c.id === id);
    if (idx !== -1) {
      sm.simulation.creatures.splice(idx, 1);
      sm.selectedCreatureId = null;
      setSelectedCreature(null);
      showNotice('Specimen Euthanized');
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#051019] select-none font-sans">
      {/* 3D WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        onPointerDown={handleCanvasPointerDown}
        className="absolute inset-0 w-full h-full cursor-crosshair"
      />

      {/* Top Header / Spec Badge (Minimal & Unobtrusive) */}
      <div className="absolute top-4 left-4 z-30 pointer-events-none flex items-center gap-3">
        <div className="bg-[#0b1322] border border-slate-800/90 rounded-xl px-3.5 py-2 shadow-xl pointer-events-auto flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
          <div>
            <div className="text-xs font-mono font-bold tracking-wider text-slate-100 flex items-center gap-1.5">
              <span>PRIMORDIAL SOUP</span>
              <span className="text-[10px] text-sky-400 font-semibold px-1.5 py-0.2 bg-sky-950/80 rounded border border-sky-800">
                6DOF XR / 3D
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Soft-Body Cell Kinetics | 7-Gene Neural Evolution
            </div>
          </div>
        </div>
      </div>

      {/* Top Banner Notice */}
      {bannerNotice && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-all">
          <div className="bg-[#0f172a] border border-sky-500/50 text-sky-300 font-mono text-xs px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2">
            <Sparkles size={13} className="text-sky-400" />
            <span>{bannerNotice}</span>
          </div>
        </div>
      )}

      {/* Creature Specimen Inspector Modal */}
      {selectedCreature && (
        <InspectorModal
          creature={selectedCreature}
          isFollowing={followCamera}
          onClose={() => {
            const sm = sceneManagerRef.current;
            if (sm) sm.selectedCreatureId = null;
            setSelectedCreature(null);
          }}
          onToggleFollow={toggleFollowCamera}
          onFeedCreature={handleFeedCreature}
          onCloneCreature={handleCloneCreature}
          onKillCreature={handleKillCreature}
        />
      )}

      {/* Collapsible Ergonomic Bottom Control Dock */}
      <ControlDock
        stats={stats}
        isPaused={isPaused}
        timeScale={timeScale}
        isMuted={isMuted}
        tiltShiftEnabled={tiltShiftEnabled}
        tiltShiftBlur={tiltShiftBlur}
        activeBrush={activeBrush}
        cameraPreset={cameraPreset}
        followCamera={followCamera}
        onTogglePause={togglePause}
        onChangeSpeed={changeSpeed}
        onToggleMute={toggleMute}
        onToggleTiltShift={toggleTiltShift}
        onChangeTiltShiftBlur={changeTiltShiftBlur}
        onSelectBrush={setActiveBrush}
        onChangeCameraPreset={changeCameraPreset}
        onToggleFollowCamera={toggleFollowCamera}
        onResetSimulation={resetSimulation}
        onSpawnDirect={handleSpawnDirect}
      />
    </div>
  );
}
