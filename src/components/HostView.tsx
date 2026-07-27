import React, { useState, useEffect, useRef } from 'react';
import { VoxelCanvas } from './VoxelCanvas';
import { PlayerInputState, MonsterType, NetworkMessage, GameStatePayload } from '../types';
import {
  createHost,
  registerNetworkCallbacks,
  sendData,
  disconnectMultiplayer,
} from '../lib/multiplayer';
import { sound } from '../lib/sound';
import { Wifi, Volume2, VolumeX, RefreshCw, ArrowLeft, Shield, Sparkles } from 'lucide-react';

interface HostViewProps {
  onBackToMenu: () => void;
}

export const HostView: React.FC<HostViewProps> = ({ onBackToMenu }) => {
  const [hostCode, setHostCode] = useState<string>('----');
  const [connectionStatus, setConnectionStatus] = useState<string>('Initializing P2P Host...');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [monsterType, setMonsterType] = useState<MonsterType>('voxel_agumon');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [score, setScore] = useState<number>(0);
  const [actionText, setActionText] = useState<string>('WAITING FOR CAST CONTROLLER');

  // Input state from Cast player
  const [inputState, setInputState] = useState<PlayerInputState>({
    left: false,
    right: false,
    jump: false,
    attack: false,
  });

  const lastSendTimeRef = useRef<number>(0);

  useEffect(() => {
    // Start PeerJS Host
    const code = createHost();
    setHostCode(code);

    registerNetworkCallbacks({
      onStatus: (status) => setConnectionStatus(status),
      onEstablished: () => {
        setIsConnected(true);
        setConnectionStatus('CAST PLAYER CONNECTED!');
        sound.playConnectFanfare();
        setActionText('CAST CONNECTED! READY!');

        // Send initial handshake state
        sendData('host_ack', {
          connected: true,
          message: 'Host ready. Controller synchronized.',
        });
      },
      onClosed: () => {
        setIsConnected(false);
        setConnectionStatus('Cast player disconnected.');
        setActionText('CAST DISCONNECTED');
      },
      onError: (err) => {
        console.error('Host network error:', err);
        setConnectionStatus('P2P Error. Please try restarting.');
      },
      onMessage: (msg: NetworkMessage) => {
        if (msg.type === 'player_input') {
          const payload = msg.payload as PlayerInputState;
          setInputState(payload);
        } else if (msg.type === 'player_action') {
          const actionPayload = msg.payload as { action: string };
          handleActionMessage(actionPayload.action);
        }
      },
    });

    return () => {
      disconnectMultiplayer();
    };
  }, []);

  const handleActionMessage = (action: string) => {
    setInputState((prev) => {
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
        default:
          return prev;
      }
    });

    // Reset single-shot triggers after a frame
    if (action === 'jump') {
      setTimeout(() => setInputState((prev) => ({ ...prev, jump: false })), 50);
    }
    if (action === 'attack') {
      setTimeout(() => setInputState((prev) => ({ ...prev, attack: false })), 50);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
  };

  // Throttled state broadcaster to Cast player (approx 15-20 times per second)
  const handleGameStateUpdate = (state: {
    x: number;
    y: number;
    facing: 'left' | 'right';
    hp: number;
    score: number;
    actionText: string;
    isAttacking: boolean;
  }) => {
    setScore(state.score);
    setActionText(state.actionText);

    const now = Date.now();
    if (now - lastSendTimeRef.current > 60) {
      lastSendTimeRef.current = now;
      const payload: GameStatePayload = {
        hp: state.hp,
        maxHp: 100,
        score: state.score,
        actionText: state.actionText,
        facing: state.facing,
        x: state.x,
        y: state.y,
        isAttacking: state.isAttacking,
        monsterType: monsterType,
        lastAction: state.actionText,
      };
      sendData('game_state', payload);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-screen p-3 md:p-6 bg-slate-950 text-slate-100 max-w-6xl mx-auto select-none">
      {/* TOP STATUS BAR */}
      <div className="w-full retro-box p-3 md:p-4 flex flex-wrap items-center justify-between gap-3 bg-slate-900 mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMenu}
            className="retro-btn px-3 py-2 text-xs flex items-center gap-1 text-slate-200"
          >
            <ArrowLeft className="w-4 h-4" /> MENU
          </button>
          <div>
            <div className="text-[10px] text-amber-400 font-pixel">HOST SCREEN</div>
            <div className="text-xs font-vt text-slate-300">PS1 VOXEL DIGIMON ARENA</div>
          </div>
        </div>

        {/* 4-DIGIT HOST CODE BANNER */}
        <div className="retro-box-gold px-4 py-2 flex items-center gap-3">
          <Wifi className={`w-5 h-5 ${isConnected ? 'text-green-400 animate-pulse' : 'text-amber-400'}`} />
          <div>
            <div className="text-[9px] text-amber-300 font-pixel">CONNECTION CODE</div>
            <div className="text-2xl font-pixel text-amber-400 tracking-widest">{hostCode}</div>
          </div>
        </div>

        {/* CONTROLS & MONSTER SELECTOR */}
        <div className="flex items-center gap-2">
          <select
            value={monsterType}
            onChange={(e) => setMonsterType(e.target.value as MonsterType)}
            className="retro-btn text-[10px] px-2 py-2 bg-slate-800 text-amber-300 border border-slate-600 focus:outline-none"
          >
            <option value="voxel_agumon">🔥 AGUMON VOXEL</option>
            <option value="voxel_gabumon">⚡ GABUMON VOXEL</option>
            <option value="voxel_veemon">💨 VEEMON VOXEL</option>
          </select>

          <button onClick={toggleSound} className="retro-btn p-2 text-amber-300">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* NETWORK CONNECTION STATUS BANNER */}
      <div
        className={`w-full text-center py-1.5 px-3 text-xs font-pixel mb-2 border ${
          isConnected
            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
            : 'bg-amber-950/80 border-amber-500 text-amber-300 animate-pulse'
        }`}
      >
        {connectionStatus}
      </div>

      {/* MAIN GAME STAGE CANVAS */}
      <div className="relative w-full flex-1 min-h-[320px] rounded-lg overflow-hidden border-4 border-slate-700 bg-black">
        <VoxelCanvas
          inputState={inputState}
          monsterType={monsterType}
          onGameStateUpdate={handleGameStateUpdate}
          isHostView={true}
        />

        {/* HUD OVERLAY ON CANVAS */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* ACTION TEXT LOG */}
          <div className="retro-box px-3 py-1.5 text-[10px] font-pixel text-cyan-300 bg-slate-900/90 border border-cyan-500/50">
            <Sparkles className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
            {actionText}
          </div>

          {/* TARGET SCORE */}
          <div className="retro-box px-3 py-1.5 text-[10px] font-pixel text-amber-400 bg-slate-900/90 border border-amber-500/50">
            SCORE: {score}
          </div>
        </div>

        {/* INPUT TELEMETRY DEBUG BADGE */}
        <div className="absolute bottom-3 left-3 retro-box p-2 text-[9px] font-vt text-slate-300 bg-slate-950/80 pointer-events-none flex gap-2">
          <span>LEFT: {inputState.left ? '🔴' : '⚪'}</span>
          <span>RIGHT: {inputState.right ? '🔴' : '⚪'}</span>
          <span>JUMP: {inputState.jump ? '🔴' : '⚪'}</span>
          <span>ATTACK: {inputState.attack ? '🔴' : '⚪'}</span>
        </div>
      </div>

      {/* BOTTOM FOOTER INSTRUCTIONS */}
      <div className="w-full text-center py-2 text-[10px] font-vt text-slate-400 flex items-center justify-between px-2">
        <span>MEGA DRIVE & PS1 ERA VOXEL MULTIPLAYER</span>
        <span>CAST PLAYER CONTROLS THE CHARACTER IN REAL-TIME</span>
      </div>
    </div>
  );
};
