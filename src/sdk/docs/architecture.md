# Elysium Engine — Architecture Overview

This document describes the internal architecture of the Elysium Engine, including the cognitive module system, event bus, runtime orchestrator, plugin lifecycle, LOD/chunk system, performance scheduler, file structure, and testing and benchmarking strategies.

---

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [CognitiveEventBus — Central Pub/Sub](#cognitiveeventbus--central-pubsub)
- [Cognitive Modules (21, Grouped by Phase)](#cognitive-modules-21-grouped-by-phase)
- [ElysiumRuntime Orchestrator](#elysiumruntime-orchestrator)
- [ElysiumAPI Public Facade](#elysiumapi-public-facade)
- [PluginManager Lifecycle](#pluginmanager-lifecycle)
- [DebugPanelRegistry](#debugpanelregistry)
- [Data Flow: Events → Modules → State Changes](#data-flow-events--modules--state-changes)
- [LOD and Chunk System](#lod-and-chunk-system)
- [Performance Scheduler](#performance-scheduler)
- [File Structure](#file-structure)
- [Testing Strategy](#testing-strategy)
- [Benchmark Strategy](#benchmark-strategy)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Game / Host Application                          │
│                                                                          │
│                        ┌──────────────────────┐                          │
│                        │      ElysiumAPI      │  ← Public facade          │
│                        │   (Public SDK Layer)  │                          │
│                        └──────────┬───────────┘                          │
│                                   │                                      │
│                        ┌──────────▼───────────┐                          │
│                        │   ElysiumRuntime     │  ← Orchestrator           │
│                        │   (Scheduler +       │                          │
│                        │    Module Registry)  │                          │
│                        └──────────┬───────────┘                          │
│                                   │                                      │
│          ┌────────────────────────┼────────────────────────┐             │
│          │                        │                        │             │
│  ┌───────▼────────┐  ┌────────────▼────────────┐  ┌────────▼─────────┐   │
│  │ CognitiveEvent │  │   21 Cognitive Modules  │  │   PluginManager   │   │
│  │     Bus        │  │  (Phase 1–5 grouped)   │  │  (Load/Unload/    │   │
│  │  (Pub/Sub)     │  │                         │  │   Permissions)    │   │
│  └───────┬────────┘  └────────────┬────────────┘  └────────┬─────────┘   │
│          │                        │                        │             │
│          │                ┌───────▼────────┐               │             │
│          │                │  LOD System   │               │             │
│          │                │  + Chunks     │               │             │
│          │                └───────────────┘               │             │
│          │                                                  │             │
│          │                ┌───────────────┐                │             │
│          │                │ DebugPanel    │◄───────────────┘             │
│          │                │ Registry      │                              │
│          │                └───────────────┘                              │
│          │                                                               │
│  ┌───────▼──────────────────────────────────────────────┐                │
│  │              NPC State + World State                  │                │
│  │         (Shared Mutable Simulation State)            │                │
│  └─────────────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────────────┘
```

### Layer Summary

| Layer | Responsibility |
|---|---|
| **ElysiumAPI** | Public facade. Exposes all SDK methods to game code. Validates inputs, delegates to runtime. |
| **ElysiumRuntime** | Internal orchestrator. Manages the scheduler, module registry, and tick loop. |
| **CognitiveEventBus** | Central pub/sub. All inter-module communication flows through events. |
| **Cognitive Modules** | 21 domain-specific modules that read events and mutate NPC/world state. |
| **PluginManager** | Loads/unloads plugins, enforces permissions, injects plugin context. |
| **LOD System** | Determines simulation fidelity per NPC based on distance from player. |
| **DebugPanelRegistry** | Optional introspection UIs for development tools. |
| **NPC / World State** | Shared mutable state that modules read from and write to. |

---

## CognitiveEventBus — Central Pub/Sub

The `CognitiveEventBus` is the communication backbone of the engine. No module calls another module directly. Instead, all communication flows through typed events on the bus.

### Design Principles

1. **Decoupled** — Modules do not hold references to each other. They subscribe to event types and react independently.
2. **Typed** — Each event type has a defined payload shape. Subscribers receive a `CognitiveEvent` with a `type` field and arbitrary payload data.
3. **Synchronous within a tick** — Events emitted during a tick are delivered to subscribers before the tick completes. This ensures deterministic ordering.
4. **Wildcard support** — Subscribers can register with `"*"` to receive all events (used by debug panels, logging, and telemetry).

### API Surface

```typescript
class CognitiveEventBus {
  emit(type: string, payload: Record<string, unknown>): void;
  subscribe(type: string, callback: (event: CognitiveEvent) => void): () => void;
  unsubscribe(type: string, callback: (event: CognitiveEvent) => void): boolean;
  clear(): void;
  getEventCount(): number;
}
```

### Event Lifecycle

```
Module A emits event
       │
       ▼
┌──────────────┐
│  Event Bus   │
│  (dispatch)  │
└──────┬───────┘
       │
       ├──► Module B (subscriber) → reads, mutates state
       ├──► Module C (subscriber) → emits follow-up event ──► (back to bus)
       ├──► Plugin (subscriber) → custom logic
       └──► Debug Panel (wildcard) → renders snapshot
```

Follow-up events emitted by subscribers are queued and dispatched after the current event's subscribers complete, preventing infinite loops within a single dispatch cycle.

---

## Cognitive Modules (21, Grouped by Phase)

The engine's intelligence is divided into **21 cognitive modules**, each responsible for a specific domain of NPC behavior. Modules are grouped by the development phase in which they were introduced.

### Phase 1 — Foundation (5 modules)

| # | Module | ID | Responsibility |
|---|---|---|---|
| 1 | Identity | `identity` | NPC identity, naming, persistent traits. |
| 2 | Perception | `perception` | Sensory input: what NPCs can see, hear, smell within range. |
| 3 | Memory | `memory` | Short-term and long-term memory storage and recall. |
| 4 | Needs | `needs` | Physiological needs (hunger, thirst, rest, safety). |
| 5 | Movement | `movement` | Pathfinding, navigation, spatial positioning. |

### Phase 2 — Social (4 modules)

| # | Module | ID | Responsibility |
|---|---|---|---|
| 6 | Relationships | `relationships` | NPC-to-NPC relationship tracking, affinity, trust. |
| 7 | Dialogue | `dialogue` | Speech generation, conversation state, dialogue trees. |
| 8 | Factions | `factions` | Faction membership, reputation, inter-faction relations. |
| 9 | Social Groups | `social_groups` | Group formation, roles, hierarchy within groups. |

### Phase 3 — Intelligence (4 modules)

| # | Module | ID | Responsibility |
|---|---|---|---|
| 10 | Goals | `goals` | Goal selection, priority management, goal lifecycle. |
| 11 | GOAP Planner | `goap_planner` | Action planning: generates action sequences to achieve goals. |
| 12 | Decision | `decision` | Conflict resolution between competing goals and actions. |
| 13 | Learning | `learning` | Behavioral adaptation based on past outcomes. |

### Phase 4 — World (4 modules)

| # | Module | ID | Responsibility |
|---|---|---|---|
| 14 | Economy | `economy` | Dynamic pricing, supply/demand, trade execution. |
| 15 | World Events | `world_events` | Global events (weather, disasters, festivals) that affect all NPCs. |
| 16 | Territory | `territory` | Spatial territory claims, boundaries, ownership. |
| 17 | Time | `time` | Day/night cycle, scheduling, time-based behavior modifiers. |

### Phase 5 — Advanced (4 modules)

| # | Module | ID | Responsibility |
|---|---|---|---|
| 18 | Emotion | `emotion` | Emotional state modeling, mood transitions, emotional contagion. |
| 19 | Personality | `personality` | Big Five trait modeling, behavioral tendency computation. |
| 20 | Narrative | `narrative` | Story arc generation, quest hooks, emergent narrative tracking. |
| 21 | Meta-Cognition | `meta_cognition` | Self-reflection, strategy evaluation, long-term planning. |

### Module Interface

Every module implements a common interface:

```typescript
interface CognitiveModule {
  id: string;
  phase: 1 | 2 | 3 | 4 | 5;

  init(runtime: ElysiumRuntime): void;
  onTick(runtime: ElysiumRuntime, deltaTime: number): void;
  onEvent(runtime: ElysiumRuntime, event: CognitiveEvent): void;
  shutdown(): void;
}
```

Modules are registered with the runtime at startup. The runtime calls `init()` once, then `onTick()` every tick and `onEvent()` whenever a subscribed event fires.

---

## ElysiumRuntime Orchestrator

The `ElysiumRuntime` is the internal engine that drives the simulation. It owns the tick loop, module registry, event bus, scheduler, and LOD system.

### Responsibilities

| Responsibility | Description |
|---|---|
| **Module Registry** | Holds all 21 cognitive modules. Manages init/shutdown lifecycle. |
| **Tick Loop** | Calls `onTick()` on each active module in a fixed order per tick. |
| **Event Dispatch** | Routes events from the bus to subscribed modules and plugins. |
| **Scheduler Integration** | Works with the `PerformanceScheduler` to respect tick budgets. |
| **LOD Integration** | Consults the `LODSystem` to determine which NPCs each module should process. |
| **State Ownership** | Holds the canonical NPC and world state. |

### Tick Loop Sequence

```
┌─────────────────────────────────────────────────────────┐
│                     ElysiumRuntime                       │
│                     tick() sequence                      │
│                                                          │
│  1. PerformanceScheduler.checkBudget()                   │
│     └─ If over budget, yield and skip non-critical work   │
│                                                          │
│  2. LODSystem.update(playerPosition)                      │
│     └─ Recompute LOD levels for all NPCs                  │
│                                                          │
│  3. For each module (in phase order):                     │
│     ├─ module.onTick(runtime, dt)                         │
│     │   ├─ Read events from bus                           │
│     │   ├─ Process NPCs at full LOD                        │
│     │   ├─ Process NPCs at reduced LOD (throttled)        │
│     │   └─ Emit follow-up events to bus                   │
│     └─ (skip dormant NPCs)                                │
│                                                          │
│  4. PluginManager.onTick() for all loaded plugins         │
│                                                          │
│  5. DebugPanelRegistry.refresh() (if enabled)             │
│                                                          │
│  6. currentTick++                                         │
│  7. Update stats (tick time, event count, etc.)          │
└─────────────────────────────────────────────────────────┘
```

### Module Execution Order

Modules execute in phase order (1 → 5) and in the order listed within each phase. This ensures that foundational systems (perception, memory) update before higher-order systems (goals, planning) read their outputs.

---

## ElysiumAPI Public Facade

The `ElysiumAPI` is the only class game code should interact with directly. It wraps the runtime with a clean, validated, and documented interface.

```
┌──────────────────────────────────────────────────┐
│                   ElysiumAPI                      │
│                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │ NPC Methods │  │ Goal Methods│  │ Sim Ctrl   │  │
│  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │
│         │                │               │        │
│  ┌──────▼────────────────▼───────────────▼─────┐  │
│  │            Input Validation Layer            │  │
│  │   (type checks, bounds, NPC existence,       │  │
│  │    permission checks for plugins)            │  │
│  └──────────────────────┬──────────────────────┘  │
│                         │                         │
│  ┌──────────────────────▼──────────────────────┐  │
│  │           ElysiumRuntime (delegate)          │  │
│  └─────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

The facade performs:

- **Type validation** — Ensures arguments match expected types before delegating.
- **Existence checks** — Verifies NPC IDs exist before operating on them.
- **Capacity enforcement** — Refuses `createNPC` when `maxNPCs` is reached.
- **Plugin scoping** — When called from a `PluginContext`, enforces permission boundaries.

---

## PluginManager Lifecycle

The `PluginManager` controls the entire lifecycle of plugins.

```
         ┌──────────────────────────────────────────────────────┐
         │                  Plugin Lifecycle                     │
         │                                                      │
         │  ┌────────┐    ┌──────────┐    ┌─────────┐           │
         │  │  Load  │───►│  Install │───►│ Running │           │
         │  └────────┘    └──────────┘    └────┬────┘           │
         │      │              │               │                │
         │      │              │               │                │
         │      ▼              ▼               ▼                │
         │  Permission     Register:        onTick() +          │
         │  Check          - Actions        onEvent()           │
         │                 - Goals                             │
         │                 - Panels                             │
         │                 - Subscriptions                      │
         │                                                      │
         │                 ┌──────────┐                         │
         │                 │ Unload   │◄──── unload(id)         │
         │                 └────┬─────┘                         │
         │                      │                               │
         │                      ▼                               │
         │                 Uninstall:                            │
         │                 - Unregister all                      │
         │                 - Unsubscribe all                     │
         │                 - Release resources                  │
         └──────────────────────────────────────────────────────┘
```

### Load Sequence

1. **Permission check** — Verify all `manifest.permissions` are granted by the host.
2. **Dependency resolution** — Topological sort of hard dependencies. If a dependency is missing or version is too low, load fails.
3. **Install hook** — Call `plugin.install(ctx)`. If it throws, the plugin is marked as failed and `uninstall()` is called for cleanup.
4. **Registration** — Actions, goals, panels, and subscriptions registered during `install()` become live.
5. **Ready** — The plugin receives `onTick()` and `onEvent()` calls from this point forward.

### Unload Sequence

1. **Uninstall hook** — Call `plugin.uninstall(ctx)`. The plugin should unregister everything.
2. **Forced cleanup** — The manager removes any registrations the plugin forgot to clean up.
3. **Removal** — The plugin is removed from the active list and no longer receives ticks or events.

---

## DebugPanelRegistry

The `DebugPanelRegistry` is an optional subsystem initialized when `enableDebugPanels: true` is set in the API config. It provides a registration point for introspection UIs.

### Purpose

- **Development tools** — Render engine state in custom dev UIs or overlays.
- **Plugin introspection** — Plugins can expose their internal state for debugging.
- **Performance monitoring** — Display real-time stats, LOD distribution, event throughput.

### Panel Interface

```typescript
interface DebugPanel {
  id: string;
  title: string;
  render: (context: PluginContext) => string;
  refreshRate: number; // Hz
}
```

### Registry Methods

| Method | Description |
|---|---|
| `register(panel)` | Add a panel to the registry. |
| `unregister(panelId)` | Remove a panel. |
| `getPanels()` | Return all registered panels. |
| `getPanel(id)` | Get a single panel by ID. |
| `render(id)` | Execute a panel's render function and return the output string. |

### Refresh Model

Panels are rendered on demand by the host application at the panel's `refreshRate`. The engine does not force renders — it only provides the data. This keeps the debug system zero-cost in production builds where `enableDebugPanels` is `false`.

---

## Data Flow: Events → Modules → State Changes

The engine uses a unidirectional data flow within each tick. Events are the only mechanism for inter-module communication.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TICK N                                        │
│                                                                     │
│  ┌──────────────┐                                                   │
│  │  Perception  │  NPC sees a wolf nearby                            │
│  │   Module     │──► emit("perception:sight", { npcId, target: "wolf" })│
│  └──────────────┘              │                                    │
│                                ▼                                    │
│                        ┌───────────────┐                             │
│                        │  Event Bus    │                             │
│                        └───┬───┬───┬───┘                             │
│             ┌────────────────┘   │   └────────────────────┐         │
│             ▼                    ▼                         ▼         │
│  ┌──────────────┐    ┌──────────────┐          ┌──────────────┐     │
│  │  Emotion     │    │  Needs        │          │  Memory      │     │
│  │  Module      │    │  Module        │          │  Module      │     │
│  │              │    │                │          │              │     │
│  │ Sets fear    │    │ Sets safety    │          │ Stores       │     │
│  │ state = 0.8  │    │ need = high    │          │ "saw wolf"   │     │
│  └──────┬───────┘    └──────┬────────┘          └──────────────┘     │
│         │                   │                                        │
│         ▼                   ▼                                        │
│  emit("emotion:fear",   emit("need:safety",                          │
│       { npcId, level: 0.8 })     { npcId, urgency: 0.9 })             │
│         │                   │                                        │
│         └─────────┬─────────┘                                        │
│                   ▼                                                  │
│           ┌──────────────┐                                           │
│           │ Goals Module │  Evaluates: fear=0.8 + safety_need=0.9    │
│           │              │  Selects goal: "flee_to_safety"           │
│           └──────┬───────┘                                           │
│                  ▼                                                   │
│           ┌──────────────────┐                                      │
│           │ GOAP Planner     │  Plans: [run_away, seek_shelter]      │
│           └──────┬───────────┘                                      │
│                  ▼                                                   │
│           ┌──────────────────┐                                      │
│           │ Movement Module  │  Executes: move NPC to shelter        │
│           └──────┬───────────┘                                      │
│                  ▼                                                   │
│           emit("npc:moved", { npcId, newPos })                        │
│                  │                                                   │
│                  ▼                                                   │
│           ┌──────────────────┐                                      │
│           │  NPC State       │  position updated, mood = "afraid"    │
│           │  (canonical)     │                                       │
│           └──────────────────┘                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Properties

- **No direct module-to-module calls.** All communication is via events.
- **State is written at the end.** Modules emit events that other modules read. The canonical NPC/world state is updated by the module that owns that state.
- **Deterministic ordering.** Within a tick, modules execute in a fixed order. Events are dispatched synchronously.
- **Follow-up events queue.** Events emitted during dispatch are queued and processed after the current dispatch completes, preventing re-entrancy.

---

## LOD and Chunk System

The Level-of-Detail (LOD) system is the engine's primary scalability mechanism. It reduces CPU cost by simulating distant NPCs at lower fidelity.

### LOD Levels

```
                         Player
                           ★
              ┌────────────┼────────────┐
              │   Near     │   (≤ 50m)   │  FULL cognitive simulation
              │            │             │  All 21 modules, every tick
              ├────────────┼────────────┤
              │     Mid       (≤ 200m)  │  REDUCED: 5 modules, 1/4 tick rate
              ├─────────────────────────┤
              │       Far    (≤ 1000m)  │  DORMANT: summary updates only
              ├─────────────────────────┤
              │     Offscreen (>1000m)  │  OFFSCREEN: no simulation
              └─────────────────────────┘
```

| LOD Level | Distance | Modules Active | Tick Rate | Description |
|---|---|---|---|---|
| `full` | ≤ nearDistance | All 21 | Every tick | Complete cognitive simulation. NPCs plan, feel, remember, socialize. |
| `reduced` | near to mid | 5 (perception, needs, goals, movement, emotion) | 1/4 rate | Core survival and movement only. No social, narrative, or meta-cognition. |
| `dormant` | mid to far | 1 (summary) | 1/20 rate | NPCs are represented as summary records. When the player approaches, they are "thawed" and re-simulated. |
| `offscreen` | > farDistance | 0 | Never | No processing. NPC state is frozen. |

### Chunk System

The world is divided into spatial chunks for efficient LOD computation:

```
Chunk Grid (top-down view):

    ┌─────┬─────┬─────┬─────┬─────┐
    │ off │ off │ dor │ dor │ off │
    ├─────┼─────┼─────┼─────┼─────┤
    │ off │ dor │ mid │ dor │ off │
    ├─────┼─────┼─────┼─────┼─────┤
    │ dor │ mid │ NEAR│ mid │ dor │      ★ = player
    ├─────┼─────┼─────┼─────┼─────┤
    │ off │ dor │ mid │ dor │ off │
    ├─────┼─────┼─────┼─────┼─────┤
    │ off │ off │ dor │ dor │ off │
    └─────┴─────┴─────┴─────┴─────┘

    NEAR = full    mid = reduced    dor = dormant    off = offscreen
```

- Each chunk is a fixed-size spatial region (default 256×256 units).
- When the player moves, the LOD system recomputes which chunks are near, mid, far, and offscreen.
- Only NPCs in `full` and `reduced` chunks are processed every tick.
- Dormant chunks are processed on a slow background cycle to keep summaries fresh.
- Chunks are loaded/unloaded as the player traverses the world, enabling effectively unlimited world sizes.

### LOD Transition

When an NPC transitions between LOD levels, the engine performs a **summary/thaw** cycle:

```
full → reduced:   NPC state is preserved but non-critical modules are paused.
reduced → dormant: NPC state is compressed into a summary record.
dormant → reduced: NPC is "thawed" — summary is expanded back into full state.
reduced → full:   All modules reactivated. Memory module replays recent events.
```

---

## Performance Scheduler

The `PerformanceScheduler` ensures the simulation stays within a target time budget per tick, preventing the engine from starving the game's render loop or network thread.

### Budget System

```
┌─────────────────────────────────────────────────────┐
│                PerformanceScheduler                   │
│                                                      │
│  Target: maxTickBudgetMs (default: 16ms = 60fps)     │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │              Tick Budget Allocation           │    │
│  │                                              │    │
│  │  Phase 1 modules:  20%  (3.2ms)              │    │
│  │  Phase 2 modules:  15%  (2.4ms)              │    │
│  │  Phase 3 modules:  30%  (4.8ms)  ← planning  │    │
│  │  Phase 4 modules:  15%  (2.4ms)              │    │
│  │  Phase 5 modules:  10%  (1.6ms)              │    │
│  │  Plugins:          10%  (1.6ms)              │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  If a phase exceeds its budget:                      │
│    1. Remaining work in that phase is deferred        │
│    2. Deferred work is prioritized for the next tick  │
│    3. A warning is logged if budget is consistently   │
│       exceeded                                       │
└─────────────────────────────────────────────────────┘
```

### Key Features

| Feature | Description |
|---|---|
| **Per-phase budgets** | Each module phase gets a percentage of the total tick budget. |
| **Work deferral** | If a phase runs out of budget, remaining NPC processing is deferred to the next tick. |
| **Priority queue** | Deferred work is sorted by NPC priority (player-adjacent NPCs first). |
| **Plan throttling** | `maxConcurrentPlans` limits parallel GOAP plan computations per tick. |
| **Adaptive degradation** | If the budget is consistently exceeded, the scheduler automatically widens the `reduced` LOD band to reduce the number of fully-simulated NPCs. |

---

## File Structure

```
src/sdk/
├── docs/
│   ├── quickstart.md              # Quick start guide
│   ├── api-reference.md           # Public API reference
│   ├── plugin-guide.md            # Plugin development guide
│   └── architecture.md            # This file
│
├── src/
│   ├── api/
│   │   ├── ElysiumAPI.ts          # Public facade class
│   │   ├── PublicAPIConfig.ts     # Config interface + defaults
│   │   └── ElysiumSDKStats.ts     # Stats interface
│   │
│   ├── runtime/
│   │   ├── ElysiumRuntime.ts      # Orchestrator
│   │   ├── PerformanceScheduler.ts
│   │   ├── LODSystem.ts           # LOD + chunk management
│   │   └── Chunk.ts               # Spatial chunk type
│   │
│   ├── modules/
│   │   ├── CognitiveModule.ts     # Module interface
│   │   ├── CognitiveEventBus.ts   # Event bus
│   │   ├── CognitiveEvent.ts      # Event type
│   │   │
│   │   ├── phase1/                # Foundation
│   │   │   ├── Identity.ts
│   │   │   ├── Perception.ts
│   │   │   ├── Memory.ts
│   │   │   ├── Needs.ts
│   │   │   └── Movement.ts
│   │   │
│   │   ├── phase2/                # Social
│   │   │   ├── Relationships.ts
│   │   │   ├── Dialogue.ts
│   │   │   ├── Factions.ts
│   │   │   └── SocialGroups.ts
│   │   │
│   │   ├── phase3/                # Intelligence
│   │   │   ├── Goals.ts
│   │   │   ├── GOAPPlanner.ts
│   │   │   ├── Decision.ts
│   │   │   └── Learning.ts
│   │   │
│   │   ├── phase4/                # World
│   │   │   ├── Economy.ts
│   │   │   ├── WorldEvents.ts
│   │   │   ├── Territory.ts
│   │   │   └── Time.ts
│   │   │
│   │   └── phase5/                # Advanced
│   │       ├── Emotion.ts
│   │       ├── Personality.ts
│   │       ├── Narrative.ts
│   │       └── MetaCognition.ts
│   │
│   ├── plugins/
│   │   ├── PluginManager.ts        # Load/unload/permissions
│   │   ├── PluginContext.ts        # Scoped context for plugins
│   │   ├── PluginManifest.ts       # Manifest interface
│   │   ├── PluginPermission.ts     # Permission union (11 values)
│   │   └── ElysiumPlugin.ts        # Plugin interface
│   │
│   ├── debug/
│   │   ├── DebugPanelRegistry.ts
│   │   └── DebugPanel.ts
│   │
│   ├── types/
│   │   ├── NPC.ts
│   │   ├── WorldState.ts
│   │   ├── Goal.ts
│   │   ├── Action.ts
│   │   ├── Economy.ts
│   │   └── SerializedState.ts
│   │
│   └── index.ts                   # Public exports
│
├── tests/
│   ├── unit/                       # Unit tests (per module)
│   ├── integration/                 # Cross-module integration tests
│   ├── e2e/                        # Full simulation end-to-end tests
│   ├── fixtures/                   # Test data and scenarios
│   └── benchmarks/                 # Performance benchmarks
│
├── examples/
│   ├── minimal/                    # Minimal usage example
│   ├── plugin/                     # Plugin development example
│   └── full-game/                  # Full game integration example
│
└── package.json
```

---

## Testing Strategy

The engine uses a four-tier testing strategy to ensure correctness at every level.

### Tier 1 — Unit Tests

Each cognitive module is tested in isolation with mocked event buses and synthetic NPC state.

```
tests/unit/
├── phase1/
│   ├── perception.test.ts
│   ├── memory.test.ts
│   └── ...
├── phase2/
│   └── ...
├── phase3/
│   ├── goap_planner.test.ts
│   └── ...
└── ...
```

**What's tested:**

- Module initialization and shutdown.
- Event subscription and correct state mutations.
- Edge cases: empty NPC lists, missing data, extreme values.
- Determinism: same inputs → same outputs.

### Tier 2 — Integration Tests

Tests that verify modules interact correctly through the event bus.

```
tests/integration/
├── perception_to_goals.test.ts       # Perception → Emotion → Goals flow
├── goals_to_movement.test.ts         # Goals → GOAP → Movement flow
├── economy_trade.test.ts             # Economy module + NPC inventory
└── plugin_lifecycle.test.ts          # Plugin load/unload with real runtime
```

**What's tested:**

- Event chains across multiple modules produce expected state changes.
- Module execution order produces correct results.
- Plugin registration integrates with module systems.

### Tier 3 — End-to-End Tests

Full simulation scenarios that run the complete engine for many ticks and assert emergent behavior.

```
tests/e2e/
├── village_economy.test.ts          # 50 NPCs, 1000 ticks, economy stabilizes
├── combat_scenario.test.ts          # Combat event chain, damage, death
├── storm_shelter.test.ts            # Weather plugin + NPC sheltering behavior
└── save_load.test.ts                # exportState → importState → identical behavior
```

**What's tested:**

- Simulations produce plausible emergent behavior.
- State serialization round-trips correctly.
- LOD transitions don't corrupt NPC state.
- Performance stays within budget for realistic scenarios.

### Tier 4 — Property-Based Tests

Randomized tests that generate arbitrary NPC populations and event sequences, then assert invariants.

```
tests/property/
├── no_npc_duplicates.test.ts        # No two NPCs ever share an ID
├── health_bounds.test.ts           # Health always in [0, maxHealth]
├── event_ordering.test.ts          # Events are delivered in emission order
└── lod_consistency.test.ts          # LOD level matches distance from player
```

---

## Benchmark Strategy

The engine includes a benchmarking suite to track performance across changes and prevent regressions.

### Benchmark Categories

| Benchmark | What It Measures | Target |
|---|---|---|
| `tick_100_npcs` | Time per tick with 100 NPCs at full LOD | < 2ms |
| `tick_500_npcs` | Time per tick with 500 NPCs (mixed LOD) | < 8ms |
| `tick_1000_npcs` | Time per tick with 1000 NPCs (mixed LOD) | < 16ms |
| `goap_planning` | Time to generate a single GOAP plan | < 1ms |
| `event_dispatch` | Time to dispatch 10,000 events | < 5ms |
| `lod_recompute` | Time to recompute LOD for 1000 NPCs | < 0.5ms |
| `state_export` | Time to serialize 500 NPCs | < 10ms |
| `state_import` | Time to deserialize 500 NPCs | < 15ms |
| `plugin_tick` | Overhead of 10 plugins' onTick | < 1ms |
| `chunk_transition` | Time for player crossing a chunk boundary | < 1ms |

### Running Benchmarks

```bash
# Run all benchmarks
npm run bench

# Run a specific benchmark
npm run bench -- --filter tick_500_npcs

# Compare against baseline
npm run bench -- --compare baseline.json
```

### Benchmark Structure

```
tests/benchmarks/
├── tick_benchmarks.ts              # Tick performance at various NPC counts
├── goap_benchmarks.ts              # GOAP planning benchmarks
├── event_benchmarks.ts             # Event bus throughput
├── lod_benchmarks.ts               # LOD recomputation
├── state_io_benchmarks.ts          # Export/import performance
├── plugin_benchmarks.ts            # Plugin overhead
└── baseline.json                   # Last known good baseline
```

### Regression Detection

- Each benchmark records its result in `benchmark-results.json`.
- On CI, results are compared against `baseline.json`.
- If a benchmark exceeds its target by more than 10%, the CI job fails and a regression is flagged.
- The baseline is updated manually after a reviewed performance improvement.

### Profiling

For deep performance analysis, the engine supports the Node.js profiler:

```bash
# Profile a 1000-NPC simulation for 10 seconds
npm run bench -- --filter tick_1000_npcs --profile --duration 10

# Output: profile.cpuprofile (load in Chrome DevTools)
```

---

## Further Reading

- **[Quick Start Guide](./quickstart.md)** — Get running in five minutes.
- **[Public API Reference](./api-reference.md)** — Complete method documentation.
- **[Plugin Development Guide](./plugin-guide.md)** — Build custom extensions.
