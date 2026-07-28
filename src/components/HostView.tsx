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
    <div className="flex flex-col items-center justify-between w-full h-screen p-2 md:p-4 bg-slate-950 text-slate-100 max-w-6xl mx-auto select-none overflow-hidden">
      {/* TOP HEADER CONTROL BAR WITH MODE TOGGLE TABS */}
      <div className="w-full retro-box p-2.5 flex flex-wrap items-center justify-between gap-2 bg-slate-900 border-2 border-amber-500/80">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToMenu}
            className="retro-btn px-2.5 py-1.5 text-xs flex items-center gap-1 text-slate-200"
          >
            <ArrowLeft className="w-4 h-4" /> MENU
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
            <Save className="w-3 h-3 text-emerald-400 animate-pulse" /> AUTO-SAVED
          </div>

          <button onClick={toggleSound} className="retro-btn p-1.5 text-amber-300">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* CLEAR 1P / LOCAL PLAY NOTICE */}
      <div className="w-full bg-slate-900/90 border-x-2 border-b-2 border-cyan-500/50 px-3 py-1 text-center text-[11px] font-vt text-cyan-300 flex items-center justify-center gap-2">
        <Gamepad2 className="w-4 h-4 text-cyan-400" />
        <span>
          <b>1P / LOCAL KEYBOARD MODE ACTIVE:</b> Play directly on this screen using <b>WASD</b> (P1) and <b>Arrows</b> (P2), or connect Cast remotes with the PINs below!
        </span>
      </div>

      {/* DUAL PIN BANNERS FOR P1 AND P2 + 30+ MONSTER SELECTION */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-1.5">
        {/* PLAYER 1 PIN & MONSTER SELECT */}
        <div
          className={`retro-box p-2 flex items-center justify-between border-2 ${
            isP1Conn ? 'border-emerald-500 bg-emerald-950/40' : 'border-amber-500 bg-slate-900/90'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wifi className={`w-4 h-4 ${isP1Conn ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <div>
              <div className="text-[8px] font-pixel text-amber-400">PLAYER 1 PIN</div>
              <div className="text-lg font-pixel text-amber-300 tracking-wider">{hostPins.p1Pin}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={p1Monster}
              onChange={(e) => setP1Monster(e.target.value as MonsterType)}
              className="retro-btn text-[9px] px-2 py-1 bg-slate-950 text-amber-300 border border-amber-500/50 max-w-[150px]"
            >
              {MONSTER_VARIANTS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.emoji} {m.name.toUpperCase()}
                </option>
              ))}
            </select>
            <span
              className={`text-[9px] font-pixel px-1.5 py-0.5 rounded ${
                isP1Conn ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isP1Conn ? 'P1 CAST' : 'P1 1P/CAST'}
            </span>
          </div>
        </div>

        {/* PLAYER 2 PIN & MONSTER SELECT */}
        <div
          className={`retro-box p-2 flex items-center justify-between border-2 ${
            isP2Conn ? 'border-cyan-500 bg-cyan-950/40' : 'border-purple-500 bg-slate-900/90'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wifi className={`w-4 h-4 ${isP2Conn ? 'text-cyan-400 animate-pulse' : 'text-purple-400'}`} />
            <div>
              <div className="text-[8px] font-pixel text-cyan-400">PLAYER 2 PIN</div>
              <div className="text-lg font-pixel text-cyan-300 tracking-wider">{hostPins.p2Pin}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={p2Monster}
              onChange={(e) => setP2Monster(e.target.value as MonsterType)}
              className="retro-btn text-[9px] px-2 py-1 bg-slate-950 text-cyan-300 border border-cyan-500/50 max-w-[150px]"
            >
              {MONSTER_VARIANTS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.emoji} {m.name.toUpperCase()}
                </option>
              ))}
            </select>
            <span
              className={`text-[9px] font-pixel px-1.5 py-0.5 rounded ${
                isP2Conn ? 'bg-cyan-900 text-cyan-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isP2Conn ? 'P2 CAST' : 'P2 1P/CAST'}
            </span>
          </div>
        </div>
      </div>

      {/* STAGE CANVAS */}
      <div className="relative w-full flex-1 min-h-[340px] rounded-lg overflow-hidden border-4 border-slate-700 bg-black">
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

        {/* HUD OVERLAY ON CANVAS */}
        {gameState && (
          <div className="absolute top-2 left-2 right-2 flex flex-col gap-1.5 pointer-events-none">
            {/* TOP HUD BAR */}
            <div className="flex items-center justify-between gap-2">
              {/* P1 STATUS */}
              <div className="retro-box px-3 py-1.5 bg-slate-900/90 border border-amber-500/80 min-w-[130px]">
                <div className="text-[9px] font-pixel text-amber-400">P1 MONSTER</div>
                {activeGameMode === 'explorer' ? (
                  <div className="text-sm font-pixel text-amber-300 flex items-center gap-1">
                    <Gem className="w-3.5 h-3.5 text-amber-400" />
                    {gameState.p1.score} PTS
                  </div>
                ) : (
                  <div className="text-sm font-pixel text-amber-300 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    {gameState.p1.gold} GOLD
                  </div>
                )}
                {gameState.p1.holdingSeed && (
                  <div className="text-[9px] font-vt text-amber-200">HOLDING: {gameState.p1.holdingSeed.toUpperCase()} SEED 🌰</div>
                )}
                {gameState.p1.holdingFruit && (
                  <div className="text-[9px] font-vt text-amber-300 font-bold">HOLDING: {gameState.p1.holdingFruit.toUpperCase()} FRUIT 🍎</div>
                )}
              </div>

              {/* CENTER MODE TEAM HUD */}
              <div className="retro-box px-4 py-1.5 bg-slate-900/95 border-2 border-emerald-400 text-center shadow-lg">
                {activeGameMode === 'explorer' ? (
                  <>
                    <div className="text-[9px] font-pixel text-emerald-400 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> TEAM CO-OP SCORE
                    </div>
                    <div className="text-xl font-pixel text-emerald-300">{gameState.teamScore} PTS</div>
                    <div className="text-[8px] font-vt text-slate-300 flex items-center justify-center gap-1">
                      <Compass className="w-3 h-3 text-cyan-400" /> BIOME: {gameState.biomeName.toUpperCase()} ({gameState.distanceExplored}m)
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[9px] font-pixel text-emerald-400 flex items-center justify-center gap-1">
                      <Sprout className="w-3.5 h-3.5 text-emerald-400" /> CO-OP FARM VAULT
                    </div>
                    <div className="text-xl font-pixel text-amber-300">{gameState.teamGold} GOLD</div>
                    <div className="text-[8px] font-vt text-emerald-200">
                      CROPS PLANTED: {gameState.crops?.length || 0} TILES
                    </div>
                  </>
                )}
              </div>

              {/* P2 STATUS */}
              <div className="retro-box px-3 py-1.5 bg-slate-900/90 border border-cyan-500/80 min-w-[130px] text-right">
                <div className="text-[9px] font-pixel text-cyan-400">P2 MONSTER</div>
                {activeGameMode === 'explorer' ? (
                  <div className="text-sm font-pixel text-cyan-300 flex items-center justify-end gap-1">
                    {gameState.p2.score} PTS
                    <Gem className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                ) : (
                  <div className="text-sm font-pixel text-cyan-300 flex items-center justify-end gap-1">
                    {gameState.p2.gold} GOLD
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                )}
                {gameState.p2.holdingSeed && (
                  <div className="text-[9px] font-vt text-cyan-200">HOLDING: {gameState.p2.holdingSeed.toUpperCase()} SEED 🌰</div>
                )}
                {gameState.p2.holdingFruit && (
                  <div className="text-[9px] font-vt text-cyan-300 font-bold">HOLDING: {gameState.p2.holdingFruit.toUpperCase()} FRUIT 🍎</div>
                )}
              </div>
            </div>

            {/* ANNOUNCEMENT FEEDBACK BANNER */}
            <div className="w-full text-center mt-0.5">
              <span className="retro-box px-4 py-1 text-xs font-pixel bg-slate-900/90 text-amber-300 border border-amber-500/60 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {gameState.announcement}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER KEYBOARD HELP */}
      <div className="w-full py-1 text-[10px] font-vt text-slate-400 flex items-center justify-between px-2">
        <span>3D CONTROLS: P1 (WASD + Space + F) • P2 (ARROWS + K + L)</span>
        <span>MODES & STATES PERIST ON PC / MOBILE / BROWSER</span>
      </div>
    </div>
  );
};
