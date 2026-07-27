import React, { useState, useEffect, useRef } from 'react';
import {
  createClient,
  connectToHost,
  registerNetworkCallbacks,
  sendData,
  disconnectMultiplayer,
} from '../lib/multiplayer';
import { NetworkMessage, GameStatePayload } from '../types';
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
  ExternalLink,
} from 'lucide-react';

interface CastViewProps {
  onBackToMenu: () => void;
}

export const CastView: React.FC<CastViewProps> = ({ onBackToMenu }) => {
  const [inputCode, setInputCode] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('Ready to connect.');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Synced state from Host
  const [syncedState, setSyncedState] = useState<GameStatePayload>({
    hp: 100,
    maxHp: 100,
    score: 0,
    actionText: 'READY',
    facing: 'right',
    x: 0,
    y: 0,
    isAttacking: false,
    monsterType: 'voxel_agumon',
    lastAction: 'CONNECTED',
  });

  // Track pressed state for touch/mouse
  const [isLeftPressed, setIsLeftPressed] = useState<boolean>(false);
  const [isRightPressed, setIsRightPressed] = useState<boolean>(false);

  const isConnectedRef = useRef<boolean>(false);
  isConnectedRef.current = isConnected;

  useEffect(() => {
    createClient();

    registerNetworkCallbacks({
      onStatus: (status) => setConnectionStatus(status),
      onEstablished: () => {
        setIsConnected(true);
        setConnectionStatus('CONNECTED TO HOST!');
        sound.playConnectFanfare();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      },
      onClosed: () => {
        setIsConnected(false);
        setConnectionStatus('Connection to host lost.');
      },
      onError: (err) => {
        console.error('Cast connection error:', err);
        setConnectionStatus('Connection failed. Check code & retry.');
      },
      onMessage: (msg: NetworkMessage) => {
        if (msg.type === 'game_state') {
          const payload = msg.payload as GameStatePayload;
          setSyncedState(payload);
        }
      },
    });

    // Keyboard support for Cast player
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isConnectedRef.current) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleLeftPress();
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleRightPress();
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        handleJumpPress();
      }
      if (e.key === 'f' || e.key === 'F' || e.key === 'j' || e.key === 'J' || e.key === 'Enter') {
        handleAttackPress();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isConnectedRef.current) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleLeftRelease();
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleRightRelease();
      }
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
    if (inputCode.trim().length === 4) {
      connectToHost(inputCode.trim());
    } else {
      setConnectionStatus('Please enter a 4-digit code.');
    }
  };

  // Controller Actions
  const handleLeftPress = () => {
    setIsLeftPressed(true);
    sound.playBeep(280, 0.05);
    sendData('player_action', { action: 'left_press' });
  };

  const handleLeftRelease = () => {
    setIsLeftPressed(false);
    sendData('player_action', { action: 'left_release' });
  };

  const handleRightPress = () => {
    setIsRightPressed(true);
    sound.playBeep(320, 0.05);
    sendData('player_action', { action: 'right_press' });
  };

  const handleRightRelease = () => {
    setIsRightPressed(false);
    sendData('player_action', { action: 'right_release' });
  };

  const handleJumpPress = () => {
    sound.playJump();
    sendData('player_action', { action: 'jump' });
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleAttackPress = () => {
    sound.playAttack();
    sendData('player_action', { action: 'attack' });
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(60);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
  };

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
          <div className="text-[10px] text-cyan-400 font-pixel">CAST CONTROLLER</div>
          <div className="text-xs font-vt text-slate-400">DIGIMON V-PET REMOTE</div>
        </div>

        <button onClick={toggleSound} className="retro-btn p-1.5 text-amber-300">
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>
      </div>

      {/* CONNECT SCREEN (IF NOT CONNECTED) */}
      {!isConnected ? (
        <div className="w-full max-w-md my-auto retro-box p-6 bg-slate-900 text-center flex flex-col items-center gap-5">
          <div className="p-3 bg-amber-500/10 rounded-full border-2 border-amber-500/40 text-amber-400">
            <Radio className="w-10 h-10 animate-pulse" />
          </div>

          <div>
            <h2 className="text-sm font-pixel text-amber-400 mb-1">ENTER HOST CODE</h2>
            <p className="text-xs font-vt text-slate-400">
              Enter the 4-digit code displayed on the Host screen
            </p>
          </div>

          <form onSubmit={handleConnectSubmit} className="w-full flex flex-col items-center gap-4">
            <input
              type="text"
              maxLength={4}
              pattern="[0-9]*"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              className="w-48 text-center text-3xl tracking-[0.5em] font-pixel bg-slate-950 border-4 border-amber-500/80 text-amber-300 py-3 rounded focus:outline-none focus:border-amber-400 shadow-inner"
              autoFocus
            />

            <button
              type="submit"
              disabled={inputCode.length !== 4}
              className={`w-full py-3.5 px-4 font-pixel text-xs retro-btn-yellow transition-all ${
                inputCode.length === 4 ? 'opacity-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              CONNECT TO HOST
            </button>
          </form>

          <div className="text-xs font-vt text-amber-300 bg-slate-950/80 p-2 rounded border border-slate-800 w-full">
            STATUS: {connectionStatus}
          </div>

          <a
            href="https://sites.google.com/view/ps5mobile/home"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 font-pixel text-xs retro-btn bg-cyan-950 border-cyan-400 text-cyan-300 flex items-center justify-center gap-2 hover:bg-cyan-900 transition-transform active:scale-95 shadow-md mt-1"
          >
            <ExternalLink className="w-4 h-4 text-cyan-400" /> PS5 MOBILE
          </a>
        </div>
      ) : (
        /* CONNECTED CONTROLLER INTERFACE */
        <div className="w-full flex-1 flex flex-col items-center justify-between gap-4 py-2">
          {/* HOST SYNC DISPLAY HUD */}
          <div className="w-full retro-box p-3 bg-slate-900 border-2 border-cyan-500/50 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-pixel text-cyan-300">
              <span className="flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> LINKED TO HOST
              </span>
              <span className="text-amber-400">SCORE: {syncedState.score}</span>
            </div>

            {/* ACTION LOG FEEDBACK */}
            <div className="bg-slate-950 p-2.5 rounded border border-cyan-900 text-center">
              <div className="text-[9px] text-slate-500 font-pixel mb-0.5">CHARACTER FEEDBACK</div>
              <div className="text-sm font-pixel text-amber-300 tracking-wide animate-bounce">
                {syncedState.actionText || 'READY'}
              </div>
            </div>
          </div>

          {/* RETRO SEGA / DIGIMON DIGITAL GAMEPAD OVERLAY */}
          <div className="w-full retro-box p-5 bg-slate-900/90 border-4 border-amber-500/60 rounded-2xl flex flex-col items-center gap-6 my-auto shadow-2xl">
            <div className="text-[10px] font-pixel text-amber-400 tracking-widest flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" /> TOUCH CONTROLLER
            </div>

            <div className="w-full flex items-center justify-between gap-4 px-2">
              {/* D-PAD DIRECTIONAL ARROWS (LEFT & RIGHT) */}
              <div className="flex items-center gap-3">
                {/* LEFT ARROW */}
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
                  className={`w-20 h-20 rounded-xl retro-btn flex flex-col items-center justify-center ${
                    isLeftPressed ? 'bg-amber-600 border-amber-300 scale-95' : 'bg-slate-800'
                  }`}
                >
                  <ArrowLeft className="w-10 h-10 text-slate-100" />
                  <span className="text-[8px] font-pixel text-slate-300 mt-1">LEFT</span>
                </button>

                {/* RIGHT ARROW */}
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
                  className={`w-20 h-20 rounded-xl retro-btn flex flex-col items-center justify-center ${
                    isRightPressed ? 'bg-amber-600 border-amber-300 scale-95' : 'bg-slate-800'
                  }`}
                >
                  <ArrowRight className="w-10 h-10 text-slate-100" />
                  <span className="text-[8px] font-pixel text-slate-300 mt-1">RIGHT</span>
                </button>
              </div>

              {/* ACTION BUTTONS (JUMP & ATTACK) */}
              <div className="flex items-center gap-3">
                {/* JUMP BUTTON */}
                <button
                  onMouseDown={handleJumpPress}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleJumpPress();
                  }}
                  className="w-20 h-20 rounded-full retro-btn-yellow flex flex-col items-center justify-center active:scale-95 shadow-lg"
                >
                  <Zap className="w-8 h-8 text-amber-950" />
                  <span className="text-[9px] font-pixel text-amber-950 mt-0.5">JUMP</span>
                </button>

                {/* SPECIALIZED ACTION / ATTACK BUTTON */}
                <button
                  onMouseDown={handleAttackPress}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleAttackPress();
                  }}
                  className="w-22 h-22 rounded-full retro-btn-red flex flex-col items-center justify-center active:scale-95 shadow-2xl border-4 border-rose-300"
                >
                  <Flame className="w-9 h-9 text-white animate-pulse" />
                  <span className="text-[9px] font-pixel text-white mt-0.5">ATTACK</span>
                </button>
              </div>
            </div>

            {/* KEYBOARD SHORTCUT HELP */}
            <div className="text-[9px] font-vt text-slate-400 bg-slate-950/90 px-3 py-1.5 rounded-full border border-slate-800">
              KEYBOARD: [A / D] Move • [W / Space] Jump • [F / Enter] Attack
            </div>
          </div>
        </div>
      )}

      {/* FOOTER STATUS */}
      <div className="text-[10px] font-vt text-slate-500">
        P2P DATA CONNECTION • DIGIMON PS1 & MEGA DRIVE ENGINE
      </div>
    </div>
  );
};
