# Mugen — Architecture

## Architecture Decision Records

### ADR-001: Authoritative Server Model

**Decision:** The host player runs an authoritative game server. All game state is owned and validated by the server. Clients are thin and send only intents.

**Rationale:** Prevents cheating, ensures consistency across 2–4 players, and simplifies conflict resolution. The host's machine acts as both a client and the server.

**Consequences:** Host has zero latency advantage (must be handled). Server must validate every action before broadcasting state.

### ADR-002: Pure Logic Engines

**Decision:** All game logic is implemented as pure, side-effect-free modules that take state + action and return new state. No I/O, no networking, no UI code in engines.

**Rationale:** Enables 100% unit test coverage, deterministic replay, and clean separation of concerns. Logic can be tested without mocking network or UI.

**Consequences:** Requires a clear adapter/integration layer between engines and the networking/UI layers.

### ADR-003: Intent-Based Client Communication

**Decision:** Clients never mutate game state directly. They emit intents (e.g., `MOVE_UNIT`, `USE_ABILITY`, `ATTACK`). The server validates intents against current state and resolves them.

**Rationale:** Single source of truth on server. Clients cannot desync or cheat by sending invalid state.

### ADR-004: Monorepo with Shared Types

**Decision:** Use a monorepo structure with a shared `packages/shared` module containing all types, interfaces, constants, and pure logic engines. Both server and client depend on shared.

**Rationale:** Prevents type drift between client and server. Engines are consumed by both sides.

### ADR-005: WebSocket Communication

**Decision:** Use Socket.IO over WebSockets for real-time bidirectional communication.

**Rationale:** Socket.IO provides automatic reconnection, room management, and fallback transports. Well-suited for turn-based multiplayer with real-time state sync.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    HOST MACHINE                          │
│                                                         │
│  ┌──────────────────────────────────────────────┐       │
│  │              GAME SERVER (Fastify)            │       │
│  │                                               │       │
│  │  ┌─────────────┐  ┌─────────────────────┐    │       │
│  │  │ WebSocket   │  │   Game State Store   │    │       │
│  │  │ Gateway     │  │                       │    │       │
│  │  └──────┬──────┘  └──────────┬────────────┘    │       │
│  │         │                     │                 │       │
│  │  ┌──────▼─────────────────────▼──────────┐     │       │
│  │  │         ACTION RESOLVER               │     │       │
│  │  │  (validates intents, calls engines)   │     │       │
│  │  └──────┬────────────────────────────────┘     │       │
│  │         │                                      │       │
│  │  ┌──────▼──────────────────────────────┐       │       │
│  │  │         PURE LOGIC ENGINES          │       │       │
│  │  │                                      │       │       │
│  │  │  ┌────────────┐ ┌────────────────┐  │       │       │
│  │  │  │ Game Engine │ │ Card Engine    │  │       │       │
│  │  │  └────────────┘ └────────────────┘  │       │       │
│  │  │  ┌────────────┐ ┌────────────────┐  │       │       │
│  │  │  │Combat Eng. │ │ Ability Engine │  │       │       │
│  │  │  └────────────┘ └────────────────┘  │       │       │
│  │  │  ┌────────────┐ ┌────────────────┐  │       │       │
│  │  │  │ Turn Engine │ │ Resource Eng.  │  │       │       │
│  │  │  └────────────┘ └────────────────┘  │       │       │
│  │  │  ┌────────────────────────────────┐ │       │       │
│  │  │  │ PreGameManager                 │ │       │       │
│  │  │  └────────────────────────────────┘ │       │       │
│  │  └─────────────────────────────────────┘       │       │
│  └──────────────────────────────────────────────┘       │
│                                                         │
│  ┌──────────────────────────────────────────────┐       │
│  │           HOST CLIENT (Browser)               │       │
│  │  React + Phaser.js + Zustand                  │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘

         ▲ WebSocket ▲           ▲ WebSocket ▲
         │           │           │           │
    ┌────┴────┐ ┌────┴────┐ ┌───┴─────┐
    │Client 2 │ │Client 3 │ │Client 4 │
    │(Browser)│ │(Browser)│ │(Browser)│
    └─────────┘ └─────────┘ └─────────┘
```

---

## Module Breakdown

### Shared Package (`packages/shared`)

Contains all pure logic and shared types. Zero dependencies on Node.js or browser APIs.

| Module            | Responsibility                                                |
|-------------------|---------------------------------------------------------------|
| `types/`          | All TypeScript interfaces, enums, constants                   |
| `engines/game`    | Top-level game state machine, phase transitions               |
| `engines/card`    | Card definitions, deck management, hand management            |
| `engines/combat`  | Dual damage resolution, overflow calculation, death checks    |
| `engines/ability` | Ability resolution, once-per-turn tracking, cost validation   |
| `engines/turn`    | Turn progression, phase enforcement (move→ability→attack)     |
| `engines/resource`| Life-as-resource management, cost deduction, validation       |
| `pregame/`        | PreGameManager: team selection, cost validation, lock-in      |

### Server Package (`packages/server`)

| Module            | Responsibility                                                |
|-------------------|---------------------------------------------------------------|
| `server.ts`       | Fastify server bootstrap, Socket.IO setup                     |
| `gateway/`        | WebSocket event handlers, intent routing                      |
| `resolver/`       | Action resolver: validates intents via engines, updates state  |
| `state/`          | In-memory game state store                                    |
| `lobby/`          | Room/lobby management, player connection tracking             |

### Client Package (`packages/client`)

| Module            | Responsibility                                                |
|-------------------|---------------------------------------------------------------|
| `App.tsx`         | Root React component                                          |
| `scenes/`         | Phaser.js game scenes (board, units, effects)                 |
| `store/`          | Zustand state stores (local UI state + server-synced state)   |
| `network/`        | Socket.IO client, intent emitters, state receivers            |
| `components/`     | React UI components (hand, life display, turn indicator)      |
| `hooks/`          | Custom React hooks for game state                             |

---

## Data Flow

### Client → Server (Intent)

```
1. Player clicks "Move Unit to (3,4)"
2. Client emits intent: { type: "MOVE_UNIT", unitId: "u1", target: { x: 3, y: 4 } }
3. Server receives intent via WebSocket gateway
4. Action Resolver validates:
   a. Is it this player's turn?
   b. Is the game in the Move phase?
   c. Does unit u1 belong to this player?
   d. Is (3,4) within movement range?
   e. Is (3,4) unoccupied?
5. If valid: engine processes move, state updated, new state broadcast
6. If invalid: error event sent back to client
```

### Server → Clients (State Update)

```
1. Engine produces new GameState
2. Server broadcasts sanitized state to all clients
   (each client receives only information they should see)
3. Clients update local Zustand store
4. React/Phaser re-renders
```

---

## State Management

### Server State (Source of Truth)

```typescript
interface GameState {
  id: string;
  phase: GamePhase;         // PRE_GAME | IN_PROGRESS | ENDED
  turnPhase: TurnPhase;     // MOVE | ABILITY | ATTACK | END
  currentPlayerIndex: number;
  players: PlayerState[];
  board: BoardState;
  turnNumber: number;
  turnRotation: number;     // tracks full rotations for draw logic
}
```

### Client State (Derived)

Clients hold a read-only projection of the game state plus local UI state (selected unit, hover target, animations).

---

## Key Constraints

1. **No client-side game logic mutation** — all mutations happen server-side via engines
2. **Engines are pure functions** — `(state, action) => newState`
3. **All engines must have 100% test coverage** before integration
4. **WebSocket reconnection** — clients must gracefully handle disconnects and rejoin
5. **Turn timer** — optional future feature, not in initial phases
