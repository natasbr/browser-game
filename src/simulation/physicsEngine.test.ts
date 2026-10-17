import test from 'node:test';
import assert from 'node:assert/strict';
import { PrimordialSimulation } from './physicsEngine.ts';

test('PrimordialSimulation initializes with balanced ecosystem', () => {
  const sim = new PrimordialSimulation();
  assert.ok(sim.creatures.length >= 10, 'Should spawn initial creatures');
  assert.ok(sim.foods.length >= 50, 'Should spawn initial food pellets');
  assert.ok(sim.detritus.length >= 10, 'Should spawn initial detritus chunks');
  assert.ok(sim.vents.length >= 3, 'Should spawn hydrothermal vents');
});

test('Creature soft-body spine updates and follows heading', () => {
  const sim = new PrimordialSimulation();
  const creature = sim.spawnCreature({
    x: 0,
    z: 0,
    diet: 'herbivore',
    genes: { size: 1.5, speed: 2.0, agility: 1.5 },
  });

  const initialHeadX = creature.x;
  sim.update(0.1);

  assert.notEqual(creature.x, initialHeadX, 'Creature should propel forward');
  assert.equal(creature.segmentPositions.length, creature.segmentCount, 'Spine segments must match count');
  assert.ok(creature.segmentPositions[0].x !== undefined, 'Head position must exist');
});

test('7-Gene bounds enforcement and mutation logic', () => {
  const sim = new PrimordialSimulation();
  const titan = sim.spawnCreature({
    diet: 'apex',
    genes: { size: 4.8, armor: 0.8 },
  });

  assert.ok(titan.genes.size >= 4.0, 'Titan should maintain colossal scale');
  assert.ok(titan.genes.armor <= 1.0, 'Armor should be normalized <= 1.0');
  assert.equal(titan.diet, 'apex', 'Diet should be apex');
});
