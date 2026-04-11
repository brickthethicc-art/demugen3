# Mugen — Online Multiplayer Strategy Card Game

A turn-based strategy card game supporting 2–4 online players. Cards are placed on a grid as tactical units with HP, ATK, Movement, Range, and Abilities. Life serves as both a victory condition and a resource for summoning units and casting sorceries.

## Documentation

All design documents live in [`/docs`](./docs/):

- [Overview](./docs/overview.md) — Game vision, rules, and mechanics
- [Architecture](./docs/architecture.md) — System design and ADRs
- [Tech Stack](./docs/tech-stack.md) — Technology choices and monorepo structure
- [TDD Strategy](./docs/tdd-strategy.md) — Testing methodology and standards

### Phase Plans

- [Phase 1](./docs/phases/phase-1.md) — Project Scaffold + Core Types + Card Engine
- [Phase 2](./docs/phases/phase-2.md) — Resource Engine + Game Engine + Board System
- [Phase 3](./docs/phases/phase-3.md) — Combat Engine + Ability Engine
- [Phase 4](./docs/phases/phase-4.md) — Turn Engine + Full Game Flow Integration
- [Phase 5](./docs/phases/phase-5.md) — Networking Layer + Multiplayer Server
- [Phase 6](./docs/phases/phase-6.md) — UI + Frontend Integration

## Development

```bash
pnpm install       # Install all dependencies
pnpm test          # Run all tests
pnpm typecheck     # Type check all packages
```

## Rules

- **Documentation-first:** Docs updated before code
- **TDD:** Tests written before implementation
- **Phase-gated:** No phase starts until prior phase is complete