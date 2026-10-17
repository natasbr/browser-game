/**
 * Creature Specimen Telemetry & Gene Lab Inspector.
 * Strictly zero emojis, clean monospace scientific aesthetic.
 */

import React from 'react';
import { X, Activity, Dna, Crosshair, PlusCircle, Trash2, Cpu } from 'lucide-react';
import { CreatureState } from '../types/simulation';

interface InspectorModalProps {
  creature: CreatureState | null;
  isFollowing: boolean;
  onClose: () => void;
  onToggleFollow: () => void;
  onFeedCreature: (id: string) => void;
  onCloneCreature: (id: string) => void;
  onKillCreature: (id: string) => void;
}

export const InspectorModal: React.FC<InspectorModalProps> = ({
  creature,
  isFollowing,
  onClose,
  onToggleFollow,
  onFeedCreature,
  onCloneCreature,
  onKillCreature,
}) => {
  if (!creature) return null;

  const { genes, neuralWeights } = creature;
  const dietBadgeColor =
    creature.diet === 'apex'
      ? 'bg-purple-900/60 text-purple-300 border-purple-500/50'
      : creature.diet === 'carnivore'
      ? 'bg-rose-900/60 text-rose-300 border-rose-500/50'
      : creature.diet === 'detritivore'
      ? 'bg-amber-900/60 text-amber-300 border-amber-500/50'
      : 'bg-emerald-900/60 text-emerald-300 border-emerald-500/50';

  const healthPercent = Math.max(0, Math.min(100, (creature.health / creature.maxHealth) * 100));
  const energyPercent = Math.max(0, Math.min(100, (creature.energy / creature.maxEnergy) * 100));

  return (
    <div className="fixed top-4 left-4 z-40 w-80 bg-[#09111e] border border-slate-700/80 rounded-xl shadow-2xl p-3 text-slate-200 font-mono text-xs select-none pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Activity size={14} className="text-sky-400 shrink-0" />
          <span className="font-bold text-sky-300 truncate">{creature.name}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Basic Metrics & Diet */}
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${dietBadgeColor}`}>
          {creature.diet}
        </span>
        <span className="text-[11px] text-slate-400">
          GEN #{creature.generation} | AGE: {Math.floor(creature.age)}s
        </span>
      </div>

      {/* Vital Bars */}
      <div className="space-y-1.5 mb-3 bg-slate-950/60 p-2 rounded border border-slate-800/80">
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
            <span>HEALTH</span>
            <span>{Math.round(creature.health)} / {Math.round(creature.maxHealth)}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-200"
              style={{ width: `${healthPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
            <span>METABOLIC ENERGY</span>
            <span>{Math.round(creature.energy)} / {Math.round(creature.maxEnergy)}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-200"
              style={{ width: `${energyPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
          <span>STATE:</span>
          <span className="text-sky-400 font-semibold uppercase">{creature.behavior}</span>
        </div>
      </div>

      {/* 7-Gene DNA Breakdown */}
      <div className="mb-3">
        <div className="flex items-center gap-1 text-[11px] font-bold text-sky-400 mb-1.5">
          <Dna size={12} />
          <span>7-GENE GENOME PROFILE</span>
        </div>

        <div className="space-y-1 bg-slate-950/60 p-2 rounded border border-slate-800/80 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">1. SIZE / MASS:</span>
            <span className="text-slate-200 font-bold">{genes.size.toFixed(2)}x</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">2. PROPULSION SPEED:</span>
            <span className="text-slate-200 font-bold">{genes.speed.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">3. PERCEPTION SENSOR:</span>
            <span className="text-slate-200 font-bold">{genes.perception.toFixed(0)}m</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">4. BIOLUMINESCENT HUE:</span>
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full border border-slate-600"
                style={{ backgroundColor: `hsl(${genes.hue}, 85%, 55%)` }}
              />
              <span className="text-slate-200 font-bold">{Math.round(genes.hue)} deg</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">5. DORSAL ARMOR:</span>
            <span className="text-slate-200 font-bold">{(genes.armor * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">6. DIGESTION RATE:</span>
            <span className="text-slate-200 font-bold">{genes.digestion.toFixed(2)}x</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">7. AGILITY / WIGGLE:</span>
            <span className="text-slate-200 font-bold">{genes.agility.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Rudimentary Neural Weights */}
      <div className="mb-3">
        <div className="flex items-center gap-1 text-[11px] font-bold text-sky-400 mb-1.5">
          <Cpu size={12} />
          <span>NEURAL NETWORK WEIGHTS</span>
        </div>
        <div className="grid grid-cols-2 gap-1 bg-slate-950/60 p-2 rounded border border-slate-800/80 text-[10px]">
          <div>
            <span className="text-slate-400">FOOD PULL:</span>{' '}
            <span className="text-emerald-400">{neuralWeights.foodAttraction.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-400">THREAT FLEE:</span>{' '}
            <span className="text-rose-400">{neuralWeights.predatorAvoidance.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-400">MATE SEEK:</span>{' '}
            <span className="text-purple-400">{neuralWeights.mateAttraction.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-400">CURIOSITY:</span>{' '}
            <span className="text-amber-400">{neuralWeights.curiosity.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Specimen Actions */}
      <div className="grid grid-cols-3 gap-1">
        <button
          onClick={onToggleFollow}
          className={`flex items-center justify-center gap-1 py-1.5 rounded border text-[10px] font-bold transition-colors cursor-pointer ${
            isFollowing
              ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
              : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <Crosshair size={11} />
          <span>{isFollowing ? 'UNFOLLOW' : 'FOLLOW'}</span>
        </button>

        <button
          onClick={() => onFeedCreature(creature.id)}
          className="flex items-center justify-center gap-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
        >
          <PlusCircle size={11} />
          <span>FEED</span>
        </button>

        <button
          onClick={() => onCloneCreature(creature.id)}
          className="flex items-center justify-center gap-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded border border-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
        >
          <Dna size={11} />
          <span>CLONE</span>
        </button>
      </div>
    </div>
  );
};
