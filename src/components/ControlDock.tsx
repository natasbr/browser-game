/**
 * Ergonomic Collapsible Bottom Control Dock.
 * Adheres strictly to Three.js UI constitution:
 * - Pinned to bottom center (<= 15% viewport footprint)
 * - Solid rgba surfaces (no backdrop-filter over WebGL canvas)
 * - Zero emojis
 * - Clean static status badges (no pulsating dots)
 * - Collapse / Expand toggle button
 */

import React, { useState } from 'react';
import {
  Play,
  Pause,
  Eye,
  Camera,
  Layers,
  Sparkles,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sliders,
  Crosshair,
  Shield,
  Zap,
} from 'lucide-react';
import { SimulationStats } from '../types/simulation';

export type SpawnBrushType = 'micro' | 'herbivore' | 'carnivore' | 'apex' | 'food' | 'detritus';

interface ControlDockProps {
  stats: SimulationStats;
  isPaused: boolean;
  timeScale: number;
  isMuted: boolean;
  tiltShiftEnabled: boolean;
  tiltShiftBlur: number;
  activeBrush: SpawnBrushType;
  cameraPreset: 'perspective' | 'top_down' | 'macro';
  followCamera: boolean;
  onTogglePause: () => void;
  onChangeSpeed: (speed: number) => void;
  onToggleMute: () => void;
  onToggleTiltShift: () => void;
  onChangeTiltShiftBlur: (val: number) => void;
  onSelectBrush: (brush: SpawnBrushType) => void;
  onChangeCameraPreset: (preset: 'perspective' | 'top_down' | 'macro') => void;
  onToggleFollowCamera: () => void;
  onResetSimulation: () => void;
  onSpawnDirect: (type: SpawnBrushType) => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  stats,
  isPaused,
  timeScale,
  isMuted,
  tiltShiftEnabled,
  tiltShiftBlur,
  activeBrush,
  cameraPreset,
  followCamera,
  onTogglePause,
  onChangeSpeed,
  onToggleMute,
  onToggleTiltShift,
  onChangeTiltShiftBlur,
  onSelectBrush,
  onChangeCameraPreset,
  onToggleFollowCamera,
  onResetSimulation,
  onSpawnDirect,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'spawn' | 'optics' | 'simulation' | 'stats'>('spawn');

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-40 transition-transform duration-300 pointer-events-auto ${
        isCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
      }`}
      style={{
        bottom: '16px',
        width: 'min(920px, 94vw)',
      }}
    >
      {/* Collapse / Expand Toggle Button */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#0f172a] hover:bg-[#1e293b] text-slate-300 text-xs font-mono font-medium rounded-t-lg border-t border-x border-slate-700/60 shadow-lg transition-colors cursor-pointer"
        >
          {isCollapsed ? (
            <>
              <ChevronUp size={14} />
              <span>SHOW DOCK</span>
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              <span>MINIMIZE</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container */}
      <div className="bg-[#0b1322] border border-slate-800 rounded-xl shadow-2xl p-3 text-slate-200">
        {/* Navigation Tabs & Quick Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2.5">
          {/* Tab buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('spawn')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                activeTab === 'spawn'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles size={13} />
              <span>SPAWN & BRUSH</span>
            </button>

            <button
              onClick={() => setActiveTab('optics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                activeTab === 'optics'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Camera size={13} />
              <span>OPTICS & CAM</span>
            </button>

            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                activeTab === 'simulation'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sliders size={13} />
              <span>SIMULATION</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers size={13} />
              <span>ECOSYSTEM ({stats.creatureCount})</span>
            </button>
          </div>

          {/* Quick Play/Pause & Speed Multiplier */}
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePause}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
                isPaused
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {isPaused ? <Play size={12} /> : <Pause size={12} />}
              <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
            </button>

            <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-xs font-mono">
              {[0.5, 1.0, 2.0, 4.0].map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeSpeed(s)}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    timeScale === s
                      ? 'bg-sky-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <button
              onClick={onToggleMute}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors cursor-pointer"
              title="Toggle Audio"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
        </div>

        {/* Tab 1: Spawn & Brush */}
        {activeTab === 'spawn' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>ACTIVE BRUSH: Tap or click anywhere on water to seed specimens</span>
              <span className="text-sky-400">DOUBLE CLICK ANY BUTTON TO QUICK-SPAWN</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <button
                onClick={() => onSelectBrush('micro')}
                onDoubleClick={() => onSpawnDirect('micro')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                  activeBrush === 'micro'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="font-bold">MICRO BLOB</span>
                <span className="text-[10px] text-slate-400">Size 0.6 | Fast</span>
              </button>

              <button
                onClick={() => onSelectBrush('herbivore')}
                onDoubleClick={() => onSpawnDirect('herbivore')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                  activeBrush === 'herbivore'
                    ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="font-bold">HERBIVORE</span>
                <span className="text-[10px] text-slate-400">Size 1.2 | Forager</span>
              </button>

              <button
                onClick={() => onSelectBrush('carnivore')}
                onDoubleClick={() => onSpawnDirect('carnivore')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                  activeBrush === 'carnivore'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="font-bold">HUNTER</span>
                <span className="text-[10px] text-slate-400">Size 2.2 | Carnivore</span>
              </button>

              <button
                onClick={() => onSelectBrush('apex')}
                onDoubleClick={() => onSpawnDirect('apex')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                  activeBrush === 'apex'
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="font-bold text-purple-400">APEX TITAN</span>
                <span className="text-[10px] text-slate-400">Size 4.8 | Colossus</span>
              </button>

              <button
                onClick={() => onSelectBrush('food')}
                onDoubleClick={() => onSpawnDirect('food')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                  activeBrush === 'food'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="font-bold">FOOD BURST</span>
                <span className="text-[10px] text-slate-400">+5 Pellets</span>
              </button>

              <button
                onClick={() => onSelectBrush('detritus')}
                onDoubleClick={() => onSpawnDirect('detritus')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                  activeBrush === 'detritus'
                    ? 'bg-slate-500/20 border-slate-400/50 text-slate-200'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="font-bold">DETRITUS</span>
                <span className="text-[10px] text-slate-400">Squishy Obstacle</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Optics & Camera */}
        {activeTab === 'optics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            {/* Tilt-shift settings */}
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sky-400 flex items-center gap-1">
                  <Eye size={13} />
                  <span>TILT-SHIFT MACRO OPTICS</span>
                </span>
                <button
                  onClick={onToggleTiltShift}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                    tiltShiftEnabled
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tiltShiftEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px] whitespace-nowrap">DEFOCUS DEPTH:</span>
                <input
                  type="range"
                  min="0.5"
                  max="6.0"
                  step="0.1"
                  value={tiltShiftBlur}
                  disabled={!tiltShiftEnabled}
                  onChange={(e) => onChangeTiltShiftBlur(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer disabled:opacity-40"
                />
                <span className="text-slate-300 w-8 text-right">{tiltShiftBlur.toFixed(1)}</span>
              </div>
            </div>

            {/* Camera presets */}
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sky-400 flex items-center gap-1">
                  <Camera size={13} />
                  <span>VIEWPORT PRESET</span>
                </span>
                <button
                  onClick={onToggleFollowCamera}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                    followCamera
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {followCamera ? 'FOLLOWING TARGET' : 'FREE CAM'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => onChangeCameraPreset('perspective')}
                  className={`py-1 rounded text-center cursor-pointer transition-colors ${
                    cameraPreset === 'perspective'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  ORBIT 3D
                </button>
                <button
                  onClick={() => onChangeCameraPreset('top_down')}
                  className={`py-1 rounded text-center cursor-pointer transition-colors ${
                    cameraPreset === 'top_down'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  TOP-DOWN
                </button>
                <button
                  onClick={() => onChangeCameraPreset('macro')}
                  className={`py-1 rounded text-center cursor-pointer transition-colors ${
                    cameraPreset === 'macro'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  MACRO LENS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Simulation Environment Tools */}
        {activeTab === 'simulation' && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">ARENA CONTROLS:</span>
              <button
                onClick={onResetSimulation}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-300 rounded border border-slate-700 cursor-pointer transition-colors"
              >
                <RotateCcw size={12} />
                <span>MASS EXTINCTION & BLOOM</span>
              </button>
            </div>

            <div className="text-slate-400 text-[11px]">
              Tip: Click on any living specimen to inspect 7-gene DNA, neural weights, and follow its life cycle.
            </div>
          </div>
        )}

        {/* Tab 4: Ecosystem Stats */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">ORGANISMS</div>
              <div className="text-sm font-bold text-sky-400">{stats.creatureCount}</div>
              <div className="text-[10px] text-slate-500">
                {stats.herbivoreCount} Herb | {stats.carnivoreCount} Carn | {stats.apexCount} Apex
              </div>
            </div>

            <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">NUTRIENT PELLETS</div>
              <div className="text-sm font-bold text-emerald-400">{stats.foodCount}</div>
              <div className="text-[10px] text-slate-500">Floating Algae & Chyme</div>
            </div>

            <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">DETRITUS CHUNKS</div>
              <div className="text-sm font-bold text-amber-400">{stats.detritusCount}</div>
              <div className="text-[10px] text-slate-500">Deformable obstacles</div>
            </div>

            <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">HIGHEST GENERATION</div>
              <div className="text-sm font-bold text-purple-400">GEN #{stats.generationMax}</div>
              <div className="text-[10px] text-slate-500">Age: {Math.floor(stats.simTime)}s</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
