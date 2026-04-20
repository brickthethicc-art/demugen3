import type { PlayerState } from '../../types/index.js';
import type { Result } from '../../types/actions.js';

export function deductLife(player: PlayerState, cost: number): Result<PlayerState> {
  if (cost < 0) {
    return { ok: false, error: 'Cost cannot be negative' };
  }

  if (player.life < cost) {
    return {
      ok: false,
      error: `Insufficient life: have ${player.life}, need ${cost}`,
    };
  }

  return {
    ok: true,
    value: { ...player, life: player.life - cost },
  };
}

export function canAfford(player: PlayerState, cost: number): boolean {
  return player.life >= cost;
}

export function applyDamageToLife(player: PlayerState, damage: number): PlayerState {
  const newLife = Math.max(0, player.life - damage);
  return {
    ...player,
    life: newLife,
    isEliminated: newLife <= 0,
  };
}

export function isPlayerDead(player: PlayerState): boolean {
  return player.life <= 0;
}
