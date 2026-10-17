/**
 * Physics and Evolution Engine for Primordial Soup Simulator.
 * Features soft-body worm spine kinematics, 7-gene genetics,
 * neural behavioral steering, detritus collisions, and spatial hashing.
 * Zero emojis.
 */

import {
  CreatureState,
  FoodPellet,
  DetritusChunk,
  HydrothermalVent,
  Genes,
  NeuralWeights,
  CreatureDiet,
  SimulationStats,
} from '../types/simulation';
import { biologicalAudio } from './audioSynth';

export class PrimordialSimulation {
  public creatures: CreatureState[] = [];
  public foods: FoodPellet[] = [];
  public detritus: DetritusChunk[] = [];
  public vents: HydrothermalVent[] = [];

  public worldRadius = 130; // Bound of the primordial petri arena
  public depthRange = { min: -14, max: 10 }; // Top-down 3D layer thickness
  public simTime = 0;
  public timeScale = 1.0;
  public maxCreatures = 140;
  public maxFoods = 320;
  public maxDetritus = 45;

  private nextId = 1;

  constructor() {
    this.seedDefaultEnvironment();
  }

  public seedDefaultEnvironment() {
    this.creatures = [];
    this.foods = [];
    this.detritus = [];
    this.vents = [];

    // Hydrothermal nutrient vents
    const ventCoords = [
      { x: -50, z: -40 },
      { x: 55, z: 45 },
      { x: 0, z: -65 },
      { x: -45, z: 50 },
      { x: 60, z: -35 },
    ];
    for (const vc of ventCoords) {
      this.vents.push({
        id: `vent-${this.nextId++}`,
        x: vc.x,
        z: vc.z,
        radius: 7.5,
        eruptTimer: Math.random() * 3,
        energyPuffInterval: 2.5 + Math.random() * 2.0,
      });
    }

    // Detritus chunks
    for (let i = 0; i < 28; i++) {
      this.spawnDetritus(
        (Math.random() - 0.5) * this.worldRadius * 1.5,
        (Math.random() - 0.5) * this.worldRadius * 1.5,
        1.8 + Math.random() * 3.5
      );
    }

    // Initial Food Pellets
    for (let i = 0; i < 160; i++) {
      this.spawnFood(
        (Math.random() - 0.5) * this.worldRadius * 1.6,
        (Math.random() - 0.5) * this.worldRadius * 1.6,
        Math.random() > 0.4 ? 'algae' : 'nutrient'
      );
    }

    // Initial diverse population of primordial organisms
    // 1. Gentle Micro-Blobs
    for (let i = 0; i < 18; i++) {
      this.spawnCreature({
        x: (Math.random() - 0.5) * 80,
        z: (Math.random() - 0.5) * 80,
        diet: 'herbivore',
        genes: {
          size: 0.6 + Math.random() * 0.4,
          speed: 1.8 + Math.random() * 0.8,
          perception: 18 + Math.random() * 10,
          hue: 130 + Math.random() * 50, // vibrant emerald/teal
          armor: 0.1 + Math.random() * 0.2,
          digestion: 1.2 + Math.random() * 0.6,
          agility: 1.5 + Math.random() * 1.0,
        },
      });
    }

    // 2. Medium Wiggly Scavengers & Herbivores
    for (let i = 0; i < 12; i++) {
      this.spawnCreature({
        x: (Math.random() - 0.5) * 100,
        z: (Math.random() - 0.5) * 100,
        diet: 'detritivore',
        genes: {
          size: 1.2 + Math.random() * 0.6,
          speed: 1.4 + Math.random() * 0.5,
          perception: 24 + Math.random() * 8,
          hue: 40 + Math.random() * 40, // golden amber / cyan
          armor: 0.35 + Math.random() * 0.3,
          digestion: 1.5 + Math.random() * 0.5,
          agility: 1.2 + Math.random() * 0.8,
        },
      });
    }

    // 3. Fast Hunters (Carnivores)
    for (let i = 0; i < 6; i++) {
      this.spawnCreature({
        x: (Math.random() - 0.5) * 110,
        z: (Math.random() - 0.5) * 110,
        diet: 'carnivore',
        genes: {
          size: 1.9 + Math.random() * 0.7,
          speed: 2.2 + Math.random() * 0.6,
          perception: 32 + Math.random() * 10,
          hue: 340 + Math.random() * 40, // crimson / ruby
          armor: 0.4 + Math.random() * 0.3,
          digestion: 1.8 + Math.random() * 0.4,
          agility: 1.8 + Math.random() * 0.6,
        },
      });
    }

    // 4. One Ancient Apex Titan (Colossus)
    this.spawnCreature({
      x: 10,
      z: -10,
      diet: 'apex',
      genes: {
        size: 4.8,
        speed: 1.0,
        perception: 42,
        hue: 275, // deep cosmic violet
        armor: 0.85,
        digestion: 2.2,
        agility: 0.8,
      },
      name: 'Titan Leviathan Alpha',
    });
  }

  public spawnFood(x: number, z: number, type: 'nutrient' | 'algae' | 'meat' | 'detritus_crumb', energy?: number): FoodPellet {
    const hues: Record<string, number> = {
      algae: 140,
      nutrient: 50,
      meat: 350,
      detritus_crumb: 210,
    };
    const energies: Record<string, number> = {
      algae: 18,
      nutrient: 28,
      meat: 55,
      detritus_crumb: 14,
    };

    const pellet: FoodPellet = {
      id: `food-${this.nextId++}`,
      type,
      x: Math.max(-this.worldRadius, Math.min(this.worldRadius, x)),
      y: (Math.random() - 0.5) * 4,
      z: Math.max(-this.worldRadius, Math.min(this.worldRadius, z)),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.1,
      vz: (Math.random() - 0.5) * 0.3,
      energy: energy ?? energies[type],
      radius: type === 'meat' ? 0.9 : 0.65,
      hue: hues[type] + (Math.random() * 15 - 7),
      age: 0,
    };

    if (this.foods.length < this.maxFoods) {
      this.foods.push(pellet);
    }
    return pellet;
  }

  public spawnDetritus(x: number, z: number, radius = 2.5): DetritusChunk {
    // Generate organic polygon hull vertices
    const points: { x: number; y: number; z: number }[] = [];
    const count = 7 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius * (0.6 + Math.random() * 0.6);
      points.push({
        x: Math.cos(angle) * r,
        y: (Math.random() - 0.5) * (radius * 0.6),
        z: Math.sin(angle) * r,
      });
    }

    const chunk: DetritusChunk = {
      id: `detritus-${this.nextId++}`,
      x: Math.max(-this.worldRadius, Math.min(this.worldRadius, x)),
      y: (Math.random() - 0.5) * 3,
      z: Math.max(-this.worldRadius, Math.min(this.worldRadius, z)),
      vx: (Math.random() - 0.5) * 0.15,
      vy: 0,
      vz: (Math.random() - 0.5) * 0.15,
      rotX: Math.random() * Math.PI * 2,
      rotY: Math.random() * Math.PI * 2,
      rotZ: Math.random() * Math.PI * 2,
      vRotX: (Math.random() - 0.5) * 0.05,
      vRotY: (Math.random() - 0.5) * 0.08,
      vRotZ: (Math.random() - 0.5) * 0.05,
      radius,
      points,
      mass: radius * radius * 3.0,
    };

    if (this.detritus.length < this.maxDetritus) {
      this.detritus.push(chunk);
    }
    return chunk;
  }

  public spawnCreature(options: {
    x?: number;
    z?: number;
    genes?: Partial<Genes>;
    neuralWeights?: Partial<NeuralWeights>;
    diet?: CreatureDiet;
    generation?: number;
    name?: string;
  }): CreatureState {
    const size = Math.max(0.4, Math.min(6.0, options.genes?.size ?? (0.8 + Math.random() * 0.8)));
    const genes: Genes = {
      size,
      speed: Math.max(0.6, Math.min(3.8, options.genes?.speed ?? (1.2 + Math.random() * 1.0))),
      perception: Math.max(8, Math.min(50, options.genes?.perception ?? (18 + size * 4))),
      hue: ((options.genes?.hue ?? Math.random() * 360) + 360) % 360,
      armor: Math.max(0.0, Math.min(1.0, options.genes?.armor ?? Math.random() * 0.5)),
      digestion: Math.max(0.5, Math.min(2.5, options.genes?.digestion ?? (1.0 + Math.random() * 0.8))),
      agility: Math.max(0.5, Math.min(3.0, options.genes?.agility ?? (1.2 + Math.random() * 0.8))),
    };

    const neuralWeights: NeuralWeights = {
      foodAttraction: options.neuralWeights?.foodAttraction ?? (1.2 + Math.random() * 0.4),
      predatorAvoidance: options.neuralWeights?.predatorAvoidance ?? (1.8 + Math.random() * 0.6),
      mateAttraction: options.neuralWeights?.mateAttraction ?? (0.8 + Math.random() * 0.5),
      curiosity: options.neuralWeights?.curiosity ?? (0.4 + Math.random() * 0.3),
    };

    let diet = options.diet;
    if (!diet) {
      if (genes.size >= 3.5) diet = 'apex';
      else if (genes.size > 1.6) diet = 'carnivore';
      else if (genes.armor > 0.5) diet = 'detritivore';
      else diet = 'herbivore';
    }

    // Number of spine segments scales with size (3 to 8 segments)
    const segmentCount = Math.min(8, Math.max(3, Math.round(3 + size * 0.9)));
    const segmentRadii: number[] = [];
    const segmentPositions: { x: number; y: number; z: number }[] = [];

    const x = options.x ?? (Math.random() - 0.5) * this.worldRadius * 1.2;
    const y = (Math.random() - 0.5) * 4;
    const z = options.z ?? (Math.random() - 0.5) * this.worldRadius * 1.2;
    const heading = Math.random() * Math.PI * 2;

    for (let i = 0; i < segmentCount; i++) {
      // Tapering profile: head is prominent, middle is plump, tail tapers thin
      const t = i / (segmentCount - 1);
      const taper = Math.sin((t + 0.1) * Math.PI * 0.9);
      const r = size * (0.45 + taper * 0.55);
      segmentRadii.push(r);

      const segSpacing = size * 0.75;
      segmentPositions.push({
        x: x - Math.cos(heading) * (i * segSpacing),
        y,
        z: z - Math.sin(heading) * (i * segSpacing),
      });
    }

    const maxEnergy = 80 + size * 40;
    const maxHealth = 60 + size * 60 + genes.armor * 50;

    const creature: CreatureState = {
      id: `cell-${this.nextId++}`,
      name: options.name ?? this.generateCreatureName(diet, size),
      generation: options.generation ?? 1,
      age: 0,
      maxAge: 70 + size * 30 + Math.random() * 25,
      energy: maxEnergy * 0.85,
      maxEnergy,
      health: maxHealth,
      maxHealth,
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      heading,
      pitch: 0,
      targetHeading: heading,
      segmentCount,
      segmentPositions,
      segmentRadii,
      wigglePhase: Math.random() * Math.PI * 2,
      genes,
      neuralWeights,
      diet,
      behavior: 'foraging',
      digestionVacuoles: [],
      offspringCount: 0,
      killsCount: 0,
      lastMatingTime: -20,
      squishFactor: 1.0,
    };

    if (this.creatures.length < this.maxCreatures) {
      this.creatures.push(creature);
    }
    return creature;
  }

  private generateCreatureName(diet: CreatureDiet, size: number): string {
    const prefixes = {
      herbivore: ['Phyto', 'Chlora', 'Velo', 'Nema', 'Spira', 'Myco'],
      carnivore: ['Vorax', 'Thrasher', 'Scythe', 'Denta', 'Chitin', 'Stalker'],
      detritivore: ['Sapros', 'Benthos', 'Gorgon', 'Muck', 'Triton'],
      apex: ['Gargantua', 'Leviathan', 'Kraken', 'Behemoth', 'Colossus'],
    };
    const suffixes = ['plasm', 'cyte', 'amoeba', 'flagella', 'hydra', 'zoon', 'proto'];
    const pList = prefixes[diet];
    const p = pList[Math.floor(Math.random() * pList.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];
    const mark = size > 3.0 ? ' Prime' : '';
    return `${p}${s}${mark}`;
  }

  public update(dt: number) {
    const effectiveDt = Math.min(dt, 0.1) * this.timeScale;
    this.simTime += effectiveDt;

    // 1. Update Hydrothermal Vents
    this.updateVents(effectiveDt);

    // 2. Update Detritus Physics (fluid drag & inertia)
    this.updateDetritus(effectiveDt);

    // 3. Update Food Pellets (fluid drift)
    this.updateFood(effectiveDt);

    // 4. Update Organisms (AI, kinematics, soft-body spring segments, metabolism)
    this.updateCreatures(effectiveDt);

    // 5. Environmental equilibrium maintenance
    this.maintainEcosystem();
  }

  private updateVents(dt: number) {
    for (const vent of this.vents) {
      vent.eruptTimer += dt;
      if (vent.eruptTimer >= vent.energyPuffInterval) {
        vent.eruptTimer = 0;
        // Spew 2-4 nutrient and algae pellets
        const count = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * vent.radius;
          const f = this.spawnFood(
            vent.x + Math.cos(angle) * dist,
            vent.z + Math.sin(angle) * dist,
            Math.random() > 0.35 ? 'nutrient' : 'algae'
          );
          f.vx = Math.cos(angle) * (0.8 + Math.random() * 0.8);
          f.vz = Math.sin(angle) * (0.8 + Math.random() * 0.8);
          f.vy = 0.5 + Math.random() * 0.8;
        }
        biologicalAudio.playVentBubble();
      }
    }
  }

  private updateDetritus(dt: number) {
    const fluidDrag = 0.94;
    for (let i = 0; i < this.detritus.length; i++) {
      const d = this.detritus[i];
      d.x += d.vx * dt * 30;
      d.z += d.vz * dt * 30;
      d.vx *= fluidDrag;
      d.vz *= fluidDrag;

      d.rotX += d.vRotX * dt;
      d.rotY += d.vRotY * dt;
      d.rotZ += d.vRotZ * dt;

      // Arena boundary bounce
      const distSq = d.x * d.x + d.z * d.z;
      if (distSq > this.worldRadius * this.worldRadius) {
        const dist = Math.sqrt(distSq);
        const nx = d.x / dist;
        const nz = d.z / dist;
        d.vx -= nx * 0.5;
        d.vz -= nz * 0.5;
        d.x = nx * (this.worldRadius - 1);
        d.z = nz * (this.worldRadius - 1);
      }
    }
  }

  private updateFood(dt: number) {
    const fluidDrag = 0.92;
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const f = this.foods[i];
      f.age += dt;
      f.x += f.vx * dt * 25;
      f.y += f.vy * dt * 25;
      f.z += f.vz * dt * 25;
      f.vx *= fluidDrag;
      f.vy *= fluidDrag;
      f.vz *= fluidDrag;

      // Vertical buoyancy oscillation in primordial fluid
      f.y = Math.sin(this.simTime * 0.8 + f.x * 0.1) * 1.5;

      // Despawn ancient stale food
      if (f.age > 180) {
        this.foods.splice(i, 1);
      }
    }
  }

  private updateCreatures(dt: number) {
    const toSpawnOffspring: CreatureState[] = [];
    const deadCreatureIds = new Set<string>();

    for (let i = 0; i < this.creatures.length; i++) {
      const c = this.creatures[i];
      c.age += dt;

      // --- Biological Metabolic Cost ---
      // Base energy burn scales with size^1.4 and speed
      const baseMetabolicRate = (0.5 + Math.pow(c.genes.size, 1.3) * 0.6 + c.genes.speed * 0.3) / c.genes.digestion;
      c.energy -= baseMetabolicRate * dt;

      // Health decay when starving
      if (c.energy <= 0) {
        c.energy = 0;
        c.health -= 12 * dt;
      } else if (c.energy > c.maxEnergy * 0.5 && c.health < c.maxHealth) {
        // Natural regeneration when nourished
        c.health = Math.min(c.maxHealth, c.health + 4 * dt);
        c.energy -= 2 * dt;
      }

      // Death check
      if (c.health <= 0 || c.age >= c.maxAge) {
        deadCreatureIds.add(c.id);
        // Decompose into nutritious food pellets and detritus
        const pelletCount = Math.min(8, Math.max(2, Math.round(c.genes.size * 2)));
        for (let p = 0; p < pelletCount; p++) {
          this.spawnFood(
            c.x + (Math.random() - 0.5) * c.genes.size * 2,
            c.z + (Math.random() - 0.5) * c.genes.size * 2,
            'meat',
            35
          );
        }
        if (c.genes.size >= 1.5) {
          this.spawnDetritus(c.x, c.z, c.genes.size * 0.8);
        }
        continue;
      }

      // --- Digestion Vacuole Processing ---
      for (let v = c.digestionVacuoles.length - 1; v >= 0; v--) {
        const vac = c.digestionVacuoles[v];
        const absorbed = Math.min(vac.energyLeft, 22 * c.genes.digestion * dt);
        vac.energyLeft -= absorbed;
        c.energy = Math.min(c.maxEnergy, c.energy + absorbed);
        // Vacuole shrinks as energy is extracted
        vac.radius = (vac.energyLeft / vac.maxEnergy) * 0.5 * c.genes.size;
        if (vac.energyLeft <= 0) {
          c.digestionVacuoles.splice(v, 1);
        }
      }

      // --- Neural Decision Engine & Steering ---
      this.evaluateCreatureAI(c, dt);

      // --- Soft-body Spine Kinematics & Locomotion ---
      this.integrateSpineKinematics(c, dt);

      // --- Environmental Detritus Obstacle Squeeze & Collision ---
      this.handleDetritusCollisions(c);

      // --- Feeding & Predation Interactions ---
      this.handleInteractions(c);

      // --- Reproduction / Mitosis Check ---
      if (
        c.energy >= c.maxEnergy * 0.88 &&
        c.age >= 10 &&
        this.simTime - c.lastMatingTime > 18 &&
        this.creatures.length < this.maxCreatures
      ) {
        const offspring = this.reproduce(c);
        toSpawnOffspring.push(offspring);
        c.energy *= 0.45;
        c.lastMatingTime = this.simTime;
        c.offspringCount++;
        biologicalAudio.playMitosis(c.genes.hue);
      }
    }

    // Filter dead
    if (deadCreatureIds.size > 0) {
      this.creatures = this.creatures.filter(c => !deadCreatureIds.has(c.id));
    }

    // Add newborn offspring
    for (const off of toSpawnOffspring) {
      if (this.creatures.length < this.maxCreatures) {
        this.creatures.push(off);
      }
    }
  }

  private evaluateCreatureAI(c: CreatureState, dt: number) {
    let steerX = 0;
    let steerZ = 0;
    const perceptionSq = c.genes.perception * c.genes.perception;

    let nearestThreat: CreatureState | null = null;
    let minThreatDistSq = Infinity;

    let nearestPrey: CreatureState | null = null;
    let minPreyDistSq = Infinity;

    let nearestFood: FoodPellet | null = null;
    let minFoodDistSq = Infinity;

    let nearestMate: CreatureState | null = null;
    let minMateDistSq = Infinity;

    // Scan other creatures
    for (let i = 0; i < this.creatures.length; i++) {
      const other = this.creatures[i];
      if (other.id === c.id) continue;

      const dx = other.x - c.x;
      const dz = other.z - c.z;
      const dSq = dx * dx + dz * dz;
      if (dSq > perceptionSq) continue;

      // Is other a threat? (significantly larger carnivore or apex)
      if (other.genes.size > c.genes.size * 1.25 && (other.diet === 'carnivore' || other.diet === 'apex')) {
        if (dSq < minThreatDistSq) {
          minThreatDistSq = dSq;
          nearestThreat = other;
        }
      }

      // Can we eat other?
      if (
        (c.diet === 'carnivore' || c.diet === 'apex') &&
        c.genes.size > other.genes.size * 1.25 &&
        other.diet !== 'apex'
      ) {
        if (dSq < minPreyDistSq) {
          minPreyDistSq = dSq;
          nearestPrey = other;
        }
      }

      // Compatible mate?
      if (
        c.diet === other.diet &&
        c.energy > c.maxEnergy * 0.7 &&
        other.energy > other.maxEnergy * 0.7 &&
        this.simTime - c.lastMatingTime > 15
      ) {
        if (dSq < minMateDistSq) {
          minMateDistSq = dSq;
          nearestMate = other;
        }
      }
    }

    // Scan food pellets
    if (c.diet !== 'carnivore' || c.energy < c.maxEnergy * 0.4) {
      for (let i = 0; i < this.foods.length; i++) {
        const f = this.foods[i];
        if (c.diet === 'herbivore' && f.type === 'meat') continue;
        const dx = f.x - c.x;
        const dz = f.z - c.z;
        const dSq = dx * dx + dz * dz;
        if (dSq < perceptionSq && dSq < minFoodDistSq) {
          minFoodDistSq = dSq;
          nearestFood = f;
        }
      }
    }

    // Behavioral state machine prioritized by survival
    if (nearestThreat) {
      c.behavior = 'fleeing';
      const threatDist = Math.sqrt(minThreatDistSq);
      const nx = (c.x - nearestThreat.x) / (threatDist || 1);
      const nz = (c.z - nearestThreat.z) / (threatDist || 1);
      steerX += nx * c.neuralWeights.predatorAvoidance * 3.5;
      steerZ += nz * c.neuralWeights.predatorAvoidance * 3.5;
    } else if (nearestPrey && c.energy < c.maxEnergy * 0.85) {
      c.behavior = 'hunting';
      const dist = Math.sqrt(minPreyDistSq);
      steerX += ((nearestPrey.x - c.x) / (dist || 1)) * 2.5;
      steerZ += ((nearestPrey.z - c.z) / (dist || 1)) * 2.5;
    } else if (nearestFood && c.energy < c.maxEnergy * 0.9) {
      c.behavior = 'foraging';
      const dist = Math.sqrt(minFoodDistSq);
      steerX += ((nearestFood.x - c.x) / (dist || 1)) * c.neuralWeights.foodAttraction * 2.0;
      steerZ += ((nearestFood.z - c.z) / (dist || 1)) * c.neuralWeights.foodAttraction * 2.0;
    } else if (nearestMate && c.energy > c.maxEnergy * 0.75) {
      c.behavior = 'seeking_mate';
      const dist = Math.sqrt(minMateDistSq);
      steerX += ((nearestMate.x - c.x) / (dist || 1)) * c.neuralWeights.mateAttraction * 1.5;
      steerZ += ((nearestMate.z - c.z) / (dist || 1)) * c.neuralWeights.mateAttraction * 1.5;
    } else {
      c.behavior = 'wandering';
      // Perlin-like organic random drift
      const wanderAngle = Math.sin(this.simTime * 0.6 + c.genes.hue) * Math.PI;
      steerX += Math.cos(wanderAngle) * c.neuralWeights.curiosity;
      steerZ += Math.sin(wanderAngle) * c.neuralWeights.curiosity;
    }

    // Soft repulsion from arena bounds
    const arenaDist = Math.sqrt(c.x * c.x + c.z * c.z);
    if (arenaDist > this.worldRadius * 0.75) {
      const edgeFactor = (arenaDist - this.worldRadius * 0.75) / (this.worldRadius * 0.25);
      steerX -= (c.x / arenaDist) * edgeFactor * 4.0;
      steerZ -= (c.z / arenaDist) * edgeFactor * 4.0;
    }

    if (Math.abs(steerX) > 0.001 || Math.abs(steerZ) > 0.001) {
      c.targetHeading = Math.atan2(steerZ, steerX);
    }

    // Smooth heading damping based on agility
    let angleDiff = c.targetHeading - c.heading;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    const turnRate = (2.5 + c.genes.agility * 2.0) * dt;
    c.heading += Math.max(-turnRate, Math.min(turnRate, angleDiff));
  }

  private integrateSpineKinematics(c: CreatureState, dt: number) {
    // Thrust locomotion along heading
    let moveSpeed = c.genes.speed * (c.behavior === 'fleeing' ? 1.6 : c.behavior === 'hunting' ? 1.35 : 1.0);
    moveSpeed *= 7.0; // scale to world units

    c.vx = Math.cos(c.heading) * moveSpeed;
    c.vz = Math.sin(c.heading) * moveSpeed;

    c.x += c.vx * dt;
    c.z += c.vz * dt;

    // Arena boundary clamp
    const distSq = c.x * c.x + c.z * c.z;
    if (distSq > this.worldRadius * this.worldRadius) {
      const dist = Math.sqrt(distSq);
      c.x = (c.x / dist) * this.worldRadius;
      c.z = (c.z / dist) * this.worldRadius;
    }

    // Undulation cycle (sine wave swimming wiggle)
    const swimFreq = 3.5 * c.genes.agility * (0.8 + c.genes.speed * 0.3);
    c.wigglePhase += swimFreq * dt;

    // Segment 0 is head
    c.segmentPositions[0].x = c.x;
    c.segmentPositions[0].y = c.y + Math.sin(c.wigglePhase * 0.5) * 0.3;
    c.segmentPositions[0].z = c.z;

    // Segments 1 to N follow predecessor with soft-body spring damping & lateral wave
    const baseSpacing = c.genes.size * 0.72;
    const lateralNormalX = -Math.sin(c.heading);
    const lateralNormalZ = Math.cos(c.heading);

    for (let s = 1; s < c.segmentCount; s++) {
      const prev = c.segmentPositions[s - 1];
      const curr = c.segmentPositions[s];

      const dx = curr.x - prev.x;
      const dz = curr.z - prev.z;
      const currentDist = Math.sqrt(dx * dx + dz * dz) || 0.001;

      // Enforce target spacing with spring relaxation
      const targetDist = baseSpacing;
      const relaxFactor = 0.65;
      const correction = (currentDist - targetDist) * relaxFactor;

      curr.x -= (dx / currentDist) * correction;
      curr.z -= (dz / currentDist) * correction;

      // Add undulatory sinusoidal wave offset for life-like eel/worm wiggle
      const wave = Math.sin(c.wigglePhase - s * 0.7) * (c.genes.size * 0.22);
      curr.x += lateralNormalX * wave * (s / c.segmentCount);
      curr.z += lateralNormalZ * wave * (s / c.segmentCount);
      curr.y = prev.y * 0.8;
    }

    // Squish factor recovery
    c.squishFactor += (1.0 - c.squishFactor) * 5.0 * dt;
  }

  private handleDetritusCollisions(c: CreatureState) {
    const headRadius = c.segmentRadii[0];

    for (let i = 0; i < this.detritus.length; i++) {
      const d = this.detritus[i];
      const dx = c.x - d.x;
      const dz = c.z - d.z;
      const dSq = dx * dx + dz * dz;
      const minDist = headRadius + d.radius;

      if (dSq < minDist * minDist) {
        const dist = Math.sqrt(dSq) || 0.001;
        const nx = dx / dist;
        const nz = dz / dist;
        const push = minDist - dist;

        // Push creature and deform soft-body
        c.x += nx * push * 0.7;
        c.z += nz * push * 0.7;
        c.squishFactor = Math.max(0.65, c.squishFactor - 0.15);

        // Push detritus chunk with momentum
        d.vx -= nx * (c.genes.size / d.mass) * 0.3;
        d.vz -= nz * (c.genes.size / d.mass) * 0.3;
      }
    }
  }

  private handleInteractions(c: CreatureState) {
    const headRadius = c.segmentRadii[0];

    // 1. Eat food pellets
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const f = this.foods[i];
      const dx = f.x - c.x;
      const dz = f.z - c.z;
      const reach = headRadius + f.radius + 0.3;

      if (dx * dx + dz * dz < reach * reach) {
        // Absorbed! Create digestion vacuole inside cell
        c.digestionVacuoles.push({
          x: c.x,
          y: c.y,
          z: c.z,
          radius: 0.4 * c.genes.size,
          color: f.type === 'algae' ? '#22c55e' : f.type === 'meat' ? '#ef4444' : '#eab308',
          energyLeft: f.energy,
          maxEnergy: f.energy,
        });

        biologicalAudio.playEat(1.0 / Math.max(0.7, c.genes.size * 0.5));
        this.foods.splice(i, 1);
        if (c.digestionVacuoles.length > 5) break;
      }
    }

    // 2. Predation against other creatures
    if (c.diet === 'carnivore' || c.diet === 'apex') {
      for (let i = 0; i < this.creatures.length; i++) {
        const victim = this.creatures[i];
        if (victim.id === c.id) continue;
        if (c.genes.size < victim.genes.size * 1.25) continue; // must be noticeably bigger

        const dx = victim.x - c.x;
        const dz = victim.z - c.z;
        const biteReach = headRadius + victim.segmentRadii[0] + 0.5;

        if (dx * dx + dz * dz < biteReach * biteReach) {
          // Bite damage factoring victim's armor
          const biteDmg = (25 + c.genes.size * 15) * (1.0 - victim.genes.armor * 0.65);
          victim.health -= biteDmg;
          c.energy = Math.min(c.maxEnergy, c.energy + 20 * c.genes.digestion);

          // Victim armor reflects thorns back
          if (victim.genes.armor > 0.4) {
            c.health -= biteDmg * (victim.genes.armor * 0.35);
          }

          biologicalAudio.playBite(c.diet === 'apex');

          if (victim.health <= 0) {
            c.killsCount++;
          }
          break;
        }
      }
    }
  }

  private reproduce(parent: CreatureState): CreatureState {
    // Genetic inheritance with mutation
    const mutate = (val: number, range: number, min: number, max: number) => {
      const drift = (Math.random() - 0.5) * range;
      return Math.max(min, Math.min(max, val + drift));
    };

    const newSize = mutate(parent.genes.size, 0.3, 0.4, 5.8);
    const newHue = (parent.genes.hue + (Math.random() * 40 - 20) + 360) % 360;

    const childGenes: Genes = {
      size: newSize,
      speed: mutate(parent.genes.speed, 0.35, 0.6, 3.8),
      perception: mutate(parent.genes.perception, 4.0, 8, 50),
      hue: newHue,
      armor: mutate(parent.genes.armor, 0.15, 0.0, 1.0),
      digestion: mutate(parent.genes.digestion, 0.3, 0.5, 2.5),
      agility: mutate(parent.genes.agility, 0.3, 0.5, 3.0),
    };

    const childNeural: NeuralWeights = {
      foodAttraction: mutate(parent.neuralWeights.foodAttraction, 0.25, -0.5, 2.5),
      predatorAvoidance: mutate(parent.neuralWeights.predatorAvoidance, 0.3, 0.2, 3.5),
      mateAttraction: mutate(parent.neuralWeights.mateAttraction, 0.25, 0.0, 2.5),
      curiosity: mutate(parent.neuralWeights.curiosity, 0.2, 0.1, 1.0),
    };

    return this.spawnCreature({
      x: parent.x + (Math.random() - 0.5) * parent.genes.size * 2,
      z: parent.z + (Math.random() - 0.5) * parent.genes.size * 2,
      genes: childGenes,
      neuralWeights: childNeural,
      diet: parent.diet,
      generation: parent.generation + 1,
    });
  }

  private maintainEcosystem() {
    // Keep baseline food level so petri dish never goes completely barren
    if (this.foods.length < 90) {
      this.spawnFood(
        (Math.random() - 0.5) * this.worldRadius * 1.5,
        (Math.random() - 0.5) * this.worldRadius * 1.5,
        'algae'
      );
    }

    // Auto seed fresh microbes if near extinction
    if (this.creatures.length < 10) {
      this.spawnCreature({
        x: (Math.random() - 0.5) * 60,
        z: (Math.random() - 0.5) * 60,
        diet: 'herbivore',
      });
    }
  }

  public getStats(): SimulationStats {
    let herbivoreCount = 0;
    let carnivoreCount = 0;
    let apexCount = 0;
    let genMax = 1;

    for (const c of this.creatures) {
      if (c.diet === 'herbivore') herbivoreCount++;
      else if (c.diet === 'carnivore') carnivoreCount++;
      else if (c.diet === 'apex') apexCount++;
      if (c.generation > genMax) genMax = c.generation;
    }

    return {
      creatureCount: this.creatures.length,
      foodCount: this.foods.length,
      detritusCount: this.detritus.length,
      generationMax: genMax,
      herbivoreCount,
      carnivoreCount,
      apexCount,
      simTime: this.simTime,
    };
  }
}
