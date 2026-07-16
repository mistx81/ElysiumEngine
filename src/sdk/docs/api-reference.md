# Elysium Engine — Public API Reference

Complete reference for the `ElysiumAPI` class, configuration interfaces, and stats types. All methods are grouped by category.

---

## Table of Contents

- [PublicAPIConfig Interface](#publicapiconfig-interface)
- [ElysiumSDKStats Interface](#elysiumsdkstats-interface)
- [NPC Management](#npc-management)
  - [createNPC](#createnpc)
  - [removeNPC](#removenpc)
  - [getNPC](#getnpc)
  - [getAllNPCs](#getallnpcs)
- [Goals & Planning](#goals--planning)
  - [setGoal](#setgoal)
  - [planGoal](#plangoal)
- [Simulation Control](#simulation-control)
  - [tick](#tick)
  - [start](#start)
  - [stop](#stop)
- [Events](#events)
  - [emit](#emit)
  - [subscribe](#subscribe)
  - [unsubscribe](#unsubscribe)
- [World](#world)
  - [getWorldState](#getworldstate)
  - [triggerWorldEvent](#triggerworldevent)
- [Economy](#economy)
  - [getEconomyPrice](#geteconomyprice)
  - [trade](#trade)
- [LOD & Position](#lod--position)
  - [setPlayerPosition](#setplayerposition)
  - [getNPCLOD](#getnpclod)
- [State I/O](#state-io)
  - [exportState](#exportstate)
  - [importState](#importstate)
- [Stats](#stats)
  - [getStats](#getstats)
- [Plugins](#plugins)
  - [getPluginManager](#getpluginmanager)
- [Debug Panels](#debug-panels)
  - [getDebugPanels](#getdebugpanels)
- [Runtime](#runtime)
  - [getRuntime](#getruntime)

---

## PublicAPIConfig Interface

Configuration object passed to the `ElysiumAPI` constructor.

```typescript
interface PublicAPIConfig {
  worldId: string;
  tickRate: number;
  maxNPCs: number;
  enableDebugPanels: boolean;
  lod: LODConfig;
  performance: PerformanceConfig;
  plugins: string[];
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `worldId` | `string` | `"default"` | Unique identifier for the simulated world. Used in state export/import and plugin namespacing. |
| `tickRate` | `number` | `20` | Target simulation frequency in ticks per second. Higher values produce finer-grained behavior at greater CPU cost. |
| `maxNPCs` | `number` | `1000` | Hard cap on concurrent NPCs. `createNPC` throws if this is exceeded. |
| `enableDebugPanels` | `boolean` | `false` | When `true`, initializes the `DebugPanelRegistry` and exposes it via `getDebugPanels()`. |
| `lod` | `LODConfig` | `{ nearDistance: 50, midDistance: 200, farDistance: 1000 }` | Level-of-detail distance thresholds relative to the player position. |
| `lod.nearDistance` | `number` | `50` | NPCs within this radius run full cognitive simulation every tick. |
| `lod.midDistance` | `number` | `200` | NPCs in the near-to-mid band run at reduced tick rate. |
| `lod.farDistance` | `number` | `1000` | NPCs beyond this distance are dormant (summary-only updates). |
| `performance` | `PerformanceConfig` | _see below_ | Scheduler and budget tuning. |
| `performance.maxTickBudgetMs` | `number` | `16` | Maximum wall-clock time per tick before the scheduler yields. |
| `performance.maxConcurrentPlans` | `number` | `4` | Maximum GOAP plans computed in parallel per tick. |
| `plugins` | `string[]` | `[]` | Array of plugin module names or paths to auto-load on construction. |

### LODConfig

```typescript
interface LODConfig {
  nearDistance: number;
  midDistance: number;
  farDistance: number;
}
```

### PerformanceConfig

```typescript
interface PerformanceConfig {
  maxTickBudgetMs: number;
  maxConcurrentPlans: number;
}
```

---

## ElysiumSDKStats Interface

Returned by `getStats()`. Provides a snapshot of engine performance and capacity.

```typescript
interface ElysiumSDKStats {
  npcCount: number;
  maxNPCs: number;
  tickRate: number;
  currentTick: number;
  avgTickTimeMs: number;
  maxTickTimeMs: number;
  totalEvents: number;
  eventsPerSecond: number;
  activeGoals: number;
  plansPerSecond: number;
  memoryUsageMB: number;
  pluginCount: number;
  uptimeSeconds: number;
}
```

| Field | Type | Description |
|---|---|---|
| `npcCount` | `number` | Current number of live NPCs. |
| `maxNPCs` | `number` | Configured NPC cap. |
| `tickRate` | `number` | Configured target tick rate. |
| `currentTick` | `number` | Monotonically increasing tick counter since `start()` or first `tick()`. |
| `avgTickTimeMs` | `number` | Rolling average wall-clock time per tick in milliseconds. |
| `maxTickTimeMs` | `number` | Worst-case tick time observed in the current session. |
| `totalEvents` | `number` | Total events emitted since engine start. |
| `eventsPerSecond` | `number` | Events emitted in the last second. |
| `activeGoals` | `number` | Number of goals currently being pursued across all NPCs. |
| `plansPerSecond` | `number` | GOAP plans generated in the last second. |
| `memoryUsageMB` | `number` | Estimated heap usage in megabytes. |
| `pluginCount` | `number` | Number of currently loaded plugins. |
| `uptimeSeconds` | `number` | Seconds since the engine was started. |

---

## NPC Management

### createNPC

Creates and registers a new NPC in the simulation.

```typescript
createNPC(config: NPCCreateConfig): NPC
```

**Parameters**

| Name | Type | Description |
|---|---|---|
| `config.id` | `string` | Unique NPC identifier. Throws if already in use. |
| `config.name` | `string` | Display name. |
| `config.position` | `{ x: number; y: number; z: number }` | Initial world position. |
| `config.faction` | `string` | Faction identifier for social/relationship systems. |
| `config.traits` | `Partial<NPCTraits>` | Personality traits (0–1 scale). |
| `config.inventory` | `InventoryItem[]` | Starting inventory items. |

**Returns:** `NPC` — The fully initialized NPC object.

**Example**

```typescript
const npc = elysium.createNPC({
  id: "npc_guard_01",
  name: "Captain Aldric",
  position: { x: 100, y: 0, z: 200 },
  faction: "city_guard",
  traits: { bravery: 0.9, curiosity: 0.2, sociability: 0.4 },
  inventory: [{ itemId: "longsword", quantity: 1 }],
});
```

---

### removeNPC

Removes an NPC from the simulation and frees all associated resources.

```typescript
removeNPC(npcId: string): boolean
```

**Parameters**

| Name | Type | Description |
|---|---|---|
| `npcId` | `string` | ID of the NPC to remove. |

**Returns:** `boolean` — `true` if the NPC was found and removed, `false` otherwise.

**Example**

```typescript
const removed = elysium.removeNPC("npc_guard_01");
console.log(removed ? "NPC removed" : "NPC not found");
```

---

### getNPC

Retrieves the live NPC object by ID.

```typescript
getNPC(npcId: string): NPC | null
```

**Parameters**

| Name | Type | Description |
|---|---|---|
| `npcId` | `string` | ID of the NPC to retrieve. |

**Returns:** `NPC | null` — The NPC object, or `null` if not found.

> **Warning:** The returned object is live. Mutating it directly bypasses the event bus and may cause inconsistent state. Prefer using API methods for changes.

**Example**

```typescript
const npc = elysium.getNPC("npc_guard_01");
if (npc) {
  console.log(npc.name, npc.state.health);
}
```

---

### getAllNPCs

Returns an array of all live NPCs.

```typescript
getAllNPCs(): NPC[]
```

**Returns:** `NPC[]` — Array of all registered NPCs. Returns an empty array if none exist.

**Example**

```typescript
const all = elysium.getAllNPCs();
console.log(`Total NPCs: ${all.length}`);
for (const npc of all) {
  console.log(npc.id, npc.position);
}
```

---

## Goals & Planning

### setGoal

Assigns a goal to an NPC. The GOAP planner will attempt to generate and execute an action sequence to achieve the goal's target state.

```typescript
setGoal(npcId: string, goal: GoalConfig): boolean
```

**Parameters**

| Name | Type | Description |
|---|---|---|
| `npcId` | `string` | ID of the target NPC. |
| `goal.name` | `string` | Unique goal name (must match a registered goal type). |
| `goal.priority` | `number` | Priority weight (0–1). Higher values are selected first. |
| `goal.targetState` | `Record<string, unknown>` | Desired world-state properties the goal aims to satisfy. |
| `goal.deadline` | `number` | Optional Unix timestamp (ms). The goal is abandoned if not achieved by this time. |

**Returns:** `boolean` — `true` if the goal was accepted, `false` if the NPC was not found or the goal type is unknown.

**Example**

```typescript
elysium.setGoal("npc_merchant_01", {
  name: "acquire_item",
  priority: 0.85,
  targetState: { hasItem: "rare_gem" },
  deadline: Date.now() + 120_000,
});
```

---

### planGoal

Generates a GOAP plan for the given goal without committing the NPC to execute it. Useful for previewing behavior or debugging planner logic.

```typescript
planGoal(npcId: string, goal: GoalConfig): PlanResult
```

**Parameters**

| Name | Type | Description |
|---|---|---|
| `npcId` | `string` | ID of the NPC to plan for. |
| `goal` | `GoalConfig` | The goal configuration (same shape as `setGoal`). |

**Returns:** `PlanResult`

```typescript
interface PlanResult {
  success: boolean;
  actions: PlannedAction[];
  estimatedCost: number;
  estimatedDurationMs: number;
  failureReason?: string;
}
```

**Example**

```typescript
const plan = elysium.planGoal("npc_blacksmith_01", {
  name: "forge_sword",
  priority: 0.8,
  targetState: { hasItem: "steel_sword" },
});

if (plan.success) {
  console.log("Plan:", plan.actions.map(a => a.name));
  console.log("Estimated cost:", plan.estimatedCost);
} else {
  console.log("Planning failed:", plan.failureReason);
}
```

---

## Simulation Control

### tick

Advances the simulation by exactly one tick. Use this for step-debugging, deterministic testing, or server-authoritative loops where you control timing.

```typescript
tick(): void
```

**Returns:** `void`

**Example**

```typescript
// Step through 100 ticks deterministically
for (let i = 0; i < 100; i++) {
  elysium.tick();
}
```

---

### start

Starts the internal scheduler, which calls `tick()` automatically at the configured `tickRate`.

```typescript
start(): void
```

**Returns:** `void`

> **Note:** Calling `start()` while already running is a no-op.

**Example**

```typescript
elysium.start();
console.log("Simulation running at", elysium.getStats().tickRate, "Hz");
```

---

### stop

Halts the internal scheduler. The simulation state is preserved and can be resumed with `start()` or advanced manually with `tick()`.

```typescript
stop(): void
```

**Returns:** `void`

**Example**

```typescript
elysium.stop();
console.log("Simulation halted. Uptime:", elysium.getStats().uptimeSeconds, "s");
```

---

## Events

### emit

Emits a custom event onto the cognitive event bus. Plugins and subscribers will receive it.

```typescript
emit(eventType: string, payload: Record<string, unknown>): void
```

**Parameters**

| Name | Type | Description |
|---|---|---|
| `eventType` | `string` | Event type identifier (e.g., `"custom:alarm"`). |
| `payload` | `Record<string, unknown>` | Arbitrary data attached to the event. |

**Returns:** `void`

**Example**

```typescript
elysium.emit("custom:alarm", {
  position: { x: 100, y: 0, z: 100 },
  severity: "high",
});
```

---

### subscribe

Registers a callback for events of the given type. Use `"*"` to subscribe to all events.

```typescript
subscribe(eventType: string, callback: (event: CognitiveEvent) => void): () => void
```

**Parameters**

| Name | Type | Description |
|---|---|---|
| `eventType` | `string` | Event type to listen for, or `"*"` for all events. |
| `callback` | `(event: CognitiveEvent) => void` | Function invoked when a matching event is emitted. |

**Returns:** `() => void` — An unsubscribe function. Call it to stop receiving events.

**Example**

```typescript
const unsub = elysium.subscribe("combat:hit", (event) => {
  console.log(`${event.attackerId} → ${event.targetId}: ${event.damage} dmg`);
});

// Later
unsub();
```

---

### unsubscribe

Removes a previously registered subscription. Alternatively, call the function returned by `subscribe()`.

```typescript
unsubscribe(eventType: string, callback: (event: CognitiveEvent) => void): boolean
```

**Parameters**

| Name | Type | Description |
|---|---|---|
| `eventType` | `string` | The event type the callback was registered for. |
| `callback` | `(event: CognitiveEvent) => void` | The exact callback reference to remove. |

**Returns:** `boolean` — `true` if the callback was found and removed, `false` otherwise.

**Example**

```typescript
function onHit(event) { console.log(event); }
elysium.subscribe("combat:hit", onHit);
elysium.unsubscribe("combat:hit", onHit);
```

---

## World

### getWorldState

Returns a snapshot of the global world state, including time, weather, faction relationships, and global flags.

```typescript
getWorldState(): WorldState
```

**Returns:** `WorldState`

```typescript
interface WorldState {
  time: number;              // in-game time in seconds
  dayCycle: "dawn" | "day" | "dusk" | "night";
  weather: string;
  factionRelations: Record<string, Record<string, number>>;
  flags: Record<string, boolean>;
}
```

**Example**

```typescript
const world = elysium.getWorldState();
console.log(`Time: ${world.time}s, Weather: ${world.weather}`);
console.log("Faction relations:", world.factionRelations);
```

---

### triggerWorldEvent

Fires a named world event that all NPCs and modules can react to (e.g., an earthquake, a festival, an invasion).

```typescript
triggerWorldEvent(eventName: string, payload?: Record<string, unknown>): void
```

**Parameters**

| Name | Type | Description |
|---|---|---|
| `eventName` | `string` | The world event identifier. |
| `payload` | `Record<string, unknown>` | Optional data passed to reacting NPCs and modules. |

**Returns:** `void`

**Example**

```typescript
elysium.triggerWorldEvent("dragon_attack", {
  position: { x: 500, y: 100, z: 500 },
  dragonId: "dragon_ancient_01",
});
```

---

## Economy

### getEconomyPrice

Queries the dynamic economy system for the current market price of an item at a given location.

```typescript
getEconomyPrice(itemId: string, locationId?: string): number
```

**Parameters**

| Name | Type | Description |
|---|---|---|
| `itemId` | `string` | The item to price. |
| `locationId` | `string` (optional) | Location/market identifier. Defaults to the global market. |

**Returns:** `number` — The current price in the game's currency unit.

**Example**

```typescript
const swordPrice = elysium.getEconomyPrice("steel_sword", "market_capital");
console.log(`Steel sword costs ${swordPrice} gold`);
```

---

### trade

Executes a trade between two NPCs (or between an NPC and the world market).

```typescript
trade(config: TradeConfig): TradeResult
```

**Parameters**

| Name | Type | Description |
|---|---|---|
| `config.buyerId` | `string` | NPC ID of the buyer. |
| `config.sellerId` | `string` | NPC ID of the seller, or `"market"` for the world market. |
| `config.itemId` | `string` | Item being traded. |
| `config.quantity` | `number` | Number of units. Defaults to `1`. |
| `config.maxPrice` | `number` | Optional price cap. The trade fails if the market price exceeds this. |

**Returns:** `TradeResult`

```typescript
interface TradeResult {
  success: boolean;
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  failureReason?: string;
}
```

**Example**

```typescript
const result = elysium.trade({
  buyerId: "npc_merchant_01",
  sellerId: "market",
  itemId: "iron_ingot",
  quantity: 10,
  maxPrice: 5,
});

if (result.success) {
  console.log(`Bought ${result.quantity} for ${result.totalPrice} gold`);
} else {
  console.log("Trade failed:", result.failureReason);
}
```

---

## LOD & Position

### setPlayerPosition

Updates the player's world position. This drives the LOD system — NPCs near the player receive full simulation, while distant NPCs are simplified or dormant.

```typescript
setPlayerPosition(position: { x: number; y: number; z: number }): void
```

**Parameters**

| Name | Type | Description |
|---|---|---|
| `position.x` | `number` | Player X coordinate. |
| `position.y` | `number` | Player Y coordinate. |
| `position.z` | `number` | Player Z coordinate. |

**Returns:** `void`

**Example**

```typescript
elysium.setPlayerPosition({ x: 250, y: 0, z: 300 });
```

---

### getNPCLOD

Returns the current LOD level for a given NPC based on its distance from the player.

```typescript
getNPCLOD(npcId: string): LODLevel
```

**Parameters**

| Name | Type | Description |
|---|---|---|
| `npcId` | `string` | The NPC to query. |

**Returns:** `LODLevel` — One of `"full"`, `"reduced"`, `"dormant"`, or `"offscreen"`.

**Example**

```typescript
const lod = elysium.getNPCLOD("npc_guard_01");
console.log(`Guard LOD: ${lod}`); // "full" | "reduced" | "dormant" | "offscreen"
```

---

## State I/O

### exportState

Serializes the entire simulation state to a portable JSON-compatible object. Use this for save/load, network sync, or hot-reload.

```typescript
exportState(): SerializedState
```

**Returns:** `SerializedState` — A JSON-serializable object containing all NPC data, world state, economy state, and plugin state.

**Example**

```typescript
const saveData = elysium.exportState();
fs.writeFileSync("save.json", JSON.stringify(saveData, null, 2));
```

---

### importState

Restores a previously exported simulation state. The current simulation is replaced entirely.

```typescript
importState(state: SerializedState): void
```

**Parameters**

| Name | Type | Description |
|---|---|---|
| `state` | `SerializedState` | The serialized state object (from `exportState`). |

**Returns:** `void`

> **Warning:** `importState` clears all existing NPCs and world state before loading. Call `stop()` before importing to avoid tick conflicts.

**Example**

```typescript
const saveData = JSON.parse(fs.readFileSync("save.json", "utf-8"));
elysium.stop();
elysium.importState(saveData);
elysium.start();
```

---

## Stats

### getStats

Returns a snapshot of current engine performance and capacity metrics.

```typescript
getStats(): ElysiumSDKStats
```

**Returns:** `ElysiumSDKStats` — See the [ElysiumSDKStats interface](#elysiumsdkstats-interface) above.

**Example**

```typescript
const stats = elysium.getStats();
console.log(`NPCs: ${stats.npcCount}/${stats.maxNPCs}`);
console.log(`Avg tick: ${stats.avgTickTimeMs.toFixed(2)}ms`);
console.log(`Events/s: ${stats.eventsPerSecond}`);
console.log(`Memory: ${stats.memoryUsageMB.toFixed(1)}MB`);
```

---

## Plugins

### getPluginManager

Returns the plugin manager instance, which controls plugin loading, unloading, and lifecycle.

```typescript
getPluginManager(): PluginManager
```

**Returns:** `PluginManager` — The singleton plugin manager.

**Key PluginManager Methods**

| Method | Signature | Description |
|---|---|---|
| `load` | `(plugin: ElysiumPlugin) => boolean` | Loads a plugin and calls its `install()` hook. |
| `unload` | `(pluginId: string) => boolean` | Unloads a plugin and calls its `uninstall()` hook. |
| `getLoadedPlugins` | `() => ElysiumPlugin[]` | Returns all currently loaded plugins. |
| `hasPermission` | `(pluginId: string, perm: PluginPermission) => boolean` | Checks whether a plugin has a granted permission. |

**Example**

```typescript
const pm = elysium.getPluginManager();
pm.load(myCustomPlugin);
console.log("Loaded plugins:", pm.getLoadedPlugins().map(p => p.manifest.id));
```

> **See the [Plugin Development Guide](./plugin-guide.md) for full details on creating plugins.**

---

## Debug Panels

### getDebugPanels

Returns the debug panel registry, which provides introspection UIs for development tools.

```typescript
getDebugPanels(): DebugPanelRegistry
```

**Returns:** `DebugPanelRegistry` — The registry, or `null` if `enableDebugPanels` was `false` in the config.

**Key DebugPanelRegistry Methods**

| Method | Signature | Description |
|---|---|---|
| `register` | `(panel: DebugPanel) => void` | Registers a debug panel. |
| `getPanels` | `() => DebugPanel[]` | Returns all registered panels. |
| `getPanel` | `(id: string) => DebugPanel | null` | Retrieves a panel by ID. |
| `render` | `(id: string) => string` | Renders a panel's content as an HTML/string snapshot. |

**Example**

```typescript
const registry = elysium.getDebugPanels();
if (registry) {
  const panels = registry.getPanels();
  for (const panel of panels) {
    console.log(panel.id, panel.title);
  }
}
```

---

## Runtime

### getRuntime

Returns the underlying `ElysiumRuntime` orchestrator instance. This provides low-level access to the cognitive module system, event bus, and scheduler. Most game code should use `ElysiumAPI` methods instead; `getRuntime()` is intended for advanced integrations and plugin development.

```typescript
getRuntime(): ElysiumRuntime
```

**Returns:** `ElysiumRuntime` — The runtime orchestrator.

**Key ElysiumRuntime Properties**

| Property | Type | Description |
|---|---|---|
| `eventBus` | `CognitiveEventBus` | The central pub/sub event bus. |
| `modules` | `CognitiveModule[]` | Array of all registered cognitive modules. |
| `scheduler` | `PerformanceScheduler` | The tick scheduler and budget manager. |
| `lodSystem` | `LODSystem` | The LOD and chunk manager. |
| `currentTick` | `number` | The current tick number. |
| `running` | `boolean` | Whether the scheduler is active. |

**Example**

```typescript
const runtime = elysium.getRuntime();
console.log("Modules:", runtime.modules.map(m => m.id));
console.log("Running:", runtime.running);
runtime.eventBus.emit("custom:ping", { from: "debug" });
```

> **Caution:** Direct runtime manipulation can destabilize the simulation. Prefer the `ElysiumAPI` facade whenever possible.

---

## Type Definitions Summary

```typescript
// Core NPC type
interface NPC {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  faction: string;
  traits: NPCTraits;
  inventory: InventoryItem[];
  goals: Goal[];
  state: NPCState;
}

interface NPCTraits {
  bravery: number;
  curiosity: number;
  sociability: number;
  aggression: number;
  intelligence: number;
}

interface NPCState {
  health: number;
  mood: string;
  currentAction: string | null;
  lastTick: number;
}

interface InventoryItem {
  itemId: string;
  quantity: number;
}

interface GoalConfig {
  name: string;
  priority: number;
  targetState: Record<string, unknown>;
  deadline?: number;
}

interface CognitiveEvent {
  type: string;
  timestamp: number;
  tick: number;
  [key: string]: unknown;
}

interface PlannedAction {
  name: string;
  cost: number;
  preconditions: Record<string, unknown>;
  effects: Record<string, unknown>;
}

interface TradeConfig {
  buyerId: string;
  sellerId: string;
  itemId: string;
  quantity?: number;
  maxPrice?: number;
}

interface TradeResult {
  success: boolean;
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  failureReason?: string;
}

type LODLevel = "full" | "reduced" | "dormant" | "offscreen";

interface SerializedState {
  worldId: string;
  tick: number;
  npcs: NPC[];
  worldState: WorldState;
  economy: Record<string, unknown>;
  plugins: Record<string, unknown>;
}
```
