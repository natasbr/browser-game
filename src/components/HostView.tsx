import React, { useState, useEffect, useRef } from 'react';
import { VoxelCanvas } from './VoxelCanvas';
import {
  PlayerInputState,
  MonsterType,
  StageTheme,
  GameStatePayload,
  PlayerSlot,
  NetworkMessage,
  GameMode,
} from '../types';
import {
  createTwoPlayerHost,
  registerHostCallbacks,
  broadcastGameState,
  disconnectMultiplayer,
  HostState,
} from '../lib/multiplayer';
import { sound } from '../lib/sound';
import { MONSTER_VARIANTS } from '../lib/monsters';
import { loadActiveGameMode, saveActiveGameMode } from '../lib/storage';
import {
  Wifi,
  Volume2,
  VolumeX,
  ArrowLeft,
  Sparkles,
  Gem,
  Compass,
  ShieldCheck,
  Coins,
  Sprout,
  Trophy,
  Gamepad2,
  Save,
} from 'lucide-react';

interface HostViewProps {
  onBackToMenu: () => void;
}

export const HostView: React.FC<HostViewProps> = ({ onBackToMenu }) => {
  const [activeGameMode, setActiveGameMode] = useState<GameMode>(() => loadActiveGameMode());

  const [hostPins, setHostPins] = useState<{ p1Pin: string; p2Pin: string }>({
    p1Pin: '----',
    p2Pin: '----',
  });
  const [isP1Conn, setIsP1Conn] = useState<boolean>(false);
  const [isP2Conn, setIsP2Conn] = useState<boolean>(false);

  const [p1Monster, setP1Monster] = useState<MonsterType>('blaze_dino');
  const [p2Monster, setP2Monster] = useState<MonsterType>('frost_wolf');
  const [stageTheme, setStageTheme] = useState<StageTheme>('cyber_grid');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Live Game State from Canvas
  const [gameState, setGameState] = useState<GameStatePayload | null>(null);

  // Inputs from P1 and P2 (network + keyboard)
  const [p1Input, setP1Input] = useState<PlayerInputState>({
    up: false,
    down: false,
    left: false,
    right: false,
    jump: false,
    dash: false,
    interact: false,
  });

  const [p2Input, setP2Input] = useState<PlayerInputState>({
    up: false,
    down: false,
    left: false,
    right: false,
    jump: false,
    dash: false,
    interact: false,
  });

  const lastSendRef = useRef<number>(0);

  useEffect(() => {
    // Start 2-Player Host
    const pins = createTwoPlayerHost();
    setHostPins(pins);

    registerHostCallbacks({
      onStatus: (st: HostState) => {
        setIsP1Conn(st.isP1Connected);
        setIsP2Conn(st.isP2Connected);
      },
      onMessage: (slot: PlayerSlot, msg: NetworkMessage) => {
        if (msg.type === 'player_input') {
          const payload = msg.payload as PlayerInputState;
          if (slot === 'P1') setP1Input(payload);
          else if (slot === 'P2') setP2Input(payload);
        } else if (msg.type === 'player_action') {
          const actionPayload = msg.payload as { action: string };
          handleActionMessage(slot, actionPayload.action);
        }
      },
    });

    // Keyboard controls for 3D exploration testing on Host (WASD for P1, Arrows for P2)
    const handleKeyDown = (e: KeyboardEvent) => {
      // P1: W, A, S, D + Space (Jump) + F (Dash/Action)
      if (e.key === 'w' || e.key === 'W') setP1Input((p) => ({ ...p, up: true }));
      if (e.key === 's' || e.key === 'S') setP1Input((p) => ({ ...p, down: true }));
      if (e.key === 'a' || e.key === 'A') setP1Input((p) => ({ ...p, left: true }));
      if (e.key === 'd' || e.key === 'D') setP1Input((p) => ({ ...p, right: true }));
      if (e.key === ' ') setP1Input((p) => ({ ...p, jump: true }));
      if (e.key === 'f' || e.key === 'F') setP1Input((p) => ({ ...p, dash: true, interact: true }));

      // P2: Arrow keys + K (Jump) + L (Dash/Action)
      if (e.key === 'ArrowUp') setP2Input((p) => ({ ...p, up: true }));
      if (e.key === 'ArrowDown') setP2Input((p) => ({ ...p, down: true }));
      if (e.key === 'ArrowLeft') setP2Input((p) => ({ ...p, left: true }));
      if (e.key === 'ArrowRight') setP2Input((p) => ({ ...p, right: true }));
      if (e.key === 'k' || e.key === 'K') setP2Input((p) => ({ ...p, jump: true }));
      if (e.key === 'l' || e.key === 'L') setP2Input((p) => ({ ...p, dash: true, interact: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W') setP1Input((p) => ({ ...p, up: false }));
      if (e.key === 's' || e.key === 'S') setP1Input((p) => ({ ...p, down: false }));
      if (e.key === 'a' || e.key === 'A') setP1Input((p) => ({ ...p, left: false }));
      if (e.key === 'd' || e.key === 'D') setP1Input((p) => ({ ...p, right: false }));
      if (e.key === ' ') setP1Input((p) => ({ ...p, jump: false }));
      if (e.key === 'f' || e.key === 'F') setP1Input((p) => ({ ...p, dash: false, interact: false }));

      if (e.key === 'ArrowUp') setP2Input((p) => ({ ...p, up: false }));
      if (e.key === 'ArrowDown') setP2Input((p) => ({ ...p, down: false }));
      if (e.key === 'ArrowLeft') setP2Input((p) => ({ ...p, left: false }));
      if (e.key === 'ArrowRight') setP2Input((p) => ({ ...p, right: false }));
      if (e.key === 'k' || e.key === 'K') setP2Input((p) => ({ ...p, jump: false }));
      if (e.key === 'l' || e.key === 'L') setP2Input((p) => ({ ...p, dash: false, interact: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      disconnectMultiplayer();
    };
  }, []);

  const handleActionMessage = (slot: PlayerSlot, action: string) => {
    const setter = slot === 'P1' ? setP1Input : setP2Input;
    setter((prev) => {
      switch (action) {
        case 'up_press':
          return { ...prev, up: true };
        case 'up_release':
          return { ...prev, up: false };
        case 'down_press':
          return { ...prev, down: true };
        case 'down_release':
          return { ...prev, down: false };
        case 'left_press':
          return { ...prev, left: true };
        case 'left_release':
          return { ...prev, left: false };
        case 'right_press':
          return { ...prev, right: true };
        case 'right_release':
          return { ...prev, right: false };
        case 'jump':
          return { ...prev, jump: true };
        case 'dash':
        case 'interact':
          return { ...prev, dash: true, interact: true };
        default:
          return prev;
      }
    });

    if (action === 'jump') setTimeout(() => setter((p) => ({ ...p, jump: false })), 60);
    if (action === 'dash' || action === 'interact') {
      setTimeout(() => setter((p) => ({ ...p, dash: false, interact: false })), 60);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
  };

  const handleModeSwitch = (mode: GameMode) => {
    setActiveGameMode(mode);
    saveActiveGameMode(mode);
    sound.playBeep(520, 0.1);
  };

  const handleGameStateUpdate = (data: GameStatePayload) => {
    setGameState(data);

    const now = Date.now();
    if (now - lastSendRef.current > 50) {
      lastSendRef.current = now;
      broadcastGameState('game_state', data);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-screen p-2 md:p-3 bg-slate-950 text-slate-100 max-w-6xl mx-auto select-none overflow-hidden">
      {/* TOP HEADER CONTROL BAR & MENU (ALL GAME STATS MOVED HERE FOR UNSTRUCTED PLAY AREA) */}
      <div className="w-full retro-box p-2 flex flex-col gap-2 bg-slate-900 border-2 border-amber-500/80">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToMenu}
              className="retro-btn px-2.5 py-1 text-xs flex items-center gap-1 text-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> MENU
            </button>
            <div>
              <div className="text-[10px] text-emerald-400 font-pixel">3D VOXEL MULTIPLAYER</div>
              <div className="text-xs font-vt text-slate-300">RECEIVE / 1P SCREEN</div>
            </div>
          </div>

          {/* MODE SELECTOR BUTTONS */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded border border-slate-700">
            <button
              onClick={() => handleModeSwitch('explorer')}
              className={`px-3 py-1 text-xs font-pixel rounded flex items-center gap-1.5 transition-all ${
                activeGameMode === 'explorer'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" /> EXPLORER ARENA
            </button>
            <button
              onClick={() => handleModeSwitch('farm')}
              className={`px-3 py-1 text-xs font-pixel rounded flex items-center gap-1.5 transition-all ${
                activeGameMode === 'farm'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sprout className="w-3.5 h-3.5" /> FARM SIMULATOR
            </button>
          </div>

          {/* BIOME OVERRIDE SELECTOR & SOUND */}
          <div className="flex items-center gap-2">
            {activeGameMode === 'explorer' && (
              <select
                value={stageTheme}
                onChange={(e) => setStageTheme(e.target.value as StageTheme)}
                className="retro-btn text-[10px] px-2 py-1 bg-slate-800 text-amber-300 border border-slate-600 focus:outline-none"
              >
                <option value="cyber_grid">🌐 CYBER GRID</option>
                <option value="verdant_forest">🌿 VERDANT FOREST</option>
                <option value="crystal_cave">💎 CRYSTAL CAVE</option>
                <option value="volcanic_pit">🔥 VOLCANIC PIT</option>
                <option value="neon_dojo">⚡ NEON DOJO</option>
              </select>
            )}

            <div className="flex items-center gap-1 text-[10px] font-vt text-emerald-400 bg-slate-950 px-2 py-1 rounded border border-emerald-500/30">
              <Save className="w-3 h-3 text-emerald-400 animate-pulse" /> SAVED
            </div>

            <button onClick={toggleSound} className="retro-btn p-1.5 text-amber-300">
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* TOP MENU STATS BAR (P1 STATUS, TEAM TOTAL, P2 STATUS) */}
        {gameState && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-950 p-2 rounded border border-slate-800 text-xs font-pixel">
            {/* P1 HUD INFO */}
            <div className="flex items-center gap-2 text-amber-400 bg-slate-900/80 p-1.5 rounded border border-amber-500/40">
              <span className="font-bold">P1:</span>
              {activeGameMode === 'explorer' ? (
                <span className="text-amber-300 flex items-center gap-1">
                  <Gem className="w-3.5 h-3.5" /> {gameState.p1.score} PTS
                </span>
              ) : (
                <span className="text-amber-300 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" /> {gameState.p1.gold} GOLD
                </span>
              )}
              {gameState.p1.holdingSeed && <span className="text-[10px] text-amber-200">🌰 {gameState.p1.holdingSeed.toUpperCase()}</span>}
              {gameState.p1.holdingFruit && <span className="text-[10px] text-amber-300 font-bold">🍎 {gameState.p1.holdingFruit.toUpperCase()}</span>}
            </div>

            {/* TEAM SCORE / VAULT */}
            <div className="flex items-center justify-center gap-2 text-emerald-400 bg-slate-900/80 p-1.5 rounded border border-emerald-500/40 text-center">
              {activeGameMode === 'explorer' ? (
                <span className="text-emerald-300 flex items-center gap-1 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> TEAM: {gameState.teamScore} PTS ({gameState.biomeName.toUpperCase()})
                </span>
              ) : (
                <span className="text-amber-300 flex items-center gap-1 text-sm">
                  <Sprout className="w-4 h-4 text-emerald-400" /> FARM VAULT: {gameState.teamGold} GOLD ({gameState.crops?.length || 0} CROPS)
                </span>
              )}
            </div>

            {/* P2 HUD INFO */}
            <div className="flex items-center justify-end gap-2 text-cyan-400 bg-slate-900/80 p-1.5 rounded border border-cyan-500/40">
              <span className="font-bold">P2:</span>
              {activeGameMode === 'explorer' ? (
                <span className="text-cyan-300 flex items-center gap-1">
                  <Gem className="w-3.5 h-3.5" /> {gameState.p2.score} PTS
                </span>
              ) : (
                <span className="text-cyan-300 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" /> {gameState.p2.gold} GOLD
                </span>
              )}
              {gameState.p2.holdingSeed && <span className="text-[10px] text-cyan-200">🌰 {gameState.p2.holdingSeed.toUpperCase()}</span>}
              {gameState.p2.holdingFruit && <span className="text-[10px] text-cyan-300 font-bold">🍎 {gameState.p2.holdingFruit.toUpperCase()}</span>}
            </div>
          </div>
        )}
      </div>

      {/* DUAL PIN BANNERS FOR P1 AND P2 */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 my-1">
        {/* PLAYER 1 PIN & MONSTER SELECT */}
        <div
          className={`retro-box p-1.5 flex items-center justify-between border-2 ${
            isP1Conn ? 'border-emerald-500 bg-emerald-950/40' : 'border-amber-500 bg-slate-900/90'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wifi className={`w-3.5 h-3.5 ${isP1Conn ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <div>
              <div className="text-[8px] font-pixel text-amber-400">PLAYER 1 PIN</div>
              <div className="text-base font-pixel text-amber-300 tracking-wider">{hostPins.p1Pin}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={p1Monster}
              onChange={(e) => setP1Monster(e.target.value as MonsterType)}
              className="retro-btn text-[9px] px-2 py-0.5 bg-slate-950 text-amber-300 border border-amber-500/50 max-w-[140px]"
            >
              {MONSTER_VARIANTS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.emoji} {m.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PLAYER 2 PIN & MONSTER SELECT */}
        <div
          className={`retro-box p-1.5 flex items-center justify-between border-2 ${
            isP2Conn ? 'border-cyan-500 bg-cyan-950/40' : 'border-purple-500 bg-slate-900/90'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wifi className={`w-3.5 h-3.5 ${isP2Conn ? 'text-cyan-400 animate-pulse' : 'text-purple-400'}`} />
            <div>
              <div className="text-[8px] font-pixel text-cyan-400">PLAYER 2 PIN</div>
              <div className="text-base font-pixel text-cyan-300 tracking-wider">{hostPins.p2Pin}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={p2Monster}
              onChange={(e) => setP2Monster(e.target.value as MonsterType)}
              className="retro-btn text-[9px] px-2 py-0.5 bg-slate-950 text-cyan-300 border border-cyan-500/50 max-w-[140px]"
            >
              {MONSTER_VARIANTS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.emoji} {m.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3D STAGE CANVAS - 100% CLEAN PLAY AREA */}
      <div className="relative w-full flex-1 min-h-[360px] rounded-lg overflow-hidden border-4 border-slate-700 bg-black">
        <VoxelCanvas
          gameMode={activeGameMode}
          p1Input={p1Input}
          p2Input={p2Input}
          p1MonsterType={p1Monster}
          p2MonsterType={p2Monster}
          stageTheme={stageTheme}
          onGameStateUpdate={handleGameStateUpdate}
          isHostView={true}
        />
      </div>

      {/* FOOTER KEYBOARD HELP & STATUS */}
      <div className="w-full py-1 text-[10px] font-vt text-slate-400 flex items-center justify-between px-2">
        <span>3D CONTROLS: P1 (WASD + Space + F) • P2 (ARROWS + K + L)</span>
        <span>DYNAMIC SPLIT SCREEN • INDEPENDENT FARM & EXPLORER POSITIONS</span>
      </div>
    </div>
  );
};
