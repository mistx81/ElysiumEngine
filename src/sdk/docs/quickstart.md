# Elysium Engine — Quick Start Guide

Get a living, breathing NPC simulation running in your game in under five minutes. This guide walks through installation, configuration, and a complete minimal example.

---

## Installation

```bash
npm install @elysium/engine
```

### Peer Dependencies

Elysium Engine has no hard runtime dependencies, but TypeScript projects should install the types bundled with the package:

```bash
npm install @elysium/engine --save
```

### Import

```typescript
import { ElysiumAPI } from "@elysium/engine";
```

If you are using CommonJS:

```javascript
const { ElysiumAPI } = require("@elysium/engine");
```

---

## Creating an API Instance

The `ElysiumAPI` class is the single entry point to the engine. You create one instance per game session (or per world, if you run multiple simulations).

```typescript
import { ElysiumAPI } from "@elysium/engine";

const elysium = new ElysiumAPI({
  worldId: "my-game-world",
  tickRate: 20,            // simulation ticks per second
  maxNPCs: 500,             // hard cap on concurrent NPCs
  enableDebugPanels: true,  // expose debug panels for dev tools
  lod: {
    nearDistance: 50,       // full cognitive simulation
    midDistance: 200,        // reduced tick rate
    farDistance: 1000,       // dormant / summary-only
  },
});
```

### Configuration Fields

| Field | Type | Default | Description |
|---|---|---|---|
| `worldId` | `string` | `"default"` | Unique identifier for the simulated world. |
| `tickRate` | `number` | `20` | Target simulation ticks per second. |
| `maxNPCs` | `number` | `1000` | Maximum concurrent NPCs before creation is refused. |
| `enableDebugPanels` | `boolean` | `false` | Whether to initialize the debug panel registry. |
| `lod` | `LODConfig` | _see below_ | Level-of-detail distance thresholds. |

> **See the [API Reference](./api-reference.md) for the complete `PublicAPIConfig` interface.**

---

## Creating NPCs

An NPC is the atomic unit of simulation. Each NPC has a unique ID, a position, and a set of cognitive properties.

```typescript
const npc = elysium.createNPC({
  id: "npc_blacksmith_01",
  name: "Bjorn",
  position: { x: 120, y: 0, z: 45 },
  faction: "villagers",
  traits: {
    bravery: 0.7,
    curiosity: 0.3,
    sociability: 0.5,
  },
  inventory: [
    { itemId: "iron_ingot", quantity: 5 },
  ],
});
```

`createNPC` returns the fully initialized NPC object. The NPC is immediately available to the simulation but will not act until the simulation is running and a goal is set.

---

## Setting Goals

Goals drive NPC behavior through the engine's GOAP (Goal-Oriented Action Planning) system. A goal describes a desired world state and a priority.

```typescript
elysium.setGoal("npc_blacksmith_01", {
  name: "forge_sword",
  priority: 0.8,
  targetState: {
    hasItem: "steel_sword",
  },
  deadline: Date.now() + 60_000, // optional: give up after 60s
});
```

You can set multiple goals on a single NPC. The planner will select the highest-priority achievable goal and generate an action sequence to reach it.

### Planning a Goal Manually

If you want to inspect the plan before committing the NPC to it, use `planGoal`:

```typescript
const plan = elysium.planGoal("npc_blacksmith_01", {
  name: "forge_sword",
  priority: 0.8,
  targetState: { hasItem: "steel_sword" },
});

if (plan.success) {
  console.log("Planned actions:", plan.actions.map(a => a.name));
  // ["goto_smithy", "retrieve_iron", "heat_forge", "hammer_blade", "quench"]
}
```

---

## Running the Simulation

The simulation does not advance on its own. You must either call `tick()` manually (useful for step-debugging or server-authoritative loops) or use `start()` to run the internal scheduler at the configured tick rate.

### Automatic (scheduler-driven)

```typescript
elysium.start();   // begins ticking at `tickRate` Hz
// ... game runs ...
elysium.stop();    // halts the scheduler
```

### Manual (step mode)

```typescript
for (let i = 0; i < 100; i++) {
  elysium.tick();  // advance exactly one simulation step
}
```

---

## Subscribing to Events

The engine emits events through a central cognitive event bus. Subscribe to observe NPC actions, state changes, world events, and more.

```typescript
// Listen for NPC speech
const unsubSpeech = elysium.subscribe("npc:speech", (event) => {
  console.log(`${event.npcId} says: "${event.text}"`);
});

// Listen for combat
elysium.subscribe("combat:hit", (event) => {
  console.log(`${event.attackerId} hit ${event.targetId} for ${event.damage}`);
});

// Listen for any event (wildcard)
elysium.subscribe("*", (event) => {
  logToTelemetry(event);
});

// Later, stop listening
unsubSpeech();
```

### Common Event Types

| Event Type | Payload Highlights | Fired When |
|---|---|---|
| `npc:speech` | `npcId`, `text` | An NPC produces dialogue. |
| `npc:goal_started` | `npcId`, `goalName` | A goal begins execution. |
| `npc:goal_completed` | `npcId`, `goalName`, `success` | A goal finishes or fails. |
| `combat:hit` | `attackerId`, `targetId`, `damage` | Damage is dealt. |
| `economy:trade` | `buyerId`, `sellerId`, `itemId`, `price` | A trade completes. |
| `world:event` | `eventName`, `payload` | A custom world event fires. |

---

## Getting NPC State

Retrieve the current state of any NPC at any time:

```typescript
const bjorn = elysium.getNPC("npc_blacksmith_01");

console.log(bjorn.position);     // { x: 120, y: 0, z: 45 }
console.log(bjorn.goals);         // current goal queue
console.log(bjorn.state.health);  // 100
console.log(bjorn.state.mood);    // "focused"
```

To iterate over all NPCs:

```typescript
const allNPCs = elysium.getAllNPCs();
for (const npc of allNPCs) {
  console.log(npc.id, npc.name);
}
```

---

## Full Minimal Example

Below is a complete, runnable script that installs the engine, creates an NPC, assigns a goal, runs the simulation, listens for events, and prints NPC state.

```typescript
import { ElysiumAPI } from "@elysium/engine";

// 1. Create the API instance
const elysium = new ElysiumAPI({
  worldId: "demo-world",
  tickRate: 10,
  maxNPCs: 100,
  enableDebugPanels: false,
});

// 2. Subscribe to events
elysium.subscribe("npc:goal_completed", (e) => {
  console.log(`[event] ${e.npcId} ${e.success ? "completed" : "failed"} goal: ${e.goalName}`);
});

elysium.subscribe("npc:speech", (e) => {
  console.log(`[speech] ${e.npcId}: "${e.text}"`);
});

// 3. Create an NPC
const npc = elysium.createNPC({
  id: "npc_merchant_01",
  name: "Elena",
  position: { x: 0, y: 0, z: 0 },
  faction: "traders",
  traits: { bravery: 0.4, curiosity: 0.8, sociability: 0.9 },
  inventory: [{ itemId: "gold", quantity: 100 }],
});

// 4. Set a goal
elysium.setGoal(npc.id, {
  name: "sell_goods",
  priority: 0.9,
  targetState: { gold: 200 },
});

// 5. Run the simulation
elysium.start();

// 6. Inspect state after a few seconds
setTimeout(() => {
  const current = elysium.getNPC(npc.id);
  console.log("Elena's state:", current.state);
  console.log("Stats:", elysium.getStats());
  elysium.stop();
}, 5000);
```

---

## Next Steps

- **[Public API Reference](./api-reference.md)** — Complete method-by-method documentation for every `ElysiumAPI` method, including parameters, return types, and examples.
- **[Plugin Development Guide](./plugin-guide.md)** — Extend the engine with custom GOAP actions, goals, debug panels, and event handlers.
- **[Architecture Overview](./architecture.md)** — Understand the cognitive module system, event bus, runtime orchestrator, and LOD scheduler.
