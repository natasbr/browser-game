export type AppMode = 'menu' | 'host' | 'cast';

export type PlayerSlot = 'P1' | 'P2';

export type MonsterType =
  | 'blaze_dino'
  | 'frost_wolf'
  | 'volt_dragon'
  | 'terra_golem'
  | 'shadow_beast';

export type StageTheme = 'cyber_grid' | 'volcanic_pit' | 'neon_dojo' | 'crystal_cave';

export interface PlayerInputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  attack: boolean;
  special: boolean;
}

export interface SinglePlayerState {
  x: number;
  y: number;
  facing: 'left' | 'right';
  hp: number;
  maxHp: number;
  energy: number; // 0 to 100 for Special
  score: number;
  wins: number;
  isAttacking: boolean;
  isSpecialAttacking: boolean;
  isHit: boolean;
  monsterType: MonsterType;
  actionText: string;
}

export interface NetworkMessage<T = unknown> {
  type: string;
  payload: T;
  playerSlot?: PlayerSlot;
}

export interface GameStatePayload {
  p1: SinglePlayerState;
  p2: SinglePlayerState;
  stageTheme: StageTheme;
  timer: number;
  winner: PlayerSlot | 'DRAW' | null;
  round: number;
  announcement: string;
  item?: {
    x: number;
    y: number;
    type: 'health' | 'energy';
    active: boolean;
  } | null;
}

