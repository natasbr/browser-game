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
import { Wifi, Volume2, VolumeX, ArrowLeft, Sparkles, Swords } from 'lucide-react';

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
    left: false,
    right: false,
    jump: false,
    attack: false,
    special: false,
  });

  const [p2Input, setP2Input] = useState<PlayerInputState>({
    left: false,
    right: false,
    jump: false,
    attack: false,
    special: false,
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

    // Keyboard controls for local testing on Host
    const handleKeyDown = (e: KeyboardEvent) => {
      // P1: WASD + F (Attack) + G (Special)
      if (e.key === 'a' || e.key === 'A') setP1Input((p) => ({ ...p, left: true }));
      if (e.key === 'd' || e.key === 'D') setP1Input((p) => ({ ...p, right: true }));
      if (e.key === 'w' || e.key === 'W' || e.key === ' ') setP1Input((p) => ({ ...p, jump: true }));
      if (e.key === 'f' || e.key === 'F') setP1Input((p) => ({ ...p, attack: true }));
      if (e.key === 'g' || e.key === 'G') setP1Input((p) => ({ ...p, special: true }));

      // P2: Arrows + K (Attack) + L (Special)
      if (e.key === 'ArrowLeft') setP2Input((p) => ({ ...p, left: true }));
      if (e.key === 'ArrowRight') setP2Input((p) => ({ ...p, right: true }));
      if (e.key === 'ArrowUp') setP2Input((p) => ({ ...p, jump: true }));
      if (e.key === 'k' || e.key === 'K') setP2Input((p) => ({ ...p, attack: true }));
      if (e.key === 'l' || e.key === 'L') setP2Input((p) => ({ ...p, special: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') setP1Input((p) => ({ ...p, left: false }));
      if (e.key === 'd' || e.key === 'D') setP1Input((p) => ({ ...p, right: false }));
      if (e.key === 'w' || e.key === 'W' || e.key === ' ') setP1Input((p) => ({ ...p, jump: false }));
      if (e.key === 'f' || e.key === 'F') setP1Input((p) => ({ ...p, attack: false }));
      if (e.key === 'g' || e.key === 'G') setP1Input((p) => ({ ...p, special: false }));

      if (e.key === 'ArrowLeft') setP2Input((p) => ({ ...p, left: false }));
      if (e.key === 'ArrowRight') setP2Input((p) => ({ ...p, right: false }));
      if (e.key === 'ArrowUp') setP2Input((p) => ({ ...p, jump: false }));
      if (e.key === 'k' || e.key === 'K') setP2Input((p) => ({ ...p, attack: false }));
      if (e.key === 'l' || e.key === 'L') setP2Input((p) => ({ ...p, special: false }));
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
        case 'attack':
          return { ...prev, attack: true };
        case 'special':
          return { ...prev, special: true };
        default:
          return prev;
      }
    });

    if (action === 'jump') setTimeout(() => setter((p) => ({ ...p, jump: false })), 60);
    if (action === 'attack') setTimeout(() => setter((p) => ({ ...p, attack: false })), 60);
    if (action === 'special') setTimeout(() => setter((p) => ({ ...p, special: false })), 60);
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
            <div className="text-[10px] text-amber-400 font-pixel">ARENA HOST</div>
            <div className="text-xs font-vt text-slate-300">VOXEL MONSTER ARENA</div>
          </div>
        </div>

        {/* STAGE SELECTOR & SOUND */}
        <div className="flex items-center gap-2">
          <select
            value={stageTheme}
            onChange={(e) => setStageTheme(e.target.value as StageTheme)}
            className="retro-btn text-[10px] px-2 py-1.5 bg-slate-800 text-amber-300 border border-slate-600 focus:outline-none"
          >
            <option value="cyber_grid">🌐 CYBER GRID</option>
            <option value="volcanic_pit">🔥 VOLCANIC PIT</option>
            <option value="neon_dojo">⚡ NEON DOJO</option>
            <option value="crystal_cave">💎 CRYSTAL CAVE</option>
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
          className={`retro-box p-3 flex items-center justify-between border-2 ${
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
            <span className={`text-[10px] font-pixel px-2 py-1 rounded ${isP1Conn ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
              {isP1Conn ? 'P1 READY' : 'P1 WAITING'}
            </span>
          </div>
        </div>

        {/* PLAYER 2 PIN */}
        <div
          className={`retro-box p-3 flex items-center justify-between border-2 ${
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
            <span className={`text-[10px] font-pixel px-2 py-1 rounded ${isP2Conn ? 'bg-cyan-900 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
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
          <div className="absolute top-2 left-2 right-2 flex flex-col gap-1 pointer-events-none">
            {/* TOP SCORES / HP BARS / TIMER */}
            <div className="flex items-center justify-between gap-2">
              {/* P1 HP HUD */}
              <div className="retro-box p-2 bg-slate-900/90 border border-amber-500/80 w-44 sm:w-56">
                <div className="flex justify-between items-center text-[10px] font-pixel text-amber-400 mb-1">
                  <span>P1 (WINS: {gameState.p1.wins})</span>
                  <span>{gameState.p1.hp} HP</span>
                </div>
                {/* HP BAR */}
                <div className="w-full h-3 bg-slate-950 rounded border border-slate-700 overflow-hidden mb-1">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-150"
                    style={{ width: `${gameState.p1.hp}%` }}
                  />
                </div>
                {/* ENERGY BAR */}
                <div className="w-full h-1.5 bg-slate-950 rounded border border-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-yellow-400"
                    style={{ width: `${gameState.p1.energy}%` }}
                  />
                </div>
              </div>

              {/* CENTER TIMER / ROUND */}
              <div className="retro-box px-3 py-1 bg-slate-900/95 border-2 border-amber-400 text-center">
                <div className="text-[9px] font-pixel text-slate-400">ROUND {gameState.round}</div>
                <div className="text-xl font-pixel text-amber-400">{gameState.timer}s</div>
              </div>

              {/* P2 HP HUD */}
              <div className="retro-box p-2 bg-slate-900/90 border border-cyan-500/80 w-44 sm:w-56 text-right">
                <div className="flex justify-between items-center text-[10px] font-pixel text-cyan-400 mb-1">
                  <span>{gameState.p2.hp} HP</span>
                  <span>P2 (WINS: {gameState.p2.wins})</span>
                </div>
                {/* HP BAR */}
                <div className="w-full h-3 bg-slate-950 rounded border border-slate-700 overflow-hidden mb-1">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-150 ml-auto"
                    style={{ width: `${gameState.p2.hp}%` }}
                  />
                </div>
                {/* ENERGY BAR */}
                <div className="w-full h-1.5 bg-slate-950 rounded border border-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-300 ml-auto"
                    style={{ width: `${gameState.p2.energy}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ANNOUNCEMENT BANNER */}
            <div className="w-full text-center mt-1">
              <span className="retro-box px-4 py-1 text-xs font-pixel bg-slate-900/90 text-amber-300 border border-amber-500/60 inline-flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-amber-400" />
                {gameState.p1.actionText !== 'READY!' ? gameState.p1.actionText : gameState.p2.actionText}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* KEYBOARD QUICK CONTROLS INSTRUCTION */}
      <div className="w-full py-1 text-[10px] font-vt text-slate-400 flex items-center justify-between px-2">
        <span>LOCAL TEST: P1 (WASD + F / G) • P2 (ARROWS + K / L)</span>
        <span>PEERJS 1.5.2 DUAL-PIN MULTIPLAYER</span>
      </div>
    </div>
  );
};
