import type { GameState, SorceryCard } from '@mugen/shared';
import { TurnPhase, CardType, GamePhase } from '@mugen/shared';

export type GameLogFn = (message: string) => void;

function playerLabel(state: GameState, playerId: string): string {
  const player = state.players.find(p => p.id === playerId);
  return player ? `[${player.name.toUpperCase()}]` : '[UNKNOWN PLAYER]';
}

const up = (s: string): string => s.toUpperCase();

function chebyshev(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function phaseEndName(phase: TurnPhase): string | null {
  switch (phase) {
    case TurnPhase.STANDBY: return 'STANDBY PHASE';
    case TurnPhase.MOVE:    return 'MOVEMENT PHASE';
    case TurnPhase.ABILITY: return 'ABILITY PHASE';
    case TurnPhase.ATTACK:  return 'ATTACK PHASE';
    default: return null;
  }
}


/**
 * Diffs two consecutive IN_PROGRESS game states and emits structured log
 * messages for every player interaction that occurred between them.
 *
 * Logging categories covered:
 *   1. Movement
 *   2. Attacking (with kill + bleedover)
 *   3. Abilities (with target identification)
 *   4. Phase transitions
 *   5. Summoning / field placement
 *   6. Sorcery spells
 *   7. Death / kill events
 *   8. Player elimination
 */
export function diffAndLog(prev: GameState, next: GameState, log: GameLogFn): void {
  if (prev.phase !== GamePhase.IN_PROGRESS || next.phase !== GamePhase.IN_PROGRESS) return;

  const prevPlayerIdx = prev.currentPlayerIndex;
  const prevPlayer    = prev.players[prevPlayerIdx]!;
  const label         = playerLabel(prev, prevPlayer.id);

  let abilityKillerName: string | null = null;

  // ─── 1. MOVEMENT ───────────────────────────────────────────────────────────
  // Only fire when the same player is still active (not a turn-end update) and
  // we are in MOVE phase on the previous tick.
  if (prev.turnPhase === TurnPhase.MOVE && prevPlayerIdx === next.currentPlayerIndex) {
    const nextPlayer = next.players[prevPlayerIdx]!;
    for (const prevUnit of prevPlayer.units) {
      const nextUnit = nextPlayer.units.find(u => u.card.id === prevUnit.card.id);
      if (prevUnit.position && nextUnit?.position) {
        const dx = nextUnit.position.x - prevUnit.position.x;
        const dy = nextUnit.position.y - prevUnit.position.y;
        if (dx !== 0 || dy !== 0) {
          const dist = chebyshev(prevUnit.position, nextUnit.position);
          log(`${label}: ${up(prevUnit.card.name)} HAS ADVANCED ${dist} SPACE${dist !== 1 ? 'S' : ''}`);
        }
      }
    }
  }

  // ─── 2. ABILITY USED ───────────────────────────────────────────────────────
  if (prev.turnPhase === TurnPhase.ABILITY && prevPlayerIdx === next.currentPlayerIndex) {
    const nextPlayer = next.players[prevPlayerIdx]!;

    for (const prevUnit of prevPlayer.units) {
      const nextUnit = nextPlayer.units.find(u => u.card.id === prevUnit.card.id);
      if (prevUnit.hasUsedAbilityThisTurn || !nextUnit?.hasUsedAbilityThisTurn) continue;

      abilityKillerName = prevUnit.card.name;

      // Identify the target: first unit (across all players) whose HP or
      // combat-modifier count changed, excluding the ability user themselves.
      let targetSuffix = '';
      outer: for (let i = 0; i < prev.players.length; i++) {
        for (const pt of prev.players[i]!.units) {
          if (pt.card.id === prevUnit.card.id) continue;
          const nt = next.players[i]!.units.find(u => u.card.id === pt.card.id);
          const hpDiff  = nt ? nt.currentHp !== pt.currentHp : true;
          const modDiff = nt ? nt.combatModifiers.length !== pt.combatModifiers.length : false;
          if (hpDiff || modDiff) {
            targetSuffix = ` TARGETING ${up(pt.card.name)}`;
            break outer;
          }
        }
      }

      // Self-target fallback (e.g. self-buff / self-heal abilities)
      if (!targetSuffix) {
        const selfHpMod  = nextUnit.currentHp !== prevUnit.currentHp;
        const selfModMod = nextUnit.combatModifiers.length !== prevUnit.combatModifiers.length;
        if (selfHpMod || selfModMod) targetSuffix = ' (SELF-TARGETED)';
      }

      log(
        `${label}: ${up(prevUnit.card.name)} ABILITY [${up(prevUnit.card.ability.name)}] HAS ACTIVATED: ` +
        `${up(prevUnit.card.ability.description)}${targetSuffix}`
      );
      break; // Only one ability per intent
    }

    // ─── 3. SORCERY PLAYED ─────────────────────────────────────────────────
    // An ability and a sorcery cannot both fire in the same intent, so we only
    // check sorcery when no ability was detected.
    if (!abilityKillerName) {
      const nextPlayer2 = next.players[prevPlayerIdx]!;

      for (const card of prevPlayer.hand.cards) {
        if (card.cardType !== CardType.SORCERY) continue;
        if (nextPlayer2.hand.cards.some(c => c.id === card.id)) continue;

        const sc = card as SorceryCard;

        // Collect names of any units destroyed by this sorcery
        const destroyed: string[] = [];
        for (let i = 0; i < prev.players.length; i++) {
          for (const pu of prev.players[i]!.units) {
            if (pu.currentHp <= 0) continue;
            const nu = next.players[i]!.units.find(u => u.card.id === pu.card.id);
            if (!nu || nu.currentHp <= 0) destroyed.push(up(pu.card.name));
          }
        }

        let desc = up(sc.effect);
        if (destroyed.length > 0) desc += `. DESTROYED: ${destroyed.join(', ')}`;

        log(`${label}: THE SORCERY SPELL '${up(sc.name)}' HAS BEEN ACTIVATED: ${desc}`);
        break; // Only one sorcery per intent
      }
    }
  }

  // ─── 4. ATTACK ─────────────────────────────────────────────────────────────
  if (prev.turnPhase === TurnPhase.ATTACK) {
    const nextPlayerState = next.players[prevPlayerIdx];

    for (const prevUnit of prevPlayer.units) {
      const nextUnit = nextPlayerState?.units.find(u => u.card.id === prevUnit.card.id);

      // Detect attack: flag flipped false→true (survived) OR unit vanished
      // without the flag already being set (died from counterattack).
      const unitAttacked =
        (!prevUnit.hasAttackedThisTurn && nextUnit?.hasAttackedThisTurn) ||
        (!prevUnit.hasAttackedThisTurn && !nextUnit);
      if (!unitAttacked) continue;

      // Find the defending unit: first enemy whose HP dropped this tick.
      let targetFound = false;
      for (let i = 0; i < prev.players.length; i++) {
        if (i === prevPlayerIdx) continue;
        const prevEnemy = prev.players[i]!;
        const nextEnemy = next.players[i]!;

        for (const prevEnemyUnit of prevEnemy.units) {
          const nextEnemyUnit = nextEnemy.units.find(u => u.card.id === prevEnemyUnit.card.id);
          const prevHp = prevEnemyUnit.currentHp;
          const nextHp = nextEnemyUnit?.currentHp ?? 0;
          if (nextHp >= prevHp) continue;

          const damage = prevHp - nextHp;
          log(`${label}: ${up(prevUnit.card.name)} HAS ATTACKED ${up(prevEnemyUnit.card.name)} FOR ${damage} DAMAGE`);

          // Defender killed
          const defenderDied = !nextEnemyUnit || nextHp <= 0;
          if (defenderDied) {
            const bleedover = Math.max(0, prevEnemy.life - nextEnemy.life);
            if (bleedover > 0) {
              log(
                `${label}: ${up(prevUnit.card.name)} HAS KILLED ${up(prevEnemyUnit.card.name)}, ` +
                `DEALING ${bleedover} BLEEDOVER DAMAGE TO ${up(prevEnemy.name)}`
              );
            } else {
              log(`${label}: ${up(prevUnit.card.name)} HAS KILLED ${up(prevEnemyUnit.card.name)}`);
            }
          }

          // Attacker also died (lethal counterattack)
          if (!nextUnit) {
            const defLabel         = playerLabel(prev, prevEnemy.id);
            const attackerLifeNow  = next.players[prevPlayerIdx]?.life ?? prevPlayer.life;
            const counterBleedover = Math.max(0, prevPlayer.life - attackerLifeNow);
            if (counterBleedover > 0) {
              log(
                `${defLabel}: ${up(prevEnemyUnit.card.name)} HAS KILLED ${up(prevUnit.card.name)}, ` +
                `DEALING ${counterBleedover} BLEEDOVER DAMAGE TO ${up(prevPlayer.name)}`
              );
            } else {
              log(`${defLabel}: ${up(prevEnemyUnit.card.name)} HAS KILLED ${up(prevUnit.card.name)}`);
            }
          }

          targetFound = true;
          break;
        }
        if (targetFound) break;
      }

      break; // Only one attack per game_intent
    }
  }

  // ─── 5. BENCH ↔ FIELD EVENTS ───────────────────────────────────────────────
  for (let i = 0; i < prev.players.length; i++) {
    const prevP = prev.players[i]!;
    const nextP = next.players[i]!;
    const pLabel = playerLabel(prev, prevP.id);

    // DEPLOY: unit removed from bench and now has a position on the field
    for (const ru of prevP.team.reserveUnits) {
      if (nextP.team.reserveUnits.find(u => u.id === ru.id)) continue;
      const onField = nextP.units.find(u => u.card.id === ru.id && u.position !== null);
      if (onField) {
        log(`${pLabel}: ${up(ru.name)} HAS ADVANCED FROM THE BENCH TO THE FIELD`);
      }
    }

    // SUMMON: unit appears on bench that was previously in the player's hand
    for (const ru of nextP.team.reserveUnits) {
      if (prevP.team.reserveUnits.find(u => u.id === ru.id)) continue;
      if (prevP.hand.cards.some(c => c.id === ru.id)) {
        log(`${pLabel}: ${up(ru.name)} HAS BEEN SUMMONED TO THE BENCH`);
      }
    }
  }

  // ─── 6. ABILITY KILL EVENTS ────────────────────────────────────────────────
  // Log kills caused by ability use (bleedover does not apply to ability damage).
  if (abilityKillerName && prev.turnPhase === TurnPhase.ABILITY) {
    for (let i = 0; i < prev.players.length; i++) {
      for (const prevUnit of prev.players[i]!.units) {
        if (prevUnit.currentHp <= 0) continue;
        const nextUnit = next.players[i]!.units.find(u => u.card.id === prevUnit.card.id);
        if (!nextUnit || nextUnit.currentHp <= 0) {
          log(`${label}: ${up(abilityKillerName)} HAS KILLED ${up(prevUnit.card.name)}`);
        }
      }
    }
  }

  // ─── 7. PHASE TRANSITIONS ──────────────────────────────────────────────────
  if (prevPlayerIdx !== next.currentPlayerIndex) {
    // Only log the phase the player was actively in when they ended their turn.
    // Phases they already exited via ADVANCE_PHASE were logged in prior state diffs.
    const name = phaseEndName(prev.turnPhase);
    if (name) log(`${label}: ENDED ${name}`);
    log(`${label}: HAS ENDED THEIR TURN`);
  } else if (prev.turnPhase !== next.turnPhase) {
    // ADVANCE_PHASE or auto-exit (e.g. deploy filling standby requirements)
    const name = phaseEndName(prev.turnPhase);
    if (name) log(`${label}: ENDED ${name}`);
  }

  // ─── 8. PLAYER ELIMINATION ─────────────────────────────────────────────────
  for (let i = 0; i < next.players.length; i++) {
    const prevP = prev.players[i];
    const nextP = next.players[i]!;
    if (!prevP?.isEliminated && nextP.isEliminated) {
      log(`${label}: ${up(nextP.name)} HAS BEEN ELIMINATED FROM THE GAME`);
    }
  }
}
