import React, { useState } from 'react';
import { AppMode } from './types';
import { HostView } from './components/HostView';
import { CastView } from './components/CastView';
import { sound } from './lib/sound';
import { Tv, Gamepad2, Sparkles, Volume2, VolumeX, ShieldAlert } from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState<AppMode>('menu');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const handleSelectHost = () => {
    sound.playBeep(440, 0.08);
    setMode('host');
  };

  const handleSelectCast = () => {
    sound.playBeep(520, 0.08);
    setMode('cast');
  };

  const handleBackToMenu = () => {
    sound.playBeep(300, 0.08);
    setMode('menu');
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
  };

  if (mode === 'host') {
    return <HostView onBackToMenu={handleBackToMenu} />;
  }

  if (mode === 'cast') {
    return <CastView onBackToMenu={handleBackToMenu} />;
  }

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 md:p-8 select-none overflow-hidden">
      {/* CRT SCANLINE BACKDROP */}
      <div className="crt-overlay fixed inset-0 pointer-events-none z-10" />

      {/* HEADER BAR */}
      <div className="w-full max-w-xl flex items-center justify-between z-20">
        <div className="flex items-center gap-2 text-amber-400">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-pixel tracking-wider">RETRO ENGINE</span>
        </div>

        <button
          onClick={toggleSound}
          className="retro-btn p-2 text-amber-300 hover:text-amber-200"
          title="Toggle Audio"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
        </button>
      </div>

      {/* MAIN RETRO TITLE CARD & MENU OPTIONS */}
      <div className="w-full max-w-xl my-auto flex flex-col items-center gap-6 z-20 text-center">
        {/* GAME LOGO */}
        <div className="retro-box p-6 bg-slate-900/90 border-4 border-amber-500 rounded-xl shadow-2xl glow-gold w-full">
          <h1 className="text-2xl md:text-3xl font-pixel text-amber-400 drop-shadow-[0_4px_0_#78350f] mb-3 leading-snug">
            VOXEL MONSTERS 3D CO-OP
          </h1>
          <div className="text-xs font-vt text-slate-300 bg-slate-950/80 py-1 px-3 rounded border border-amber-500/30 inline-block">
            3D Z-AXIS MOVEMENT • CO-OP EXPLORER • DYNAMIC BIOMES
          </div>
        </div>

        {/* SELECT MODE: HOST OR CAST ONLY */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-5">
          {/* HOST BUTTON */}
          <button
            onClick={handleSelectHost}
            className="w-full sm:w-1/2 p-6 retro-btn-yellow flex flex-col items-center gap-3 group cursor-pointer transition-transform hover:scale-105 active:scale-95"
          >
            <div className="p-3 bg-amber-950/40 rounded-full border-2 border-amber-900 group-hover:scale-110 transition-transform">
              <Tv className="w-10 h-10 text-amber-950" />
            </div>
            <div>
              <div className="text-sm font-pixel text-amber-950 mb-1">HOST</div>
              <div className="text-[10px] font-vt text-amber-900">
                DISPLAY 3D ARENA & CO-OP TEAM SCORES
              </div>
            </div>
          </button>

          {/* CAST BUTTON */}
          <button
            onClick={handleSelectCast}
            className="w-full sm:w-1/2 p-6 retro-btn flex flex-col items-center gap-3 group cursor-pointer transition-transform hover:scale-105 active:scale-95"
          >
            <div className="p-3 bg-indigo-950/40 rounded-full border-2 border-indigo-900 group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-10 h-10 text-indigo-300" />
            </div>
            <div>
              <div className="text-sm font-pixel text-cyan-300 mb-1">CAST</div>
              <div className="text-[10px] font-vt text-slate-300">
                INPUT PIN & 3D TOUCH CONTROLLER
              </div>
            </div>
          </button>
        </div>

        {/* INSTRUCTION CARD */}
        <div className="retro-box p-4 bg-slate-900/80 text-left w-full text-xs font-vt text-slate-300 flex flex-col gap-2 border-l-4 border-l-emerald-500">
          <div className="font-pixel text-[10px] text-emerald-400 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-emerald-400" /> HOW TO PLAY 3D CO-OP EXPLORER:
          </div>
          <ol className="list-decimal list-inside space-none flex flex-col gap-1 text-slate-300 leading-relaxed">
            <li>Open this app on a main screen/tab and select <b className="text-amber-400">HOST</b>. Note P1 and P2 PINs.</li>
            <li>Player 1 and Player 2 connect via <b className="text-cyan-300">CAST</b> on mobile devices/tabs using their PINs.</li>
            <li>Walk freely along <b>X and Z axes</b> (Up/Down/Left/Right) in 3D space to collect gems, stars, & chests!</li>
            <li>Team up near Golden Chests for a <b>Double Co-Op Team Bonus</b>! Dynamic biomes shift as you explore!</li>
          </ol>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-[10px] font-vt text-slate-500 z-20">
        VOXEL MONSTER RETRO ENGINE • ALL RIGHTS RESERVED
      </div>
    </div>
  );
}
