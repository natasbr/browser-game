import React, { useState, useEffect, useRef } from 'react';
import {
  connectClientToHost,
  registerClientCallbacks,
  sendClientMessage,
  disconnectMultiplayer,
} from '../lib/multiplayer';
import { NetworkMessage, GameStatePayload, PlayerSlot } from '../types';
import { sound } from '../lib/sound';
import { VoxelCanvas } from './VoxelCanvas';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Zap,
  Wifi,
  Volume2,
  VolumeX,
  Radio,
  Gamepad2,
  ChevronLeft,
  Gem,
  Wind,
  Coins,
  Sprout,
  Hand,
  Tv,
} from 'lucide-react';

interface CastViewProps {
  onBackToMenu: () => void;
}

export const CastView: React.FC<CastViewProps> = ({ onBackToMenu }) => {
  const [inputPin, setInputPin] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('Enter Host PIN to connect.');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [assignedSlot, setAssignedSlot] = useState<PlayerSlot | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Synced state from Host
  const [syncedState, setSyncedState] = useState<GameStatePayload | null>(null);

  // Pressed states for touch controls
  const [isUpPressed, setIsUpPressed] = useState<boolean>(false);
  const [isDownPressed, setIsDownPressed] = useState<boolean>(false);
  const [isLeftPressed, setIsLeftPressed] = useState<boolean>(false);
  const [isRightPressed, setIsRightPressed] = useState<boolean>(false);

  // Local controller input state to pass to VoxelCanvas view
  const [myInput, setMyInput] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    jump: false,
    dash: false,
    interact: false,
  });

  const isConnectedRef = useRef<boolean>(false);
  isConnectedRef.current = isConnected;

  useEffect(() => {
    registerClientCallbacks({
      onStatus: (status, isConn, slot) => {
        setConnectionStatus(status);
        setIsConnected(isConn);
        if (slot) setAssignedSlot(slot);
        if (isConn) {
          sound.playConnectFanfare();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
        }
      },
      onMessage: (msg: NetworkMessage) => {
        if (msg.type === 'game_state') {
          setSyncedState(msg.payload as GameStatePayload);
        }
      },
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isConnectedRef.current) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') handleUpPress();
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') handleDownPress();
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') handleLeftPress();
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') handleRightPress();
      if (e.key === ' ') handleJumpPress();
      if (e.key === 'f' || e.key === 'F' || e.key === 'l' || e.key === 'L' || e.key === 'Shift') handleDashPress();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isConnectedRef.current) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') handleUpRelease();
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') handleDownRelease();
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') handleLeftRelease();
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') handleRightRelease();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      disconnectMultiplayer();
    };
  }, []);

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin.trim().length === 4) {
      connectClientToHost(inputPin.trim());
    } else {
      setConnectionStatus('Please enter a 4-digit PIN.');
    }
  };

  // Controller Direction Handlers
  const handleUpPress = () => {
    setIsUpPressed(true);
    setMyInput((p) => ({ ...p, up: true }));
    sound.playBeep(340, 0.04);
    sendClientMessage('player_action', { action: 'up_press' });
  };
  const handleUpRelease = () => {
    setIsUpPressed(false);
    setMyInput((p) => ({ ...p, up: false }));
    sendClientMessage('player_action', { action: 'up_release' });
  };

  const handleDownPress = () => {
    setIsDownPressed(true);
    setMyInput((p) => ({ ...p, down: true }));
    sound.playBeep(260, 0.04);
    sendClientMessage('player_action', { action: 'down_press' });
  };
  const handleDownRelease = () => {
    setIsDownPressed(false);
    setMyInput((p) => ({ ...p, down: false }));
    sendClientMessage('player_action', { action: 'down_release' });
  };

  const handleLeftPress = () => {
    setIsLeftPressed(true);
    setMyInput((p) => ({ ...p, left: true }));
    sound.playBeep(280, 0.04);
    sendClientMessage('player_action', { action: 'left_press' });
  };
  const handleLeftRelease = () => {
    setIsLeftPressed(false);
    setMyInput((p) => ({ ...p, left: false }));
    sendClientMessage('player_action', { action: 'left_release' });
  };

  const handleRightPress = () => {
    setIsRightPressed(true);
    setMyInput((p) => ({ ...p, right: true }));
    sound.playBeep(320, 0.04);
    sendClientMessage('player_action', { action: 'right_press' });
  };
  const handleRightRelease = () => {
    setIsRightPressed(false);
    setMyInput((p) => ({ ...p, right: false }));
    sendClientMessage('player_action', { action: 'right_release' });
  };

  const handleJumpPress = () => {
    setMyInput((p) => ({ ...p, jump: true }));
    setTimeout(() => setMyInput((p) => ({ ...p, jump: false })), 60);
    sound.playJump();
    sendClientMessage('player_action', { action: 'jump' });
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleDashPress = () => {
    setMyInput((p) => ({ ...p, dash: true, interact: true }));
    setTimeout(() => setMyInput((p) => ({ ...p, dash: false, interact: false })), 60);
    sound.playDash();
    sendClientMessage('player_action', { action: 'dash' });
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(60);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
  };

  // Get current player's state
  const myState =
    syncedState && assignedSlot === 'P2'
      ? syncedState.p2
      : syncedState
      ? syncedState.p1
      : null;

  const myNearbyContext =
    syncedState && assignedSlot === 'P2'
      ? syncedState.p2NearbyContext
      : syncedState
      ? syncedState.p1NearbyContext
      : '';

  const isP2 = assignedSlot === 'P2';
  const isFarmMode = syncedState?.gameMode === 'farm';

  const emptyInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    jump: false,
    dash: false,
    interact: false,
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-screen p-2 md:p-4 bg-slate-950 text-slate-100 max-w-2xl mx-auto select-none overflow-hidden">
      {/* HEADER */}
      <div className="w-full retro-box p-2 flex items-center justify-between bg-slate-900">
        <button
          onClick={onBackToMenu}
          className="retro-btn px-2.5 py-1 text-xs flex items-center gap-1 text-slate-200"
        >
          <ChevronLeft className="w-4 h-4" /> MENU
        </button>

        <div className="text-center">
          <div className={`text-[10px] font-pixel ${isP2 ? 'text-cyan-400' : 'text-amber-400'}`}>
            {assignedSlot ? `${assignedSlot} LIVE POV CAST` : 'CAST REMOTE'}
          </div>
          <div className="text-[10px] font-vt text-slate-400">
            {isFarmMode ? '🌾 FARM SIMULATOR CONTROLLER' : '🏆 ARENA EXPLORER CONTROLLER'}
          </div>
        </div>

        <button onClick={toggleSound} className="retro-btn p-1.5 text-amber-300">
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>
      </div>

      {/* CONNECT SCREEN */}
      {!isConnected ? (
        <div className="w-full max-w-md my-auto retro-box p-6 bg-slate-900 text-center flex flex-col items-center gap-5">
          <div className="p-3 bg-amber-500/10 rounded-full border-2 border-amber-500/40 text-amber-400">
            <Radio className="w-10 h-10 animate-pulse" />
          </div>

          <div>
            <h2 className="text-sm font-pixel text-amber-400 mb-1">ENTER HOST PIN</h2>
            <p className="text-xs font-vt text-slate-400">
              Type either Player 1 PIN or Player 2 PIN shown on the Host screen
            </p>
          </div>

          <form onSubmit={handleConnectSubmit} className="w-full flex flex-col items-center gap-4">
            <input
              type="text"
              maxLength={4}
              pattern="[0-9]*"
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              className="w-48 text-center text-3xl tracking-[0.5em] font-pixel bg-slate-950 border-4 border-amber-500/80 text-amber-300 py-3 rounded focus:outline-none focus:border-amber-400 shadow-inner"
              autoFocus
            />

            <button
              type="submit"
              disabled={inputPin.length !== 4}
              className={`w-full py-3.5 px-4 font-pixel text-xs retro-btn-yellow transition-all ${
                inputPin.length === 4 ? 'opacity-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              CONNECT TO CO-OP ARENA
            </button>
          </form>

          <div className="text-xs font-vt text-amber-300 bg-slate-950/80 p-2 rounded border border-slate-800 w-full">
            STATUS: {connectionStatus}
          </div>
        </div>
      ) : (
        /* CONNECTED CONTROLLER SCREEN WITH LIVE 3D POV SCREEN */
        <div className="w-full flex-1 flex flex-col items-center justify-between gap-2 py-1 overflow-hidden">
          {/* LIVE 3D POV SCREEN ACCORDING TO ASSIGNED PLAYER SLOT */}
          <div className="relative w-full h-[180px] sm:h-[220px] rounded-lg overflow-hidden border-2 border-slate-700 bg-black">
            <div className="absolute top-1 left-1.5 z-10 text-[9px] font-pixel bg-slate-900/90 px-2 py-0.5 rounded border border-amber-500/60 text-amber-300 flex items-center gap-1">
              <Tv className="w-3 h-3 text-emerald-400" /> LIVE POV STREAM ({assignedSlot})
            </div>
            <VoxelCanvas
              gameMode={syncedState?.gameMode || 'explorer'}
              p1Input={assignedSlot === 'P1' ? myInput : emptyInput}
              p2Input={assignedSlot === 'P2' ? myInput : emptyInput}
              p1MonsterType={syncedState?.p1.monsterType || 'blaze_dino'}
              p2MonsterType={syncedState?.p2.monsterType || 'frost_wolf'}
              stageTheme={syncedState?.stageTheme || 'cyber_grid'}
              focusSlot={assignedSlot}
            />
          </div>

          {/* PLAYER HUD SYNC FROM HOST */}
          <div
            className={`w-full retro-box p-2 bg-slate-900 border-2 ${
              isP2 ? 'border-cyan-500/80' : 'border-amber-500/80'
            } flex flex-col gap-1.5`}
          >
            <div className="flex items-center justify-between text-[10px] font-pixel">
              <span className={`flex items-center gap-1 ${isP2 ? 'text-cyan-400' : 'text-amber-400'}`}>
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                SLOT: {assignedSlot} ({myState ? myState.monsterType.toUpperCase().replace('_', ' ') : 'MONSTER'})
              </span>
              <span className="text-emerald-400 font-pixel">
                {isFarmMode ? `VAULT: ${syncedState?.teamGold ?? 0} GOLD` : `TEAM SCORE: ${syncedState?.teamScore ?? 0}`}
              </span>
            </div>

            {/* CONTEXT ACTION BADGE */}
            {myNearbyContext ? (
              <div className="bg-emerald-950/90 p-1.5 rounded border border-emerald-400 text-center animate-bounce">
                <span className="text-xs font-pixel text-emerald-300 flex items-center justify-center gap-1.5">
                  <Hand className="w-4 h-4 text-emerald-400" /> {myNearbyContext} (PRESS ACTION)
                </span>
              </div>
            ) : (
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800 text-center">
                <div className="text-xs font-pixel text-amber-300 tracking-wide">
                  {myState?.actionText || syncedState?.announcement || 'EXPLORE THE 3D ARENA!'}
                </div>
              </div>
            )}
          </div>

          {/* TOUCH GAMEPAD WITH 3D D-PAD */}
          <div
            className={`w-full retro-box p-3 bg-slate-900/90 border-2 ${
              isP2 ? 'border-cyan-500/60' : 'border-amber-500/60'
            } rounded-xl flex flex-col items-center gap-2 shadow-xl`}
          >
            <div className="w-full flex items-center justify-between gap-2 px-1">
              {/* 3D CROSS D-PAD (UP, DOWN, LEFT, RIGHT) */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* UP */}
                <button
                  onMouseDown={handleUpPress}
                  onMouseUp={handleUpRelease}
                  onMouseLeave={handleUpRelease}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleUpPress();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleUpRelease();
                  }}
                  className={`absolute top-0 w-10 h-10 rounded-t-lg retro-btn flex items-center justify-center ${
                    isUpPressed ? 'bg-amber-600 border-amber-300 scale-95' : 'bg-slate-800'
                  }`}
                >
                  <ArrowUp className="w-5 h-5 text-slate-100" />
                </button>

                {/* DOWN */}
                <button
                  onMouseDown={handleDownPress}
                  onMouseUp={handleDownRelease}
                  onMouseLeave={handleDownRelease}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleDownPress();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleDownRelease();
                  }}
                  className={`absolute bottom-0 w-10 h-10 rounded-b-lg retro-btn flex items-center justify-center ${
                    isDownPressed ? 'bg-amber-600 border-amber-300 scale-95' : 'bg-slate-800'
                  }`}
                >
                  <ArrowDown className="w-5 h-5 text-slate-100" />
                </button>

                {/* LEFT */}
                <button
                  onMouseDown={handleLeftPress}
                  onMouseUp={handleLeftRelease}
                  onMouseLeave={handleLeftRelease}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleLeftPress();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleLeftRelease();
                  }}
                  className={`absolute left-0 w-10 h-10 rounded-l-lg retro-btn flex items-center justify-center ${
                    isLeftPressed ? 'bg-amber-600 border-amber-300 scale-95' : 'bg-slate-800'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5 text-slate-100" />
                </button>

                {/* RIGHT */}
                <button
                  onMouseDown={handleRightPress}
                  onMouseUp={handleRightRelease}
                  onMouseLeave={handleRightRelease}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleRightPress();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleRightRelease();
                  }}
                  className={`absolute right-0 w-10 h-10 rounded-r-lg retro-btn flex items-center justify-center ${
                    isRightPressed ? 'bg-amber-600 border-amber-300 scale-95' : 'bg-slate-800'
                  }`}
                >
                  <ArrowRight className="w-5 h-5 text-slate-100" />
                </button>

                <div className="w-8 h-8 bg-slate-950 border border-slate-700 rounded-sm flex items-center justify-center text-[8px] font-pixel text-slate-500">
                  3D
                </div>
              </div>

              {/* ACTION BUTTONS (JUMP, DASH / ACTION) */}
              <div className="flex items-center gap-3">
                {/* JUMP / A */}
                <button
                  onMouseDown={handleJumpPress}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleJumpPress();
                  }}
                  className="w-14 h-14 rounded-full retro-btn-yellow flex flex-col items-center justify-center active:scale-95 shadow-md"
                >
                  <Zap className="w-5 h-5 text-amber-950" />
                  <span className="text-[8px] font-pixel text-amber-950">JUMP</span>
                </button>

                {/* DASH / ACTION / B */}
                <button
                  onMouseDown={handleDashPress}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleDashPress();
                  }}
                  className="w-14 h-14 rounded-full retro-btn-red flex flex-col items-center justify-center active:scale-95 shadow-lg border-2 border-rose-300"
                >
                  <Wind className="w-5 h-5 text-white" />
                  <span className="text-[8px] font-pixel text-white">
                    {isFarmMode ? 'ACTION' : 'DASH'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER STATUS */}
      <div className="text-[9px] font-vt text-slate-500">
        P2P LIVE STREAM • VOXEL MONSTER RETRO ENGINE
      </div>
    </div>
  );
};
