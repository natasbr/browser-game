export type AppMode = 'menu' | 'host' | 'cast';

export type MonsterType = 'voxel_agumon' | 'voxel_gabumon' | 'voxel_veemon';

export interface PlayerInputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  attack: boolean;
}

export interface CharacterState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  isGrounded: boolean;
  isAttacking: boolean;
  attackTimer: number;
  hp: number;
  maxHp: number;
  score: number;
  actionText: string;
  monsterType: MonsterType;
}

export interface NetworkMessage<T = unknown> {
  type: string;
  payload: T;
}

export interface PlayerInputPayload {
  left: boolean;
  right: boolean;
  jump: boolean;
  attack: boolean;
}

export interface PlayerActionPayload {
  action: 'left_press' | 'left_release' | 'right_press' | 'right_release' | 'jump' | 'attack';
}

export interface GameStatePayload {
  hp: number;
  maxHp: number;
  score: number;
  actionText: string;
  facing: 'left' | 'right';
  x: number;
  y: number;
  isAttacking: boolean;
  monsterType: MonsterType;
  lastAction: string;
}
