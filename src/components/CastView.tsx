import React, { useState, useEffect, useRef } from 'react';
import {
  connectClientToHost,
  registerClientCallbacks,
  sendClientMessage,
  disconnectMultiplayer,
} from '../lib/multiplayer';
import { NetworkMessage, GameStatePayload, PlayerSlot } from '../types';
import { sound } from '../lib/sound';
import {
  ArrowLeft,
  ArrowRight,
  Flame,
  Zap,
  Wifi,
  Volume2,
  VolumeX,
  Radio,
  Gamepad2,
  ChevronLeft,
  Sparkles,
  Shield,
  Swords,
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
  const [isLeftPressed, setIsLeftPressed] = useState<boolean>(false);
  const [isRightPressed, setIsRightPressed] = useState<boolean>(false);

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
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') handleLeftPress();
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') handleRightPress();
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') handleJumpPress();
      if (e.key === 'f' || e.key === 'F' || e.key === 'j' || e.key === 'J' || e.key === 'Enter') handleAttackPress();
      if (e.key === 'g' || e.key === 'G' || e.key === 'k' || e.key === 'K') handleSpecialPress();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isConnectedRef.current) return;
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

  // Controller Handlers
  const handleLeftPress = () => {
    setIsLeftPressed(true);
    sound.playBeep(280, 0.05);
    sendClientMessage('player_action', { action: 'left_press' });
  };

  const handleLeftRelease = () => {
    setIsLeftPressed(false);
    sendClientMessage('player_action', { action: 'left_release' });
  };

  const handleRightPress = () => {
    setIsRightPressed(true);
    sound.playBeep(320, 0.05);
    sendClientMessage('player_action', { action: 'right_press' });
  };

  const handleRightRelease = () => {
    setIsRightPressed(false);
    sendClientMessage('player_action', { action: 'right_release' });
  };

  const handleJumpPress = () => {
    sound.playJump();
    sendClientMessage('player_action', { action: 'jump' });
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleAttackPress = () => {
    sound.playAttack();
    sendClientMessage('player_action', { action: 'attack' });
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(60);
    }
  };

  const handleSpecialPress = () => {
    sound.playAttack();
    sendClientMessage('player_action', { action: 'special' });
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 40, 120]);
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

  const isP2 = assignedSlot === 'P2';

  return (
    <div className="flex flex-col items-center justify-between w-full h-screen p-3 md:p-6 bg-slate-950 text-slate-100 max-w-2xl mx-auto select-none">
      {/* HEADER */}
      <div className="w-full retro-box p-3 flex items-center justify-between bg-slate-900">
        <button
          onClick={onBackToMenu}
          className="retro-btn px-3 py-1.5 text-xs flex items-center gap-1 text-slate-200"
        >
          <ChevronLeft className="w-4 h-4" /> MENU
        </button>

        <div className="text-center">
          <div className={`text-[10px] font-pixel ${isP2 ? 'text-cyan-400' : 'text-amber-400'}`}>
            {assignedSlot ? `${assignedSlot} CONTROLLER` : 'CAST REMOTE'}
          </div>
          <div className="text-xs font-vt text-slate-400">VOXEL MONSTER CONTROLLER</div>
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
            <h2 className="text-sm font-pixel text-amber-400 mb-1">ENTER P1 OR P2 PIN</h2>
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
              CONNECT TO ARENA
            </button>
          </form>

          <div className="text-xs font-vt text-amber-300 bg-slate-950/80 p-2 rounded border border-slate-800 w-full">
            STATUS: {connectionStatus}
          </div>
        </div>
      ) : (
        /* CONNECTED CONTROLLER SCREEN */
        <div className="w-full flex-1 flex flex-col items-center justify-between gap-3 py-1">
          {/* PLAYER HUD SYNC FROM HOST */}
          <div
            className={`w-full retro-box p-3 bg-slate-900 border-2 ${
              isP2 ? 'border-cyan-500/80' : 'border-amber-500/80'
            } flex flex-col gap-2`}
          >
            <div className="flex items-center justify-between text-[10px] font-pixel">
              <span className={`flex items-center gap-1 ${isP2 ? 'text-cyan-400' : 'text-amber-400'}`}>
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                SLOT: {assignedSlot} ({myState ? myState.monsterType.toUpperCase().replace('_', ' ') : 'MONSTER'})
              </span>
              <span className="text-emerald-400">WINS: {myState?.wins ?? 0}</span>
            </div>

            {/* HP AND ENERGY GAUGES */}
            {myState && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] font-pixel text-slate-300">
                  <span>HP: {myState.hp} / 100</span>
                  <span>ENERGY: {myState.energy}%</span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${isP2 ? 'bg-cyan-400' : 'bg-amber-400'} transition-all duration-150`}
                    style={{ width: `${myState.hp}%` }}
                  />
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded border border-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-yellow-300"
                    style={{ width: `${myState.energy}%` }}
                  />
                </div>
              </div>
            )}

            {/* ACTION LOG FEEDBACK */}
            <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
              <div className="text-[9px] text-slate-500 font-pixel mb-0.5">STATUS FEEDBACK</div>
              <div className="text-xs font-pixel text-amber-300 tracking-wide animate-pulse">
                {myState?.actionText || syncedState?.announcement || 'READY FOR BATTLE'}
              </div>
            </div>
          </div>

          {/* TOUCH GAMEPAD */}
          <div
            className={`w-full retro-box p-4 bg-slate-900/90 border-4 ${
              isP2 ? 'border-cyan-500/60' : 'border-amber-500/60'
            } rounded-2xl flex flex-col items-center gap-5 my-auto shadow-2xl`}
          >
            <div className="text-[10px] font-pixel text-slate-300 tracking-widest flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-amber-400" />
              TOUCH CONTROLLER ({assignedSlot})
            </div>

            <div className="w-full flex items-center justify-between gap-3 px-1">
              {/* D-PAD (LEFT & RIGHT) */}
              <div className="flex items-center gap-2">
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
                  className={`w-18 h-18 sm:w-20 sm:h-20 rounded-xl retro-btn flex flex-col items-center justify-center ${
                    isLeftPressed ? 'bg-amber-600 border-amber-300 scale-95' : 'bg-slate-800'
                  }`}
                >
                  <ArrowLeft className="w-8 h-8 text-slate-100" />
                  <span className="text-[8px] font-pixel text-slate-300 mt-0.5">LEFT</span>
                </button>

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
                  className={`w-18 h-18 sm:w-20 sm:h-20 rounded-xl retro-btn flex flex-col items-center justify-center ${
                    isRightPressed ? 'bg-amber-600 border-amber-300 scale-95' : 'bg-slate-800'
                  }`}
                >
                  <ArrowRight className="w-8 h-8 text-slate-100" />
                  <span className="text-[8px] font-pixel text-slate-300 mt-0.5">RIGHT</span>
                </button>
              </div>

              {/* ACTION BUTTONS (JUMP, ATTACK, SUPER) */}
              <div className="flex items-center gap-2">
                {/* JUMP */}
                <button
                  onMouseDown={handleJumpPress}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleJumpPress();
                  }}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full retro-btn-yellow flex flex-col items-center justify-center active:scale-95 shadow-md"
                >
                  <Zap className="w-6 h-6 text-amber-950" />
                  <span className="text-[8px] font-pixel text-amber-950">JUMP</span>
                </button>

                {/* BASIC ATTACK */}
                <button
                  onMouseDown={handleAttackPress}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleAttackPress();
                  }}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-full retro-btn-red flex flex-col items-center justify-center active:scale-95 shadow-lg border-2 border-rose-300"
                >
                  <Flame className="w-7 h-7 text-white" />
                  <span className="text-[8px] font-pixel text-white">ATTACK</span>
                </button>

                {/* SPECIAL SUPER BLAST */}
                <button
                  onMouseDown={handleSpecialPress}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleSpecialPress();
                  }}
                  disabled={Boolean(myState && myState.energy < 100)}
                  className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center active:scale-95 transition-all shadow-xl border-2 ${
                    myState && myState.energy >= 100
                      ? 'bg-purple-600 border-yellow-300 text-yellow-200 animate-bounce'
                      : 'bg-slate-800 border-slate-700 text-slate-600 opacity-60'
                  }`}
                >
                  <Sparkles className="w-7 h-7" />
                  <span className="text-[7px] font-pixel mt-0.5">SUPER</span>
                </button>
              </div>
            </div>

            <div className="text-[9px] font-vt text-slate-400 bg-slate-950/90 px-3 py-1 rounded-full border border-slate-800">
              KEYBOARD: [A / D] Move • [W] Jump • [F] Attack • [G] Super
            </div>
          </div>
        </div>
      )}

      {/* FOOTER STATUS */}
      <div className="text-[10px] font-vt text-slate-500">
        P2P DATA CONNECTION • VOXEL MONSTER RETRO ENGINE
      </div>
    </div>
  );
};
