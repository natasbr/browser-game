import React, { useState, useEffect, useRef } from 'react';
import { VoxelCanvas } from './VoxelCanvas';
import {
  PlayerInputState,
  MonsterType,
  StageTheme,
  GameStatePayload,
  PlayerSlot,
  NetworkMessage,
} from '../types';
import {
  createTwoPlayerHost,
  registerHostCallbacks,
  broadcastGameState,
  disconnectMultiplayer,
  HostState,
} from '../lib/multiplayer';
import { sound } from '../lib/sound';
import { Wifi, Volume2, VolumeX, ArrowLeft, Sparkles, Gem, Compass, ShieldCheck } from 'lucide-react';

interface HostViewProps {
  onBackToMenu: () => void;
}

export const HostView: React.FC<HostViewProps> = ({ onBackToMenu }) => {
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
  });

  const [p2Input, setP2Input] = useState<PlayerInputState>({
    up: false,
    down: false,
    left: false,
    right: false,
    jump: false,
    dash: false,
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

    // Keyboard controls for 3D exploration testing on Host
    const handleKeyDown = (e: KeyboardEvent) => {
      // P1: W (Up), S (Down), A (Left), D (Right), Space (Jump), F (Dash)
      if (e.key === 'w' || e.key === 'W') setP1Input((p) => ({ ...p, up: true }));
      if (e.key === 's' || e.key === 'S') setP1Input((p) => ({ ...p, down: true }));
      if (e.key === 'a' || e.key === 'A') setP1Input((p) => ({ ...p, left: true }));
      if (e.key === 'd' || e.key === 'D') setP1Input((p) => ({ ...p, right: true }));
      if (e.key === ' ') setP1Input((p) => ({ ...p, jump: true }));
      if (e.key === 'f' || e.key === 'F') setP1Input((p) => ({ ...p, dash: true }));

      // P2: Arrow keys + K (Jump) + L (Dash)
      if (e.key === 'ArrowUp') setP2Input((p) => ({ ...p, up: true }));
      if (e.key === 'ArrowDown') setP2Input((p) => ({ ...p, down: true }));
      if (e.key === 'ArrowLeft') setP2Input((p) => ({ ...p, left: true }));
      if (e.key === 'ArrowRight') setP2Input((p) => ({ ...p, right: true }));
      if (e.key === 'k' || e.key === 'K') setP2Input((p) => ({ ...p, jump: true }));
      if (e.key === 'l' || e.key === 'L') setP2Input((p) => ({ ...p, dash: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W') setP1Input((p) => ({ ...p, up: false }));
      if (e.key === 's' || e.key === 'S') setP1Input((p) => ({ ...p, down: false }));
      if (e.key === 'a' || e.key === 'A') setP1Input((p) => ({ ...p, left: false }));
      if (e.key === 'd' || e.key === 'D') setP1Input((p) => ({ ...p, right: false }));
      if (e.key === ' ') setP1Input((p) => ({ ...p, jump: false }));
      if (e.key === 'f' || e.key === 'F') setP1Input((p) => ({ ...p, dash: false }));

      if (e.key === 'ArrowUp') setP2Input((p) => ({ ...p, up: false }));
      if (e.key === 'ArrowDown') setP2Input((p) => ({ ...p, down: false }));
      if (e.key === 'ArrowLeft') setP2Input((p) => ({ ...p, left: false }));
      if (e.key === 'ArrowRight') setP2Input((p) => ({ ...p, right: false }));
      if (e.key === 'k' || e.key === 'K') setP2Input((p) => ({ ...p, jump: false }));
      if (e.key === 'l' || e.key === 'L') setP2Input((p) => ({ ...p, dash: false }));
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
          return { ...prev, dash: true };
        default:
          return prev;
      }
    });

    if (action === 'jump') setTimeout(() => setter((p) => ({ ...p, jump: false })), 60);
    if (action === 'dash') setTimeout(() => setter((p) => ({ ...p, dash: false })), 60);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
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
    <div className="flex flex-col items-center justify-between w-full h-screen p-2 md:p-5 bg-slate-950 text-slate-100 max-w-6xl mx-auto select-none">
      {/* TOP HEADER CONTROL BAR */}
      <div className="w-full retro-box p-3 flex flex-wrap items-center justify-between gap-2 bg-slate-900">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToMenu}
            className="retro-btn px-3 py-1.5 text-xs flex items-center gap-1 text-slate-200"
          >
            <ArrowLeft className="w-4 h-4" /> MENU
          </button>
          <div>
            <div className="text-[10px] text-emerald-400 font-pixel">CO-OP EXPLORER</div>
            <div className="text-xs font-vt text-slate-300">VOXEL MONSTER ARENA</div>
          </div>
        </div>

        {/* BIOME OVERRIDE SELECTOR & SOUND */}
        <div className="flex items-center gap-2">
          <select
            value={stageTheme}
            onChange={(e) => setStageTheme(e.target.value as StageTheme)}
            className="retro-btn text-[10px] px-2 py-1.5 bg-slate-800 text-amber-300 border border-slate-600 focus:outline-none"
          >
            <option value="cyber_grid">🌐 CYBER GRID</option>
            <option value="verdant_forest">🌿 VERDANT FOREST</option>
            <option value="crystal_cave">💎 CRYSTAL CAVE</option>
            <option value="volcanic_pit">🔥 VOLCANIC PIT</option>
            <option value="neon_dojo">⚡ NEON DOJO</option>
          </select>

          <button onClick={toggleSound} className="retro-btn p-1.5 text-amber-300">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* DUAL PIN BANNERS FOR P1 AND P2 */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
        {/* PLAYER 1 PIN */}
        <div
          className={`retro-box p-2.5 flex items-center justify-between border-2 ${
            isP1Conn ? 'border-emerald-500 bg-emerald-950/40' : 'border-amber-500 bg-slate-900/90'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wifi className={`w-5 h-5 ${isP1Conn ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <div>
              <div className="text-[9px] font-pixel text-amber-400">PLAYER 1 PIN</div>
              <div className="text-xl font-pixel text-amber-300 tracking-widest">{hostPins.p1Pin}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={p1Monster}
              onChange={(e) => setP1Monster(e.target.value as MonsterType)}
              className="retro-btn text-[9px] px-2 py-1 bg-slate-950 text-amber-300 border border-amber-500/50"
            >
              <option value="blaze_dino">🔥 BLAZE DINO</option>
              <option value="frost_wolf">❄️ FROST WOLF</option>
              <option value="volt_dragon">⚡ VOLT DRAGON</option>
              <option value="terra_golem">🌿 TERRA GOLEM</option>
              <option value="shadow_beast">🟣 SHADOW BEAST</option>
            </select>
            <span
              className={`text-[10px] font-pixel px-2 py-1 rounded ${
                isP1Conn ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isP1Conn ? 'P1 READY' : 'P1 WAITING'}
            </span>
          </div>
        </div>

        {/* PLAYER 2 PIN */}
        <div
          className={`retro-box p-2.5 flex items-center justify-between border-2 ${
            isP2Conn ? 'border-cyan-500 bg-cyan-950/40' : 'border-purple-500 bg-slate-900/90'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wifi className={`w-5 h-5 ${isP2Conn ? 'text-cyan-400 animate-pulse' : 'text-purple-400'}`} />
            <div>
              <div className="text-[9px] font-pixel text-cyan-400">PLAYER 2 PIN</div>
              <div className="text-xl font-pixel text-cyan-300 tracking-widest">{hostPins.p2Pin}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={p2Monster}
              onChange={(e) => setP2Monster(e.target.value as MonsterType)}
              className="retro-btn text-[9px] px-2 py-1 bg-slate-950 text-cyan-300 border border-cyan-500/50"
            >
              <option value="blaze_dino">🔥 BLAZE DINO</option>
              <option value="frost_wolf">❄️ FROST WOLF</option>
              <option value="volt_dragon">⚡ VOLT DRAGON</option>
              <option value="terra_golem">🌿 TERRA GOLEM</option>
              <option value="shadow_beast">🟣 SHADOW BEAST</option>
            </select>
            <span
              className={`text-[10px] font-pixel px-2 py-1 rounded ${
                isP2Conn ? 'bg-cyan-900 text-cyan-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isP2Conn ? 'P2 READY' : 'P2 WAITING'}
            </span>
          </div>
        </div>
      </div>

      {/* STAGE CANVAS */}
      <div className="relative w-full flex-1 min-h-[340px] rounded-lg overflow-hidden border-4 border-slate-700 bg-black">
        <VoxelCanvas
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
            {/* TOP TEAM SCORE & BIOME INFOBAR */}
            <div className="flex items-center justify-between gap-2">
              {/* P1 PLAYER SCORE */}
              <div className="retro-box px-3 py-1.5 bg-slate-900/90 border border-amber-500/80 min-w-[120px]">
                <div className="text-[9px] font-pixel text-amber-400">P1 SCORE</div>
                <div className="text-sm font-pixel text-amber-300 flex items-center gap-1">
                  <Gem className="w-3.5 h-3.5 text-amber-400" />
                  {gameState.p1.score}
                </div>
              </div>

              {/* CENTER TEAM CO-OP SCORE */}
              <div className="retro-box px-4 py-1.5 bg-slate-900/95 border-2 border-emerald-400 text-center shadow-lg">
                <div className="text-[9px] font-pixel text-emerald-400 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> TEAM CO-OP SCORE
                </div>
                <div className="text-xl font-pixel text-emerald-300">{gameState.teamScore} PTS</div>
                <div className="text-[8px] font-vt text-slate-300 flex items-center justify-center gap-1">
                  <Compass className="w-3 h-3 text-cyan-400" /> BIOME: {gameState.biomeName.toUpperCase()} ({gameState.distanceExplored}m)
                </div>
              </div>

              {/* P2 PLAYER SCORE */}
              <div className="retro-box px-3 py-1.5 bg-slate-900/90 border border-cyan-500/80 min-w-[120px] text-right">
                <div className="text-[9px] font-pixel text-cyan-400">P2 SCORE</div>
                <div className="text-sm font-pixel text-cyan-300 flex items-center justify-end gap-1">
                  {gameState.p2.score}
                  <Gem className="w-3.5 h-3.5 text-cyan-400" />
                </div>
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
        <span>GRADUAL BIOME SHIFT AS YOU EXPLORE CELLS</span>
      </div>
    </div>
  );
};
