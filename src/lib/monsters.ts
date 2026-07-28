import { MonsterType } from '../types';

export interface MonsterVariant {
  id: MonsterType;
  name: string;
  emoji: string;
  primaryColor: number;
  bellyColor: number;
  eyeColor: number;
  hornColor: number;
}

export const MONSTER_VARIANTS: MonsterVariant[] = [
  { id: 'blaze_dino', name: 'Blaze Dino', emoji: '🔥', primaryColor: 0xef4444, bellyColor: 0xfef08a, eyeColor: 0x22c55e, hornColor: 0xd97706 },
  { id: 'frost_wolf', name: 'Frost Wolf', emoji: '❄️', primaryColor: 0x06b6d4, bellyColor: 0xe0f2fe, eyeColor: 0x3b82f6, hornColor: 0x0284c7 },
  { id: 'volt_dragon', name: 'Volt Dragon', emoji: '⚡', primaryColor: 0xeab308, bellyColor: 0xfef08a, eyeColor: 0xef4444, hornColor: 0xca8a04 },
  { id: 'terra_golem', name: 'Terra Golem', emoji: '🌿', primaryColor: 0x10b981, bellyColor: 0x064e3b, eyeColor: 0xf59e0b, hornColor: 0x334155 },
  { id: 'shadow_beast', name: 'Shadow Beast', emoji: '🟣', primaryColor: 0x8b5cf6, bellyColor: 0x3b0764, eyeColor: 0xef4444, hornColor: 0x4c1d95 },
  { id: 'cyber_mecha', name: 'Cyber Mecha', emoji: '🤖', primaryColor: 0x38bdf8, bellyColor: 0x0f172a, eyeColor: 0xf43f5e, hornColor: 0x0284c7 },
  { id: 'solar_phoenix', name: 'Solar Phoenix', emoji: '☀️', primaryColor: 0xf97316, bellyColor: 0xfef08a, eyeColor: 0x06b6d4, hornColor: 0xb45309 },
  { id: 'crystal_drake', name: 'Crystal Drake', emoji: '💎', primaryColor: 0x2dd4bf, bellyColor: 0xccfbf1, eyeColor: 0xa855f7, hornColor: 0x0f766e },
  { id: 'mystic_spirit', name: 'Mystic Spirit', emoji: '✨', primaryColor: 0xec4899, bellyColor: 0xfce7f3, eyeColor: 0x38bdf8, hornColor: 0xbe185d },
  { id: 'aqua_leviathan', name: 'Aqua Leviathan', emoji: '🌊', primaryColor: 0x0284c7, bellyColor: 0xbae6fd, eyeColor: 0x22c55e, hornColor: 0x0369a1 },
  { id: 'apex_titan', name: 'Apex Titan', emoji: '🦾', primaryColor: 0xb91c1c, bellyColor: 0x450a0a, eyeColor: 0xfacc15, hornColor: 0x7f1d1d },
  { id: 'emerald_serpent', name: 'Emerald Serpent', emoji: '🐍', primaryColor: 0x22c55e, bellyColor: 0xdcfce7, eyeColor: 0xef4444, hornColor: 0x15803d },
  { id: 'crimson_wyvern', name: 'Crimson Wyvern', emoji: '🩸', primaryColor: 0xd97706, bellyColor: 0xffedd5, eyeColor: 0x3b82f6, hornColor: 0x92400e },
  { id: 'plasma_fiend', name: 'Plasma Fiend', emoji: '🎆', primaryColor: 0xa855f7, bellyColor: 0xf3e8ff, eyeColor: 0x22c55e, hornColor: 0x6b21a8 },
  { id: 'obsidian_chimera', name: 'Obsidian Chimera', emoji: '🖤', primaryColor: 0x1e293b, bellyColor: 0x0f172a, eyeColor: 0xf43f5e, hornColor: 0x64748b },
  { id: 'cosmic_hydra', name: 'Cosmic Hydra', emoji: '🌌', primaryColor: 0x6366f1, bellyColor: 0xe0e7ff, eyeColor: 0xfacc15, hornColor: 0x3730a3 },
  { id: 'magma_rhino', name: 'Magma Rhino', emoji: '🌋', primaryColor: 0xc2410c, bellyColor: 0xffedd5, eyeColor: 0x22c55e, hornColor: 0x7c2d12 },
  { id: 'arctic_yeti', name: 'Arctic Yeti', emoji: '🏔️', primaryColor: 0xe0f2fe, bellyColor: 0x38bdf8, eyeColor: 0x0284c7, hornColor: 0x7dd3fc },
  { id: 'storm_falcon', name: 'Storm Falcon', emoji: '🦅', primaryColor: 0xca8a04, bellyColor: 0xfef9c3, eyeColor: 0x06b6d4, hornColor: 0x854d0e },
  { id: 'flora_ent', name: 'Flora Ent', emoji: '🌲', primaryColor: 0x15803d, bellyColor: 0x86efac, eyeColor: 0xeab308, hornColor: 0x14532d },
  { id: 'radiant_angel', name: 'Radiant Angel', emoji: '😇', primaryColor: 0xfef08a, bellyColor: 0xffffff, eyeColor: 0x38bdf8, hornColor: 0xeab308 },
  { id: 'abyssal_kraken', name: 'Abyssal Kraken', emoji: '🦑', primaryColor: 0x0f172a, bellyColor: 0x1e1b4b, eyeColor: 0xa855f7, hornColor: 0x312e81 },
  { id: 'toxic_sludge', name: 'Toxic Sludge', emoji: '☣️', primaryColor: 0x84cc16, bellyColor: 0xecfccb, eyeColor: 0xec4899, hornColor: 0x4d7c0f },
  { id: 'golden_king', name: 'Golden King', emoji: '👑', primaryColor: 0xeab308, bellyColor: 0xfef9c3, eyeColor: 0xef4444, hornColor: 0xa16207 },
  { id: 'nebula_ghost', name: 'Nebula Ghost', emoji: '👻', primaryColor: 0xd8b4fe, bellyColor: 0xfae8ff, eyeColor: 0x06b6d4, hornColor: 0x9333ea },
  { id: 'sand_sphinx', name: 'Sand Sphinx', emoji: '🏜️', primaryColor: 0xd97706, bellyColor: 0xfef3c7, eyeColor: 0x10b981, hornColor: 0xb45309 },
  { id: 'iron_behemoth', name: 'Iron Behemoth', emoji: '🛡️', primaryColor: 0x475569, bellyColor: 0x0f172a, eyeColor: 0xef4444, hornColor: 0x1e293b },
  { id: 'blossom_fox', name: 'Blossom Fox', emoji: '🌸', primaryColor: 0xf472b6, bellyColor: 0xfce7f3, eyeColor: 0x10b981, hornColor: 0xdb2777 },
  { id: 'glacier_bear', name: 'Glacier Bear', emoji: '🐻', primaryColor: 0x38bdf8, bellyColor: 0xf0f9ff, eyeColor: 0x1d4ed8, hornColor: 0x0284c7 },
  { id: 'hyper_spark', name: 'Hyper Spark', emoji: '⚡', primaryColor: 0xa3e635, bellyColor: 0xf7fee7, eyeColor: 0xef4444, hornColor: 0x65a30d },
  { id: 'dusk_vampire', name: 'Dusk Vampire', emoji: '🦇', primaryColor: 0x881337, bellyColor: 0x4c0519, eyeColor: 0xfacc15, hornColor: 0xbe123c },
  { id: 'celestial_stargazer', name: 'Celestial Stargazer', emoji: '🔭', primaryColor: 0x1e1b4b, bellyColor: 0x312e81, eyeColor: 0x38bdf8, hornColor: 0x6366f1 },
];

export function getMonsterVariant(id: MonsterType): MonsterVariant {
  const found = MONSTER_VARIANTS.find((m) => m.id === id);
  return found || MONSTER_VARIANTS[0];
}
