import { GameMode, MonsterType, StageTheme, CollectibleItem, FarmCropTile } from '../types';

export interface SavedExplorerState {
  p1Pos: { x: number; y: number; z: number };
  p2Pos: { x: number; y: number; z: number };
  p1Score: number;
  p2Score: number;
  p1Gems: number;
  p2Gems: number;
  teamScore: number;
  stageTheme: StageTheme;
  distanceExplored: number;
  collectibles: CollectibleItem[];
}

export interface SavedFarmState {
  p1Pos: { x: number; y: number; z: number };
  p2Pos: { x: number; y: number; z: number };
  p1Gold: number;
  p2Gold: number;
  teamGold: number;
  p1Seed: string | null;
  p2Seed: string | null;
  p1Fruit: string | null;
  p2Fruit: string | null;
  crops: FarmCropTile[];
}

export interface SavedFishingState {
  p1Pos: { x: number; y: number; z: number };
  p2Pos: { x: number; y: number; z: number };
  p1FishCount: number;
  p2FishCount: number;
}

export interface SavedDanceState {
  p1Pos: { x: number; y: number; z: number };
  p2Pos: { x: number; y: number; z: number };
  p1DanceScore: number;
  p2DanceScore: number;
  p1Combo: number;
  p2Combo: number;
}

const STORAGE_KEY_EXPLORER = 'voxel_monsters_explorer_state_v1';
const STORAGE_KEY_FARM = 'voxel_monsters_farm_state_v1';
const STORAGE_KEY_FISHING = 'voxel_monsters_fishing_state_v1';
const STORAGE_KEY_DANCE = 'voxel_monsters_dance_state_v1';
const STORAGE_KEY_MODE = 'voxel_monsters_active_mode_v1';

export function saveExplorerState(state: SavedExplorerState) {
  try {
    localStorage.setItem(STORAGE_KEY_EXPLORER, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function loadExplorerState(): SavedExplorerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXPLORER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveFarmState(state: SavedFarmState) {
  try {
    localStorage.setItem(STORAGE_KEY_FARM, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function loadFarmState(): SavedFarmState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FARM);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveFishingState(state: SavedFishingState) {
  try {
    localStorage.setItem(STORAGE_KEY_FISHING, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function loadFishingState(): SavedFishingState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FISHING);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDanceState(state: SavedDanceState) {
  try {
    localStorage.setItem(STORAGE_KEY_DANCE, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function loadDanceState(): SavedDanceState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DANCE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveGameMode(mode: GameMode) {
  try {
    localStorage.setItem(STORAGE_KEY_MODE, mode);
  } catch {
    // ignore
  }
}

export function loadActiveGameMode(): GameMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MODE);
    return (raw as GameMode) || 'explorer';
  } catch {
    return 'explorer';
  }
}
