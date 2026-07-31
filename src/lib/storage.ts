import { GameMode, StageTheme, CollectibleItem, FarmCropTile, CellData } from '../types';

export interface SavedExplorerState {
  p1Pos: { x: number; y: number; z: number };
  p2Pos: { x: number; y: number; z: number };
  p1Score: number;
  p2Score: number;
  teamCash: number;
  runSeed: number;
  stageTheme: StageTheme;
  distanceExplored: number;
  p1Gems?: number;
  p2Gems?: number;
  teamScore?: number;
  collectibles?: CollectibleItem[];
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

const STORAGE_KEY_EXPLORER = 'voxel_monsters_explorer_state_v2';
const STORAGE_KEY_CELLS = 'voxel_monsters_world_cells_v1';
const STORAGE_KEY_SEED = 'voxel_monsters_run_seed_v1';
const STORAGE_KEY_FARM = 'voxel_monsters_farm_state_v1';
const STORAGE_KEY_FISHING = 'voxel_monsters_fishing_state_v1';
const STORAGE_KEY_MODE = 'voxel_monsters_active_mode_v1';

export function loadRunSeed(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SEED);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed)) return parsed;
    }
    const newSeed = Math.floor(Math.random() * 900000 + 100000);
    localStorage.setItem(STORAGE_KEY_SEED, newSeed.toString());
    return newSeed;
  } catch {
    return 123456;
  }
}

export function saveRunSeed(seed: number) {
  try {
    localStorage.setItem(STORAGE_KEY_SEED, seed.toString());
  } catch {
    // ignore
  }
}

export function loadWorldCells(): Record<string, CellData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CELLS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveWorldCells(cells: Record<string, CellData>) {
  try {
    localStorage.setItem(STORAGE_KEY_CELLS, JSON.stringify(cells));
  } catch {
    // ignore
  }
}

export function resetAdventure(): { seed: number; cells: Record<string, CellData> } {
  try {
    localStorage.removeItem(STORAGE_KEY_EXPLORER);
    localStorage.removeItem(STORAGE_KEY_CELLS);
    const newSeed = Math.floor(Math.random() * 900000 + 100000);
    localStorage.setItem(STORAGE_KEY_SEED, newSeed.toString());
    return { seed: newSeed, cells: {} };
  } catch {
    return { seed: 123456, cells: {} };
  }
}

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
