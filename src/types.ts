export type AppMode = 'menu' | 'host' | 'cast';

export type GameMode = 'explorer' | 'farm';

export type PlayerSlot = 'P1' | 'P2';

export type MonsterType =
  | 'blaze_dino'
  | 'frost_wolf'
  | 'volt_dragon'
  | 'terra_golem'
  | 'shadow_beast'
  | 'cyber_mecha'
  | 'solar_phoenix'
  | 'crystal_drake'
  | 'mystic_spirit'
  | 'aqua_leviathan'
  | 'apex_titan'
  | 'emerald_serpent'
  | 'crimson_wyvern'
  | 'plasma_fiend'
  | 'obsidian_chimera'
  | 'cosmic_hydra'
  | 'magma_rhino'
  | 'arctic_yeti'
  | 'storm_falcon'
  | 'flora_ent'
  | 'radiant_angel'
  | 'abyssal_kraken'
  | 'toxic_sludge'
  | 'golden_king'
  | 'nebula_ghost'
  | 'sand_sphinx'
  | 'iron_behemoth'
  | 'blossom_fox'
  | 'glacier_bear'
  | 'hyper_spark'
  | 'dusk_vampire'
  | 'celestial_stargazer';

export type StageTheme =
  | 'cyber_grid'
  | 'volcanic_pit'
  | 'neon_dojo'
  | 'crystal_cave'
  | 'verdant_forest';

export interface PlayerInputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  dash: boolean;
  interact?: boolean;
}

export interface SinglePlayerState {
  x: number;
  y: number;
  z: number;
  facing: 'left' | 'right' | 'up' | 'down';
  score: number;
  gold: number;
  gemsCollected: number;
  isDashing: boolean;
  monsterType: MonsterType;
  actionText: string;
  holdingSeed?: CropType | null;
  holdingFruit?: CropType | null;
}

export type CropType = 'carrot' | 'pumpkin' | 'berry' | 'melon';

export interface FarmCropTile {
  id: string;
  x: number;
  z: number;
  cropType: CropType;
  stage: 0 | 1 | 2; // 0 = sprout, 1 = growing, 2 = mature fruit
  growthProgress: number; // 0 to 100
  harvestable: boolean;
  owner: 'P1' | 'P2';
}

export interface CollectibleItem {
  id: string;
  x: number;
  y: number;
  z: number;
  type: 'gem' | 'star' | 'relic' | 'chest';
  points: number;
  active: boolean;
  color: string;
}

export interface NetworkMessage<T = unknown> {
  type: string;
  payload: T;
  playerSlot?: PlayerSlot;
}

export interface GameStatePayload {
  gameMode: GameMode;
  p1: SinglePlayerState;
  p2: SinglePlayerState;
  teamScore: number;
  teamGold: number;
  stageTheme: StageTheme;
  biomeName: string;
  distanceExplored: number;
  collectibles: CollectibleItem[];
  crops: FarmCropTile[];
  announcement: string;
  p1NearbyContext?: string;
  p2NearbyContext?: string;
}



