# Mugen — TDD Strategy

## Methodology

All development follows strict **Red-Green-Refactor** TDD:

1. **Red** — Write a failing test that describes the desired behavior
2. **Green** — Write the minimal code to make the test pass
3. **Refactor** — Clean up without changing behavior; all tests must stay green

No production code may exist without a corresponding test written **before** the implementation.

---

## Testing Framework

- **Vitest** — Primary test runner for all packages
- **Workspace mode** — `vitest.workspace.ts` configures per-package test settings
- Tests live in `__tests__/` directories colocated with source, or in a top-level `__tests__/` per package

---

## Test Categories

### 1. Unit Tests (Engines — `packages/shared`)

**Coverage Target:** 100%

These test pure logic engines in isolation. No mocks needed (engines are pure functions).

| Engine          | Test Focus                                                |
|-----------------|-----------------------------------------------------------|
| Game Engine     | State transitions, phase progression, player management   |
| Card Engine     | Deck creation, shuffling, drawing, hand management        |
| Combat Engine   | Dual damage, overflow, death, double KO, ability modifiers|
| Ability Engine  | Ability resolution, once-per-turn tracking, cost checks   |
| Turn Engine     | Phase enforcement, turn order, rotation tracking          |
| Resource Engine | Life deduction, insufficient life, cost validation        |
| PreGameManager  | Team selection, cost ≤ 40, exactly 6 units, lock-in      |

**Pattern:**
```typescript
describe('CombatEngine', () => {
  describe('resolveCombat', () => {
    it('should apply dual damage to both units', () => {
      // Arrange
      const attacker = createUnit({ hp: 10, atk: 5 });
      const defender = createUnit({ hp: 8, atk: 3 });

      // Act
      const result = resolveCombat(attacker, defender);

      // Assert
      expect(result.attacker.hp).toBe(7);  // 10 - 3
      expect(result.defender.hp).toBe(3);  // 8 - 5
    });
  });
});
```

### 2. Integration Tests (Server — `packages/server`)

**Coverage Target:** 90%+

Test the server's action resolver, which wires engines together with WebSocket events.

| Area            | Test Focus                                                |
|-----------------|-----------------------------------------------------------|
| Action Resolver | Intent validation, engine invocation, state update        |
| Gateway         | WebSocket event routing, authentication, error handling   |
| Lobby           | Room creation, player join/leave, ready state             |

**Tools:** Vitest + Socket.IO client (real WebSocket connections in tests)

### 3. Integration Tests (Client — `packages/client`)

**Coverage Target:** 80%+

| Area            | Test Focus                                                |
|-----------------|-----------------------------------------------------------|
| Network Layer   | Intent emission, state reception, reconnection            |
| Store           | Zustand state updates from server events                  |
| Components      | React component rendering given game state                |

**Tools:** Vitest + React Testing Library

---

## Test Naming Convention

```
[Module].[Function] — [Scenario] — [Expected Outcome]
```

Examples:
- `CombatEngine.resolveCombat — both units survive — returns updated HP for both`
- `CombatEngine.resolveCombat — defender dies — returns overflow damage`
- `PreGameManager.validateTeam — total cost exceeds 40 — returns error`

---

## Edge Cases (Mandatory Coverage)

### Combat
- Both units die (double KO)
- Exactly lethal damage (HP = 0, no overflow)
- Overflow damage to player life
- Attacker dies from counterattack
- Ability-modified combat (e.g., no counterattack)

### Life / Resource
- Summoning cost exactly equals remaining life
- Summoning cost exceeds remaining life (blocked)
- Multiple costs in one turn reducing life to 1
- Cost causes player death (life = 0)
- Sorcery cast cost validation

### Turn Flow
- Moving more than 3 units (blocked)
- Moving a unit beyond its movement speed (blocked)
- Using ability twice in same turn (blocked)
- Attacking before move phase complete (depends on rules)
- Attacking a unit out of range (blocked)
- Turn progression with 2, 3, and 4 players
- Full rotation tracking for draw mechanics

### Pre-Game
- Selecting more than 6 units
- Selecting fewer than 6 units
- Total cost = 40 (edge, should pass)
- Total cost = 41 (edge, should fail)
- Duplicate unit selection (if restricted)
- Changing selection after lock-in (blocked)

### Reserve Deployment
- Unit dies during owner's turn → reserve locked until next turn
- Unit dies during opponent's turn → reserve available
- Multiple units die in same turn
- No reserve units available

### Multiplayer / Networking
- Player disconnects mid-turn
- Player reconnects to ongoing game
- Out-of-turn action from client (rejected)
- Malformed intent payload (rejected)
- Duplicate intent submission
- Network latency simulation

---

## Test Organization

```
packages/shared/__tests__/
├── engines/
│   ├── game.test.ts
│   ├── card.test.ts
│   ├── combat.test.ts
│   ├── ability.test.ts
│   ├── turn.test.ts
│   └── resource.test.ts
├── pregame/
│   └── pregame-manager.test.ts
└── types/
    └── type-guards.test.ts

packages/server/__tests__/
├── resolver/
│   └── action-resolver.test.ts
├── gateway/
│   └── websocket-gateway.test.ts
└── lobby/
    └── lobby-manager.test.ts

packages/client/__tests__/
├── network/
│   └── socket-client.test.ts
├── store/
│   └── game-store.test.ts
└── components/
    └── (component tests)
```

---

## Continuous Validation

Every phase completion requires:

1. `pnpm test` — all tests pass
2. `pnpm typecheck` — zero TypeScript errors
3. `pnpm lint` — zero lint errors
4. Coverage report reviewed — targets met

---

## Test Data Factories

We will create factory functions for common test data:

```typescript
// packages/shared/__tests__/factories.ts
export function createUnit(overrides?: Partial<UnitCard>): UnitCard { ... }
export function createPlayer(overrides?: Partial<PlayerState>): PlayerState { ... }
export function createGameState(overrides?: Partial<GameState>): GameState { ... }
export function createBoard(overrides?: Partial<BoardState>): BoardState { ... }
```

These ensure tests are concise, readable, and maintainable.

---

## TDD Workflow Per Feature

```
1. Read the phase .md requirements
2. Write test file with describe/it blocks (tests FAIL — RED)
3. Run `pnpm test` to confirm failures
4. Implement minimal code to pass tests (GREEN)
5. Run `pnpm test` to confirm passes
6. Refactor for clarity and performance
7. Run `pnpm test` to confirm still passing
8. Update phase .md checklist
9. Commit with message: "feat(engine): [description] — tests passing"
```
