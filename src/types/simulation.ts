/**
 * Primordial Soup Simulation Type Definitions
 * Zero emoji discipline across all models and UI.
 */

export interface Genes {
  size: number;        // 0.4 (micro) to 6.0 (colossal titan)
  speed: number;       // 0.8 to 3.5 base propulsion
  perception: number;  // 8 to 45 vision/sensor radius
  hue: number;         // 0 to 360 bioluminescent color
  armor: number;       // 0 to 1.0 defense/damage reduction
  digestion: number;   // 0.6 to 2.5 metabolic intake efficiency
  agility: number;     // 0.5 to 3.0 turn speed & wiggle frequency
}

export interface NeuralWeights {
  foodAttraction: number;      // -1.0 to 2.0
  predatorAvoidance: number;   // 0.0 to 3.0
  mateAttraction: number;      // -0.5 to 2.0
  curiosity: number;           // 0.1 to 1.0 (wandering drift)
}

export interface DigestionVacuole {
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  energyLeft: number;
  maxEnergy: number;
}

export type CreatureBehavior = 'foraging' | 'hunting' | 'fleeing' | 'seeking_mate' | 'mitosis' | 'wandering';
export type CreatureDiet = 'herbivore' | 'carnivore' | 'detritivore' | 'apex';

export interface CreatureState {
  id: string;
  name: string;
  generation: number;
  age: number;
  maxAge: number;
  energy: number;
  maxEnergy: number;
  health: number;
  maxHealth: number;
  
  // Spatial & Kinematics
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  heading: number; // yaw angle in radians
  pitch: number;
  targetHeading: number;

  // Soft-body multi-segment spine (3 to 8 connected nodes)
  segmentCount: number;
  segmentPositions: { x: number; y: number; z: number }[];
  segmentRadii: number[];
  wigglePhase: number;

  // Genetics & Neuro
  genes: Genes;
  neuralWeights: NeuralWeights;
  diet: CreatureDiet;
  behavior: CreatureBehavior;

  // Biological state
  digestionVacuoles: DigestionVacuole[];
  offspringCount: number;
  killsCount: number;
  lastMatingTime: number;
  squishFactor: number; // soft-body collision squash deformation
}

export type FoodType = 'nutrient' | 'algae' | 'meat' | 'detritus_crumb';

export interface FoodPellet {
  id: string;
  type: FoodType;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  energy: number;
  radius: number;
  hue: number;
  age: number;
}

export interface DetritusChunk {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  vRotX: number;
  vRotY: number;
  vRotZ: number;
  radius: number;
  points: { x: number; y: number; z: number }[]; // procedural polygon hull
  mass: number;
}

export interface HydrothermalVent {
  id: string;
  x: number;
  z: number;
  radius: number;
  eruptTimer: number;
  energyPuffInterval: number;
}

export interface SimulationStats {
  creatureCount: number;
  foodCount: number;
  detritusCount: number;
  generationMax: number;
  herbivoreCount: number;
  carnivoreCount: number;
  apexCount: number;
  simTime: number;
}
