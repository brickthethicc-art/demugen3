# Mugen — Tech Stack

## Overview

Mugen uses a TypeScript-first monorepo architecture with shared pure logic, a Node.js game server, and a React + Phaser.js browser client.

---

## Monorepo Structure

```
demugen3/
├── docs/                    # Documentation (this directory)
├── packages/
│   ├── shared/              # Pure logic engines, types, constants
│   │   ├── src/
│   │   │   ├── types/       # All TypeScript interfaces & enums
│   │   │   ├── engines/     # Pure game logic engines
│   │   │   │   ├── game/
│   │   │   │   ├── card/
│   │   │   │   ├── combat/
│   │   │   │   ├── ability/
│   │   │   │   ├── turn/
│   │   │   │   └── resource/
│   │   │   ├── pregame/     # PreGameManager
│   │   │   └── constants/   # Game constants (grid size, max life, etc.)
│   │   ├── __tests__/       # All unit tests for shared logic
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── server/              # Game server (Fastify + Socket.IO)
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── gateway/     # WebSocket handlers
│   │   │   ├── resolver/    # Action validation & resolution
│   │   │   ├── state/       # In-memory state management
│   │   │   └── lobby/       # Room & player management
│   │   ├── __tests__/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── client/              # Browser client (React + Phaser)
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   ├── scenes/      # Phaser game scenes
│       │   ├── store/       # Zustand stores
│       │   ├── network/     # Socket.IO client
│       │   ├── components/  # React UI components
│       │   └── hooks/       # Custom hooks
│       ├── public/
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── tailwind.config.js
├── package.json             # Root workspace config
├── tsconfig.base.json       # Shared TS config
└── vitest.workspace.ts      # Vitest workspace config
```

---

## Technology Choices

### Language

| Choice       | Rationale                                             |
|-------------|-------------------------------------------------------|
| TypeScript   | Strict mode enabled. Type safety across all packages. |
| ES Modules   | Modern module system, tree-shakeable.                 |

### Frontend

| Technology    | Version  | Purpose                                       |
|--------------|----------|-----------------------------------------------|
| React        | 18.x     | UI framework for HUD, menus, lobby            |
| Vite         | 5.x      | Fast dev server, HMR, build tool              |
| TypeScript   | 5.x      | Strict mode                                   |
| TailwindCSS  | 3.x      | Utility-first styling                         |
| Zustand      | 4.x      | Lightweight state management for UI           |
| Phaser.js    | 3.x      | 2D game rendering (board, units, animations)  |

### Backend

| Technology    | Version  | Purpose                                       |
|--------------|----------|-----------------------------------------------|
| Node.js      | 20.x LTS| Runtime                                       |
| Fastify      | 4.x      | HTTP server (lobby API, health checks)        |
| Socket.IO    | 4.x      | WebSocket layer (real-time game communication)|
| TypeScript   | 5.x      | Strict mode                                   |

### Testing

| Technology    | Version  | Purpose                                       |
|--------------|----------|-----------------------------------------------|
| Vitest       | 1.x      | Unit & integration testing (fast, Vite-native)|
| Supertest    | 6.x      | HTTP endpoint testing for Fastify             |
| socket.io-client | 4.x | WebSocket integration testing                 |

### Package Management

| Technology    | Purpose                                       |
|--------------|-----------------------------------------------|
| pnpm         | Workspace-aware package manager, fast installs|

---

## TypeScript Configuration

### Base (`tsconfig.base.json`)

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": false
  }
}
```

Key strict settings:
- `strict: true` — enables all strict checks
- `noUncheckedIndexedAccess: true` — forces null checks on array/object index access

---

## Dependency Graph

```
packages/client  ──depends──▶  packages/shared
packages/server  ──depends──▶  packages/shared
packages/shared  ──depends──▶  (nothing — pure logic, zero external deps)
```

The `shared` package has **zero runtime dependencies**. It is pure TypeScript logic only.

---

## Development Tooling

| Tool          | Purpose                                       |
|--------------|-----------------------------------------------|
| ESLint       | Linting with TypeScript-aware rules           |
| Prettier     | Code formatting                               |
| pnpm         | Workspace management                          |
| Vitest UI    | Test runner with browser-based UI             |

---

## Networking Protocol

### Transport

- **Primary:** WebSocket via Socket.IO
- **Fallback:** Long-polling (Socket.IO automatic)

### Message Format

All messages are JSON-serialized TypeScript objects.

```typescript
// Client → Server
interface ClientIntent {
  type: IntentType;
  payload: Record<string, unknown>;
  timestamp: number;
}

// Server → Client
interface ServerEvent {
  type: EventType;
  payload: Record<string, unknown>;
  sequence: number;  // monotonically increasing for ordering
}
```

### Connection Flow

1. Host starts server (Fastify + Socket.IO)
2. Host client connects to `ws://localhost:<port>`
3. Remote clients connect to `ws://<host-ip>:<port>`
4. Server assigns player IDs, manages lobby
5. Once all players ready → pre-game phase begins
6. After team selection locked → game starts

---

## Build & Run

### Development

```bash
# Install dependencies
pnpm install

# Run tests (all packages)
pnpm test

# Run server (dev mode)
pnpm --filter server dev

# Run client (dev mode)
pnpm --filter client dev
```

### Production

```bash
# Build all packages
pnpm build

# Start server
pnpm --filter server start
```
