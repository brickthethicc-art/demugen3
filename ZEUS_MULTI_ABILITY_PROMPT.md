## Prompt: Implement Zeus Multi-Ability Selection + Per-Ability Cooldowns (Strict Scope)

You are working in an existing codebase.  
Follow these instructions exactly.  
Do **not** go out of scope.

### 0) Hard Scope Rules (Must Follow)

- Only touch **backend** and **frontend** code related to this feature.
- Backend includes:
  - `packages/server/**`
  - `packages/shared/**` (only types/engines/contracts needed for backend/frontend integration)
- Frontend includes:
  - `packages/client/**`
- Do **not** touch unrelated UI systems (HUD layout, perspective, mobile mode, animation systems not required for this task).
- Do **not** change game art, card framework visuals, deck rules, or unrelated gameplay features.
- Do **not** implement AoE/multi-target special Zeus flavor behavior yet.
- Make additive, minimal changes. Preserve backward compatibility.

If you find work outside this scope, stop and skip it.

---

## 1) Goal

Add support for:
1. Selecting one ability from `UnitCard.abilities` during ABILITY phase.
2. Sending selected `abilityId` from client to server.
3. Enforcing per-ability cooldowns on the server.
4. Keeping all old single-ability units working exactly as before.

---

## 2) Design First (Before Coding)

Write a short implementation checklist with these data-flow steps:

1. User picks ability in `UnitActionMenu`.
2. Chosen `abilityId` stored in client state.
3. Targeting logic uses chosen ability (not always `card.ability`).
4. Intent sends `abilityId` over wire.
5. Resolver forwards `abilityId` to turn engine.
6. Turn engine resolves ability by id, validates cooldown, executes ability.
7. Ability use writes cooldown to `unit.abilityCooldowns`.
8. Start of owner turn decrements cooldown map.

Then code in small chunks below.

---

## 3) Backend/Shared Coding Steps (Portion by Portion)

### Step 3.1: Types and Intent Payload
Update:

- `packages/shared/src/types/index.ts`  
  Add to `UnitInstance`:
  - `abilityCooldowns?: Record<string, number>`

- `packages/shared/src/types/actions.ts`  
  Add to `UseAbilityIntent`:
  - `abilityId?: string`

Keep optional for backward compatibility.

---

### Step 3.2: Ability Engine API
Update:

- `packages/shared/src/engines/ability/index.ts`

Add/adjust function signature to support explicit ability input:
- `useAbility(unit, ability, target, walls?)`

Behavior:
- Use passed `ability` for logic instead of always `unit.card.ability`.
- Set `hasUsedAbilityThisTurn = true`.
- If `ability.cooldown > 0`, set `unit.abilityCooldowns[ability.id] = ability.cooldown`.

Keep legacy compatibility path so old callers/tests still work.

---

### Step 3.3: Turn Engine Selection + Cooldown Enforcement
Update:

- `packages/shared/src/engines/turn/index.ts`

In `processAbility`:
1. Accept `abilityId` argument.
2. Resolve selected ability:
   - If `abilityId` exists: find in `unit.card.abilities` (fallback array with primary ability if needed).
   - If missing: use legacy `unit.card.ability`.
3. If not found, reject with clear error.
4. Reject if `unit.abilityCooldowns[selectedAbility.id] > 0` with turns remaining.
5. Keep existing one-ability-per-turn check (`hasUsedAbilityThisTurn`).
6. Pass selected ability into `useAbility`.
7. Ensure self-target/adjacent checks use selected ability metadata.

In turn start logic:
- Decrement cooldowns only for active player's units.
- Clamp at 0.
- Remove zero entries from map.

---

### Step 3.4: Server Resolver and Sanitization
Update:

- `packages/server/src/resolver/action-resolver.ts`
  - Forward `intent.abilityId ?? null` into `TurnEngine.processAbility(...)`.

- `packages/server/src/resolver/sanitize.ts`
  - Ensure `abilityCooldowns` stays visible (not hidden) in sanitized unit data.

---

## 4) Frontend Coding Steps (Portion by Portion)

### Step 4.1: Action Hook
Update:

- `packages/client/src/hooks/useGameActions.ts`
  - `sendAbility(unitId, abilityId?, targetId?, targetOwnerId?)`
  - Include `abilityId` in intent payload.

---

### Step 4.2: Ability Picker UI
Update:

- `packages/client/src/components/UnitActionMenu.tsx`

Rules:
- If unit has multiple abilities, render one button per ability.
- Show cooldown badge per ability from `selectedUnit.abilityCooldowns?.[ability.id]`.
- Disable button if:
  - `selectedUnit.hasUsedAbilityThisTurn`, or
  - selected ability cooldown > 0, or
  - no valid targets for that ability.
- On click:
  - set `selectedAbilityId` in client state.
  - enter existing targeting flow for that selected ability.
- Clear `selectedAbilityId` on:
  - menu close,
  - ability mode exit,
  - after successful send.

---

### Step 4.3: Targeting Logic Uses Chosen Ability
Update:

- `packages/client/src/logic/ability-targeting.ts` (or current target helper location)
- `packages/client/src/scenes/GameScene.ts`

Requirements:
- `getAbilityTargets(...)` accepts optional `ability`.
- Default remains legacy `selectedUnit.card.ability`.
- When ability is provided, use it for range/type/self-target checks.
- `GameScene` emits intent with selected `abilityId`.

---

### Step 4.4: Cooldown Display in Card UI
Update:

- `packages/client/src/components/HoverPanel.tsx`
- `packages/client/src/components/CardFront.tsx`

When a live `UnitInstance` is available and card has abilities:
- show small `Nt` cooldown chip next to each ability if cooldown > 0.
- no chip for 0.

---

## 5) Testing and Validation (Required)

Add focused tests only; do not rewrite unrelated assertions.

### Shared tests
- `packages/shared/__tests__/engines/turn.test.ts`
- `packages/shared/__tests__/engines/ability.test.ts`

Add tests for:
1. Ability id selection routes correct ability behavior.
2. Cooldown blocks ability use.
3. Invalid `abilityId` returns clear error.
4. `useAbility` writes cooldown map.
5. Start-turn cooldown decrement works only for active player units.
6. Legacy behavior works when `abilityId` omitted for single-ability units.

### Client tests
- `packages/client/__tests__/components/UnitActionMenu.test.tsx` (create if missing)

Add tests for:
7. Zeus shows 3 ability buttons; single-ability unit shows 1.
8. Clicking Zeus ability stores `selectedAbilityId` and sends it in intent.
9. Ability button disabled when its cooldown > 0.

---

## 6) Final Validation Checklist

Before finishing, verify all are true:

- Zeus can select different abilities during ABILITY phase.
- Chosen ability sends `abilityId` and executes correctly.
- Per-ability cooldown is enforced and decremented per owner turn.
- One-ability-per-turn rule still works.
- Single-ability units behave exactly as before.
- Only scoped backend/frontend files changed.
- Run tests (`pnpm test` or targeted suites first, then full suite if feasible).

---

## 7) Out-of-Scope TODO Markers (Do Not Implement Now)

Only leave TODO notes where relevant for future work:

- True multi-target/AoE for Zeus abilities.
- Conditional bonus damage rules.
- Ability-lock debuff system.
- Push-back/stun/flying interaction details.

Do not implement these in this task.
