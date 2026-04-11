# Mugen — Game Overview

## Vision

Mugen is a top-down, turn-based strategy card game supporting 2–4 online players. Each player connects from a separate computer to a hosting session over a local network or the internet.

Cards are the primary system. Unit cards are placed on a grid and behave like tactical pieces (chess-like movement), creating a hybrid of trading card systems and grid-based strategy.

## Core Concept

- **Genre:** Turn-based strategy card game
- **Players:** 2–4, online multiplayer (LAN or Internet)
- **Platform:** Windows (web-based client via browser)
- **Perspective:** Top-down grid view

## Key Pillars

1. **Cards as Units** — Every card placed on the board becomes a living tactical piece with HP, ATK, Movement, Range, and a unique Ability.
2. **Life as Resource** — Player life (24 HP) is both the victory condition and the currency for summoning units and casting sorceries.
3. **Dual Damage Combat** — All combat is simultaneous: attacker and defender exchange damage. Overflow damage bleeds through to the defending player's life.
4. **Tactical Grid Movement** — Units move on a grid with individual movement speeds, creating positional strategy.
5. **Online Multiplayer** — Authoritative host/server validates all actions. Clients send intents only.

## Player Setup

Each player enters a match with:

- **6 Unit Cards:** 3 active (placed on board) + 3 reserve (off-board)
- **Deck:** 16 cards
- **Hand:** 4 cards (no draw until a full turn rotation completes)
- **Life:** 24

## Pre-Game Team Building

Before the match begins, each player:

1. Selects exactly 6 unit cards (3 active + 3 reserve)
2. Must keep total summoning cost ≤ 40
3. Locks selections once the match starts

## Turn Flow

Each player's turn follows a strict phase order:

1. **Move Phase** — Move up to 3 active units based on their movement speed
2. **Ability Phase** — Use unit abilities (each ability usable once per turn)
3. **Attack Phase** — Attack with units (attacking ends that unit's actions for the turn)
4. **End Phase** — Turn ends, next player begins

## Combat Rules — Dual Damage

When Unit A attacks Unit B:

- `Unit A HP -= Unit B ATK`
- `Unit B HP -= Unit A ATK`
- Both units always exchange damage (unless an ability prevents it)
- Units die if `HP ≤ 0`
- Overflow damage (overkill) applies to the unit owner's life total
- Counterattacks are the default behavior

## Reserve Deployment Rules

- Unit dies during **owner's turn** → reserve cannot replace until next turn
- Unit dies **outside owner's turn** → normal deployment rules apply

## Card Types

### Unit Cards

| Property   | Description                              |
|------------|------------------------------------------|
| HP         | Hit points; unit dies at 0               |
| ATK        | Attack damage dealt in combat            |
| Movement   | Grid squares the unit can move per turn  |
| Range      | Attack range in grid squares             |
| Ability    | Unique ability, usable once per turn     |
| Cost       | Summoning cost deducted from player life |

### Sorcery Cards

- One-time use spells played from hand
- Casting cost deducted from player life before effect resolves
- Discarded after use

## Win Condition

A player is eliminated when their life reaches 0. Last player standing wins.

## Architecture Principles

- **Authoritative Server** — One player hosts; all game state lives on server
- **Intent-Based Networking** — Clients send intents, server validates and resolves
- **Pure Logic Engines** — Game engine, card engine, combat engine, ability engine, and turn engine are pure functions with zero side effects, 100% testable
- **Strict TDD** — All systems built test-first
- **Phase-Gated Development** — No phase begins until the prior phase is fully validated
