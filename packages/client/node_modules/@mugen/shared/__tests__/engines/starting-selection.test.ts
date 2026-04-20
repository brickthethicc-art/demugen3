import { describe, it, expect } from 'vitest';
import { validateStartingSelection, placeStartingUnits } from '../../src/engines/game-initialization/index.js';
import { createUnit, createPlayer } from '../factories.js';
import { ACTIVE_UNIT_COUNT, RESERVE_UNIT_COUNT } from '../../src/types/index.js';
import type { UnitCard } from '../../src/types/index.js';

function makeUnits(costs: number[]): UnitCard[] {
  return costs.map((cost, i) => 
    createUnit({ id: `unit-${i}`, cost, hp: 10, maxHp: 10, atk: 3, movement: 2, range: 1 })
  );
}

describe('validateStartingSelection', () => {
  it('validates exactly 6 units under cost limit', () => {
    const units = makeUnits([5, 6, 7, 8, 9, 4]); // Total: 39
    const result = validateStartingSelection(units);
    
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(true);
    }
  });

  it('rejects selection over cost limit', () => {
    const units = makeUnits([8, 8, 8, 8, 8, 9]); // Total: 49
    const result = validateStartingSelection(units);
    
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('cost exceeds');
      expect(result.error).toContain('40');
    }
  });

  it('rejects selection with exactly cost limit', () => {
    const units = makeUnits([7, 7, 7, 7, 6, 6]); // Total: 40
    const result = validateStartingSelection(units);
    
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('cost exceeds');
    }
  });

  it('rejects fewer than 6 units', () => {
    const units = makeUnits([5, 6, 7, 8, 9]); // Only 5 units
    const result = validateStartingSelection(units);
    
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('exactly 6 units');
    }
  });

  it('rejects more than 6 units', () => {
    const units = makeUnits([5, 6, 7, 8, 9, 4, 3]); // 7 units
    const result = validateStartingSelection(units);
    
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('exactly 6 units');
    }
  });

  it('rejects empty selection', () => {
    const units: UnitCard[] = [];
    const result = validateStartingSelection(units);
    
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('exactly 6 units');
    }
  });

  it('handles duplicate units', () => {
    const unit = createUnit({ id: 'unit-1', cost: 5 });
    const units = [unit, unit, unit, unit, unit, unit]; // 6 duplicates
    const result = validateStartingSelection(units);
    
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(true);
    }
  });
});

describe('placeStartingUnits', () => {
  it('places 3 active units on board and 3 in reserve', () => {
    const units = makeUnits([5, 6, 7, 8, 9, 4]);
    const player = createPlayer({
      id: 'p1',
      life: 24,
      isReady: true,
      units: [],
      team: { activeUnits: [], reserveUnits: [], locked: false },
    });

    const result = placeStartingUnits(units, player);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    const updatedPlayer = result.value;
    expect(updatedPlayer.units).toHaveLength(6);
    expect(updatedPlayer.team.activeUnits).toHaveLength(ACTIVE_UNIT_COUNT);
    expect(updatedPlayer.team.reserveUnits).toHaveLength(RESERVE_UNIT_COUNT);
    
    // Check first 3 are active with positions
    expect(updatedPlayer.units[0]!.position).not.toBeNull();
    expect(updatedPlayer.units[1]!.position).not.toBeNull();
    expect(updatedPlayer.units[2]!.position).not.toBeNull();
    
    // Check last 3 are in reserve (no positions)
    expect(updatedPlayer.units[3]!.position).toBeNull();
    expect(updatedPlayer.units[4]!.position).toBeNull();
    expect(updatedPlayer.units[5]!.position).toBeNull();
  });

  it('places active units at correct starting positions', () => {
    const units = makeUnits([5, 6, 7, 8, 9, 4]);
    const player = createPlayer({
      id: 'p1',
      life: 24,
      isReady: true,
      units: [],
      team: { activeUnits: [], reserveUnits: [], locked: false },
    });

    const result = placeStartingUnits(units, player);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    const updatedPlayer = result.value;
    
    // Player 1 should start at top row (y=0)
    expect(updatedPlayer.units[0]!.position).toEqual({ x: 0, y: 0 });
    expect(updatedPlayer.units[1]!.position).toEqual({ x: 1, y: 0 });
    expect(updatedPlayer.units[2]!.position).toEqual({ x: 2, y: 0 });
  });

  it('creates UnitInstance objects correctly', () => {
    const units = makeUnits([5, 6, 7, 8, 9, 4]);
    const player = createPlayer({
      id: 'p1',
      life: 24,
      isReady: true,
      units: [],
      team: { activeUnits: [], reserveUnits: [], locked: false },
    });

    const result = placeStartingUnits(units, player);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    const updatedPlayer = result.value;
    
    for (let i = 0; i < updatedPlayer.units.length; i++) {
      const unit = updatedPlayer.units[i]!;
      expect(unit.card).toBe(units[i]);
      expect(unit.currentHp).toBe(units[i].hp);
      expect(unit.ownerId).toBe('p1');
      expect(unit.hasMovedThisTurn).toBe(false);
      expect(unit.hasUsedAbilityThisTurn).toBe(false);
      expect(unit.hasAttackedThisTurn).toBe(false);
      expect(unit.combatModifiers).toEqual([]);
    }
  });

  it('does not mutate original player', () => {
    const units = makeUnits([5, 6, 7, 8, 9, 4]);
    const player = createPlayer({
      id: 'p1',
      life: 24,
      isReady: true,
      units: [],
      team: { activeUnits: [], reserveUnits: [], locked: false },
    });
    const originalPlayer = JSON.parse(JSON.stringify(player));
    
    placeStartingUnits(units, player);
    
    expect(player).toEqual(originalPlayer);
  });
});
