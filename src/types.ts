export type AppMode = 'menu' | 'host' | 'cast';

export type PlayerSlot = 'P1' | 'P2';

export type MonsterType =
  | 'blaze_dino'
  | 'frost_wolf'
  | 'volt_dragon'
  | 'terra_golem'
  | 'shadow_beast';

export type StageTheme = 'cyber_grid' | 'volcanic_pit' | 'neon_dojo' | 'crystal_cave' | 'verdant_forest';

export interface PlayerInputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  dash: boolean;
}

export interface SinglePlayerState {
  x: number;
  y: number;
  z: number;
  facing: 'left' | 'right' | 'up' | 'down';
  score: number;
  gemsCollected: number;
  isDashing: boolean;
  monsterType: MonsterType;
  actionText: string;
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
  p1: SinglePlayerState;
  p2: SinglePlayerState;
  teamScore: number;
  stageTheme: StageTheme;
  biomeName: string;
  distanceExplored: number;
  collectibles: CollectibleItem[];
  announcement: string;
}


