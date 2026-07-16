# Elysium Engine — Plugin Development Guide

A complete guide to building, registering, and distributing plugins for the Elysium Engine. Plugins are the primary extensibility mechanism — they can add custom GOAP actions, goals, debug panels, event handlers, and world behaviors without modifying engine internals.

---

## Table of Contents

- [What Is a Plugin?](#what-is-a-plugin)
- [Plugin Anatomy](#plugin-anatomy)
- [Core Interfaces](#core-interfaces)
  - [PluginManifest](#pluginmanifest-interface)
  - [PluginPermission](#pluginpermission-union)
  - [PluginContext](#plugincontext-interface)
  - [ElysiumPlugin](#elysiumplugin-interface)
- [Creating a Simple Plugin](#creating-a-simple-plugin)
- [Registering Custom GOAP Actions](#registering-custom-goap-actions)
- [Registering Custom Goals](#registering-custom-goals)
- [Registering Debug Panels](#registering-debug-panels)
- [Plugin Dependencies](#plugin-dependencies)
- [Permission System](#permission-system)
- [Loading and Unloading Plugins](#loading-and-unloading-plugins)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Full Plugin Example](#full-plugin-example)

---

## What Is a Plugin?

A plugin is a self-contained module that extends the Elysium Engine's behavior at runtime. Plugins can:

- **Register custom GOAP actions** — new behaviors NPCs can use in their plans.
- **Register custom goals** — new objectives the planner can pursue.
- **Listen to and emit events** — react to simulation events and inject new ones.
- **Run per-tick logic** — execute custom code every simulation step.
- **Register debug panels** — add introspection UIs for development tools.
- **Modify world state** — influence economy, factions, weather, and more.

Plugins are sandboxed by a permission system: each plugin declares what it needs to do, and the host application grants or denies those permissions at load time.

---

## Plugin Anatomy

Every plugin is a JavaScript/TypeScript module that exports an object implementing the `ElysiumPlugin` interface. The plugin lifecycle consists of five hooks:

```
┌─────────────────────────────────────────────────────┐
│                    ElysiumPlugin                     │
│                                                      │
│  ┌──────────────┐  ┌───────────┐  ┌───────────────┐  │
│  │  manifest    │  │  install  │  │  onTick       │  │
│  │  (metadata)  │  │  (setup)  │  │  (per-step)   │  │
│  └──────────────┘  └───────────┘  └───────────────┘  │
│                                                      │
│  ┌──────────────┐  ┌───────────────────────────┐    │
│  │  onEvent     │  │  uninstall (teardown)     │    │
│  │  (reactive)  │  │                           │    │
│  └──────────────┘  └───────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

| Hook | When It Runs | Purpose |
|---|---|---|
| `manifest` | At load time, before `install`. | Declares plugin identity, permissions, and dependencies. |
| `install` | Once, when the plugin is loaded. | Register actions, goals, panels, and event subscriptions. |
| `onTick` | Every simulation tick while loaded. | Custom per-step logic (movement, timers, environment). |
| `onEvent` | Whenever a subscribed event fires. | Reactive logic in response to simulation events. |
| `uninstall` | Once, when the plugin is unloaded. | Clean up resources, remove registrations. |

---

## Core Interfaces

### PluginManifest Interface

The manifest is a static metadata object that describes the plugin to the engine and the host application.

```typescript
interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  permissions: PluginPermission[];
  dependencies: PluginDependency[];
  optionalDependencies?: PluginDependency[];
  minEngineVersion: string;
  configSchema?: Record<string, unknown>;
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique plugin identifier. Should be a namespaced string (e.g., `"com.studio.weather"`). |
| `name` | `string` | Yes | Human-readable display name. |
| `version` | `string` | Yes | Semantic version string (e.g., `"1.0.0"`). |
| `author` | `string` | Yes | Author or organization name. |
| `description` | `string` | Yes | Short description of what the plugin does. |
| `permissions` | `PluginPermission[]` | Yes | List of permissions the plugin requests. All must be granted for the plugin to load. |
| `dependencies` | `PluginDependency[]` | Yes | Other plugins that must be loaded first. Can be an empty array. |
| `optionalDependencies` | `PluginDependency[]` | No | Plugins that enhance this plugin but are not required. |
| `minEngineVersion` | `string` | Yes | Minimum Elysium Engine version required. |
| `configSchema` | `Record<string, unknown>` | No | JSON schema for plugin-specific configuration. |

#### PluginDependency

```typescript
interface PluginDependency {
  id: string;
  minVersion: string;
}
```

---

### PluginPermission Union

Permissions control what a plugin is allowed to do. The host application must grant every requested permission at load time; if any are denied, the plugin will not load.

There are **11 permissions**:

| Permission | Description |
|---|---|
| `"npc:read"` | Read NPC state (positions, traits, inventory, goals). |
| `"npc:write"` | Modify NPC state (health, position, inventory, mood). |
| `"npc:create"` | Create and remove NPCs. |
| `"goal:register"` | Register custom goal types with the planner. |
| `"action:register"` | Register custom GOAP actions. |
| `"event:read"` | Subscribe to events on the cognitive event bus. |
| `"event:emit"` | Emit events onto the cognitive event bus. |
| `"world:read"` | Read world state (time, weather, factions, flags). |
| `"world:write"` | Modify world state (set flags, change weather, alter faction relations). |
| `"economy:trade"` | Execute trades and modify market prices. |
| `"debug:panel"` | Register debug panels with the `DebugPanelRegistry`. |

```typescript
type PluginPermission =
  | "npc:read"
  | "npc:write"
  | "npc:create"
  | "goal:register"
  | "action:register"
  | "event:read"
  | "event:emit"
  | "world:read"
  | "world:write"
  | "economy:trade"
  | "debug:panel";
```

---

### PluginContext Interface

The `PluginContext` is passed to `install()`, `onTick()`, `onEvent()`, and `uninstall()`. It provides controlled access to the engine's subsystems, scoped to the plugin's granted permissions.

```typescript
interface PluginContext {
  // NPC access
  getNPC(npcId: string): NPC | null;
  getAllNPCs(): NPC[];
  createNPC(config: NPCCreateConfig): NPC;
  removeNPC(npcId: string): boolean;
  modifyNPC(npcId: string, changes: Partial<NPC>): void;

  // Goal & action registration
  registerGoal(goal: GoalDefinition): void;
  registerAction(action: ActionDefinition): void;
  unregisterGoal(goalName: string): void;
  unregisterAction(actionName: string): void;

  // Event bus
  subscribe(eventType: string, callback: (event: CognitiveEvent) => void): () => void;
  emit(eventType: string, payload: Record<string, unknown>): void;

  // World
  getWorldState(): WorldState;
  setWorldFlag(flag: string, value: boolean): void;
  triggerWorldEvent(eventName: string, payload?: Record<string, unknown>): void;

  // Economy
  getPrice(itemId: string, locationId?: string): number;
  trade(config: TradeConfig): TradeResult;

  // Debug
  registerDebugPanel(panel: DebugPanel): void;
  unregisterDebugPanel(panelId: string): void;

  // Plugin metadata
  pluginId: string;
  config: Record<string, unknown>;

  // Logging
  log(level: "info" | "warn" | "error", message: string, data?: unknown): void;
}
```

| Method | Permission Required | Description |
|---|---|---|
| `getNPC` | `npc:read` | Retrieve a single NPC by ID. |
| `getAllNPCs` | `npc:read` | Retrieve all live NPCs. |
| `createNPC` | `npc:create` | Create a new NPC. |
| `removeNPC` | `npc:create` | Remove an NPC. |
| `modifyNPC` | `npc:write` | Apply partial updates to an NPC. |
| `registerGoal` | `goal:register` | Register a custom goal type. |
| `registerAction` | `action:register` | Register a custom GOAP action. |
| `unregisterGoal` | `goal:register` | Remove a previously registered goal. |
| `unregisterAction` | `action:register` | Remove a previously registered action. |
| `subscribe` | `event:read` | Subscribe to events. |
| `emit` | `event:emit` | Emit events. |
| `getWorldState` | `world:read` | Read world state. |
| `setWorldFlag` | `world:write` | Set a global world flag. |
| `triggerWorldEvent` | `world:write` | Fire a world event. |
| `getPrice` | `economy:trade` | Query market price. |
| `trade` | `economy:trade` | Execute a trade. |
| `registerDebugPanel` | `debug:panel` | Register a debug panel. |
| `unregisterDebugPanel` | `debug:panel` | Remove a debug panel. |
| `log` | _none_ | Write to the engine log. Always available. |
| `pluginId` | _none_ | This plugin's ID. |
| `config` | _none_ | Plugin-specific config from the host. |

---

### ElysiumPlugin Interface

The complete interface a plugin module must implement:

```typescript
interface ElysiumPlugin {
  manifest: PluginManifest;

  install(context: PluginContext): void;

  onTick(context: PluginContext, deltaTime: number): void;

  onEvent(context: PluginContext, event: CognitiveEvent): void;

  uninstall(context: PluginContext): void;
}
```

| Method | Required | Description |
|---|---|---|
| `manifest` | Yes | Static metadata object. |
| `install` | Yes | Called once when the plugin is loaded. Use for registration. |
| `onTick` | No | Called every simulation tick. Omit if the plugin is purely reactive. |
| `onEvent` | No | Called for events the plugin subscribed to during `install`. Omit if the plugin does not react to events. |
| `uninstall` | Yes | Called once when the plugin is unloaded. Clean up all resources. |

---

## Creating a Simple Plugin

This minimal plugin logs a message every tick and reacts to NPC speech events.

```typescript
import type { ElysiumPlugin, PluginContext, CognitiveEvent } from "@elysium/engine";

export const heartbeatPlugin: ElysiumPlugin = {
  manifest: {
    id: "com.studio.heartbeat",
    name: "Heartbeat Monitor",
    version: "1.0.0",
    author: "Game Studio",
    description: "Logs a heartbeat every tick and monitors NPC speech.",
    permissions: ["event:read", "npc:read"],
    dependencies: [],
    minEngineVersion: "5.0.0",
  },

  install(ctx: PluginContext) {
    ctx.log("info", "Heartbeat plugin installed");
    ctx.subscribe("npc:speech", (event: CognitiveEvent) => {
      ctx.log("info", `NPC ${event.npcId} spoke: ${event.text}`);
    });
  },

  onTick(ctx: PluginContext, deltaTime: number) {
    ctx.log("info", `Tick (dt=${deltaTime}ms) — NPCs: ${ctx.getAllNPCs().length}`);
  },

  onEvent(ctx: PluginContext, event: CognitiveEvent) {
    // Generic event handler — called for any subscribed event
  },

  uninstall(ctx: PluginContext) {
    ctx.log("info", "Heartbeat plugin uninstalled");
  },
};
```

---

## Registering Custom GOAP Actions

GOAP actions are the building blocks of NPC plans. Each action has preconditions (what must be true to execute it) and effects (how it changes the world state).

```typescript
interface ActionDefinition {
  name: string;
  cost: number;
  preconditions: Record<string, unknown>;
  effects: Record<string, unknown>;
  execute: (npc: NPC, context: PluginContext) => Promise<ActionExecutionResult>;
}

interface ActionExecutionResult {
  success: boolean;
  stateChanges?: Record<string, unknown>;
}
```

### Example: "Craft Item" Action

```typescript
export const craftingPlugin: ElysiumPlugin = {
  manifest: {
    id: "com.studio.crafting",
    name: "Crafting System",
    version: "1.0.0",
    author: "Game Studio",
    description: "Adds crafting actions for NPCs.",
    permissions: ["action:register", "npc:read", "npc:write"],
    dependencies: [],
    minEngineVersion: "5.0.0",
  },

  install(ctx: PluginContext) {
    ctx.registerAction({
      name: "craft_item",
      cost: 3,
      preconditions: {
        hasItem: "raw_material",
        nearStation: "crafting_table",
      },
      effects: {
        hasItem: "crafted_good",
        removeItem: "raw_material",
      },
      async execute(npc, ctx) {
        // Check the NPC actually has the material
        const material = npc.inventory.find(i => i.itemId === "raw_material");
        if (!material || material.quantity < 1) {
          return { success: false };
        }

        // Apply the craft
        ctx.modifyNPC(npc.id, {
          inventory: [
            ...npc.inventory.filter(i => i.itemId !== "raw_material"),
            { itemId: "crafted_good", quantity: 1 },
          ],
        });

        return {
          success: true,
          stateChanges: { craftedItem: "crafted_good" },
        };
      },
    });
  },

  onTick() {},
  onEvent() {},

  uninstall(ctx: PluginContext) {
    ctx.unregisterAction("craft_item");
  },
};
```

---

## Registering Custom Goals

Custom goals tell the planner what desired states NPCs can pursue. A goal definition includes an evaluator that determines whether the goal is currently satisfied.

```typescript
interface GoalDefinition {
  name: string;
  priority: number;
  targetState: Record<string, unknown>;
  isSatisfied: (npc: NPC, context: PluginContext) => boolean;
  canPursue?: (npc: NPC, context: PluginContext) => boolean;
}
```

### Example: "Acquire Rare Gem" Goal

```typescript
ctx.registerGoal({
  name: "acquire_rare_gem",
  priority: 0.75,
  targetState: { hasItem: "rare_gem" },

  isSatisfied(npc, ctx) {
    return npc.inventory.some(i => i.itemId === "rare_gem");
  },

  canPursue(npc, ctx) {
    // Only merchants with enough gold should pursue this goal
    const gold = npc.inventory.find(i => i.itemId === "gold");
    return gold !== undefined && gold.quantity >= 500;
  },
});
```

The planner will automatically combine registered goals with registered actions to generate action sequences. When `setGoal` is called on an NPC with a goal name that matches a registered `GoalDefinition`, the planner uses that definition's `targetState` and satisfaction check.

---

## Registering Debug Panels

Debug panels provide introspection UIs for development tools. A panel is a self-contained view that renders a snapshot of engine or plugin state.

```typescript
interface DebugPanel {
  id: string;
  title: string;
  render: (context: PluginContext) => string;
  refreshRate: number; // in Hz
}
```

### Example: NPC Census Panel

```typescript
export const censusPlugin: ElysiumPlugin = {
  manifest: {
    id: "com.studio.census",
    name: "NPC Census Debug Panel",
    version: "1.0.0",
    author: "Game Studio",
    description: "Shows a live census of all NPCs.",
    permissions: ["debug:panel", "npc:read"],
    dependencies: [],
    minEngineVersion: "5.0.0",
  },

  install(ctx: PluginContext) {
    ctx.registerDebugPanel({
      id: "npc_census",
      title: "NPC Census",
      refreshRate: 5,
      render(ctx) {
        const npcs = ctx.getAllNPCs();
        const rows = npcs.map(n =>
          `<tr><td>${n.id}</td><td>${n.name}</td><td>${n.faction}</td><td>${n.state.health}</td></tr>`
        ).join("");
        return `<table>${rows}</table>`;
      },
    });
  },

  onTick() {},
  onEvent() {},

  uninstall(ctx: PluginContext) {
    ctx.unregisterDebugPanel("npc_census");
  },
};
```

---

## Plugin Dependencies

Plugins can declare dependencies on other plugins. The plugin manager resolves load order automatically.

```typescript
manifest: {
  // ...
  dependencies: [
    { id: "com.studio.economy", minVersion: "1.2.0" },
    { id: "com.studio.factions", minVersion: "2.0.0" },
  ],
  optionalDependencies: [
    { id: "com.studio.weather", minVersion: "1.0.0" },
  ],
}
```

### Dependency Resolution Rules

1. **Hard dependencies** must be loaded and installed before this plugin. If a required dependency is missing or its version is too low, the plugin will not load and an error is logged.
2. **Optional dependencies** are loaded if available but do not block loading. Use `ctx.config` or check at runtime whether an optional dependency is present.
3. **Circular dependencies** are detected and rejected at load time.
4. The plugin manager performs a topological sort to determine load order.

---

## Permission System

The permission system is the security boundary between plugins and the engine. It ensures that a plugin cannot access subsystems the host application has not authorized.

### How It Works

1. The plugin declares required permissions in `manifest.permissions`.
2. The host application (or the engine config) specifies which permissions are granted.
3. At load time, the plugin manager checks that every requested permission is granted.
4. If any permission is missing, the plugin does not load and an error is logged.
5. At runtime, `PluginContext` methods that require a permission will throw if the permission was not granted (defense in depth).

### Granting Permissions

```typescript
const elysium = new ElysiumAPI({
  // ... other config ...
  plugins: ["com.studio.crafting"],
  pluginPermissions: {
    "com.studio.crafting": ["action:register", "npc:read", "npc:write"],
  },
});
```

Or programmatically:

```typescript
const pm = elysium.getPluginManager();
pm.grantPermissions("com.studio.crafting", ["action:register", "npc:read", "npc:write"]);
pm.load(craftingPlugin);
```

### Checking Permissions at Runtime

```typescript
onTick(ctx: PluginContext) {
  if (ctx.hasPermission("economy:trade")) {
    const price = ctx.getPrice("steel_sword");
    // ...
  }
}
```

---

## Loading and Unloading Plugins

### Loading

```typescript
const pm = elysium.getPluginManager();

// Load a single plugin
const loaded = pm.load(craftingPlugin);
console.log(loaded ? "Loaded" : "Failed to load");

// Load multiple plugins (order is resolved by dependencies)
pm.load(craftingPlugin);
pm.load(censusPlugin);
pm.load(weatherPlugin);
```

### Unloading

```typescript
// Unload a specific plugin
const unloaded = pm.unload("com.studio.crafting");
console.log(unloaded ? "Unloaded" : "Not found");

// Unload all plugins (e.g., on shutdown)
pm.unloadAll();
```

### Auto-Loading from Config

Plugins listed in `PublicAPIConfig.plugins` are auto-loaded on construction:

```typescript
const elysium = new ElysiumAPI({
  // ...
  plugins: ["com.studio.crafting", "com.studio.weather"],
});
```

---

## Error Handling

### Install Errors

If `install()` throws, the plugin manager catches the error, logs it, and marks the plugin as failed. The plugin's `uninstall()` is called to clean up any partial registrations.

```typescript
install(ctx: PluginContext) {
  try {
    ctx.registerAction(myAction);
  } catch (err) {
    ctx.log("error", "Failed to register action", err);
    throw err; // Re-throw to fail the plugin load
  }
}
```

### Tick and Event Errors

Errors thrown in `onTick()` or `onEvent()` are caught by the engine, logged, and do not crash the simulation. The plugin continues to receive ticks and events. Repeated errors will trigger a warning log.

### Best Practice: Guard External Calls

```typescript
onTick(ctx: PluginContext, dt: number) {
  try {
    const npcs = ctx.getAllNPCs();
    for (const npc of npcs) {
      this.processNPC(npc, ctx, dt);
    }
  } catch (err) {
    ctx.log("error", "Tick processing failed", err);
  }
}
```

### Uninstall Safety

`uninstall()` should be idempotent — it may be called even if `install()` partially failed. Always guard cleanup:

```typescript
uninstall(ctx: PluginContext) {
  try { ctx.unregisterAction("craft_item"); } catch {}
  try { ctx.unregisterDebugPanel("npc_census"); } catch {}
  ctx.log("info", "Plugin cleaned up");
}
```

---

## Best Practices

### 1. Request Minimal Permissions

Only request the permissions your plugin actually needs. This builds trust with host applications and reduces the attack surface.

```typescript
// Bad — requests everything
permissions: ["npc:read", "npc:write", "npc:create", "world:write", "economy:trade"]

// Good — requests only what's needed
permissions: ["npc:read", "event:emit"]
```

### 2. Keep onTick Lean

`onTick` runs every simulation step. Avoid expensive operations:

- Cache results across ticks when possible.
- Use LOD to skip processing for distant NPCs.
- Avoid synchronous I/O (file reads, network calls).

```typescript
onTick(ctx: PluginContext, dt: number) {
  // Only process nearby NPCs
  const npcs = ctx.getAllNPCs().filter(n =>
    this.distanceToPlayer(n) < 200
  );
  for (const npc of npcs) {
    this.update(npc, dt);
  }
}
```

### 3. Use Semantic Versioning

Follow semver in your `manifest.version` and `minEngineVersion`. Bump the major version when you introduce breaking changes to your plugin's API or registered actions/goals.

### 4. Clean Up Everything in uninstall

Every resource registered in `install()` must be unregistered in `uninstall()`:

- `registerAction` → `unregisterAction`
- `registerGoal` → `unregisterGoal`
- `registerDebugPanel` → `unregisterDebugPanel`
- `subscribe` → call the returned unsubscribe function

```typescript
private unsubscribers: (() => void)[] = [];

install(ctx: PluginContext) {
  this.unsubscribers.push(ctx.subscribe("npc:speech", this.onSpeech));
  this.unsubscribers.push(ctx.subscribe("combat:hit", this.onHit));
}

uninstall(ctx: PluginContext) {
  for (const unsub of this.unsubscribers) unsub();
  this.unsubscribers = [];
}
```

### 5. Namespace Your IDs

Use reverse-DNS notation for plugin IDs and prefix all action/goal/panel names to avoid collisions with other plugins:

```typescript
manifest: {
  id: "com.studio.weather",
  // ...
}

// Actions
ctx.registerAction({ name: "weather:seek_shelter", /* ... */ });

// Goals
ctx.registerGoal({ name: "weather:avoid_storm", /* ... */ });

// Debug panels
ctx.registerDebugPanel({ id: "weather:forecast", /* ... */ });
```

### 6. Document Your Config Schema

Use `configSchema` in the manifest so host applications know what configuration your plugin accepts:

```typescript
manifest: {
  // ...
  configSchema: {
    type: "object",
    properties: {
      stormFrequency: { type: "number", default: 0.1, minimum: 0, maximum: 1 },
      maxRainDuration: { type: "number", default: 300, minimum: 0 },
    },
  },
}
```

### 7. Log Meaningfully

Use appropriate log levels:

- `info` — lifecycle events (install, uninstall, config changes).
- `warn` — degraded behavior (missing optional dependency, fallback path).
- `error` — failures that affect plugin functionality.

---

## Full Plugin Example

The following plugin implements a complete day/night weather system that influences NPC behavior. It registers a custom goal, a custom action, a debug panel, and reacts to world events.

```typescript
import type {
  ElysiumPlugin,
  PluginContext,
  CognitiveEvent,
  NPC,
} from "@elysium/engine";

interface WeatherConfig {
  stormChance: number;
  maxStormDuration: number;
}

export const weatherPlugin: ElysiumPlugin = {
  manifest: {
    id: "com.studio.weather",
    name: "Dynamic Weather System",
    version: "1.2.0",
    author: "Game Studio",
    description: "Simulates dynamic weather with storms that influence NPC behavior.",
    permissions: [
      "world:read",
      "world:write",
      "event:read",
      "event:emit",
      "goal:register",
      "action:register",
      "npc:read",
      "npc:write",
      "debug:panel",
    ],
    dependencies: [],
    minEngineVersion: "5.0.0",
    configSchema: {
      type: "object",
      properties: {
        stormChance: { type: "number", default: 0.05, minimum: 0, maximum: 1 },
        maxStormDuration: { type: "number", default: 600, minimum: 0 },
      },
    },
  },

  // Internal state
  _unsubscribers: [] as (() => void)[],
  _stormActive: false,
  _stormTicksRemaining: 0,
  _config: { stormChance: 0.05, maxStormDuration: 600 } as WeatherConfig,

  install(ctx: PluginContext) {
    // Merge user config
    const userConfig = (ctx.config || {}) as Partial<WeatherConfig>;
    this._config = { ...this._config, ...userConfig };

    ctx.log("info", `Weather system installed (stormChance=${this._config.stormChance})`);

    // --- Register custom goal: seek shelter during storms ---
    ctx.registerGoal({
      name: "weather:seek_shelter",
      priority: 0.95, // Very high priority during storms
      targetState: { isSheltered: true },

      isSatisfied(npc: NPC, ctx: PluginContext) {
        const state = npc.state as any;
        return state.isSheltered === true;
      },

      canPursue(npc: NPC, ctx: PluginContext) {
        // Only pursue if a storm is active
        const world = ctx.getWorldState();
        return world.weather === "storm";
      },
    });

    // --- Register custom action: move to shelter ---
    ctx.registerAction({
      name: "weather:move_to_shelter",
      cost: 2,
      preconditions: {
        isSheltered: false,
      },
      effects: {
        isSheltered: true,
      },
      async execute(npc: NPC, ctx: PluginContext) {
        // Find nearest shelter (simplified — in production, query a spatial index)
        ctx.modifyNPC(npc.id, {
          state: { ...npc.state, isSheltered: true, mood: "relieved" } as any,
        });

        ctx.emit("weather:npc_sheltered", { npcId: npc.id });
        return { success: true, stateChanges: { isSheltered: true } };
      },
    });

    // --- Subscribe to world events ---
    this._unsubscribers.push(
      ctx.subscribe("world:event", (event: CognitiveEvent) => {
        if (event.eventName === "storm_started") {
          this._stormActive = true;
          this._stormTicksRemaining = this._config.maxStormDuration;
          ctx.log("warn", "Storm began — NPCs seeking shelter");
        }
      })
    );

    // --- Register debug panel ---
    ctx.registerDebugPanel({
      id: "weather:status",
      title: "Weather Status",
      refreshRate: 2,
      render(ctx: PluginContext) {
        const world = ctx.getWorldState();
        return `
          <div class="weather-panel">
            <h3>Weather: ${world.weather}</h3>
            <p>Storm active: ${this._stormActive ? "Yes" : "No"}</p>
            <p>Storm ticks remaining: ${this._stormTicksRemaining}</p>
            <p>Time: ${world.time}s (${world.dayCycle})</p>
          </div>
        `;
      },
    });
  },

  onTick(ctx: PluginContext, dt: number) {
    // Manage storm lifecycle
    if (this._stormActive) {
      this._stormTicksRemaining--;
      if (this._stormTicksRemaining <= 0) {
        this._stormActive = false;
        ctx.setWorldFlag("storm_active", false);
        ctx.emit("weather:storm_ended", { duration: this._config.maxStormDuration });
        ctx.log("info", "Storm ended");
      }
    } else {
      // Random chance to start a storm
      if (Math.random() < this._config.stormChance) {
        this._stormActive = true;
        this._stormTicksRemaining = this._config.maxStormDuration;
        ctx.setWorldFlag("storm_active", true);
        ctx.triggerWorldEvent("storm_started", {
          severity: "moderate",
          duration: this._config.maxStormDuration,
        });
        ctx.log("warn", "Storm triggered by weather system");
      }
    }

    // Reset sheltered status when no storm
    if (!this._stormActive) {
      const npcs = ctx.getAllNPCs();
      for (const npc of npcs) {
        const state = npc.state as any;
        if (state.isSheltered) {
          ctx.modifyNPC(npc.id, {
            state: { ...npc.state, isSheltered: false, mood: "calm" } as any,
          });
        }
      }
    }
  },

  onEvent(ctx: PluginContext, event: CognitiveEvent) {
    if (event.type === "weather:npc_sheltered") {
      ctx.log("info", `NPC ${event.npcId} reached shelter`);
    }
  },

  uninstall(ctx: PluginContext) {
    // Clean up all registrations
    for (const unsub of this._unsubscribers) {
      try { unsub(); } catch {}
    }
    this._unsubscribers = [];

    try { ctx.unregisterGoal("weather:seek_shelter"); } catch {}
    try { ctx.unregisterAction("weather:move_to_shelter"); } catch {}
    try { ctx.unregisterDebugPanel("weather:status"); } catch {}

    // Clear storm state
    ctx.setWorldFlag("storm_active", false);

    ctx.log("info", "Weather system uninstalled");
  },
};
```

---

## Further Reading

- **[Quick Start Guide](./quickstart.md)** — Get running in five minutes.
- **[Public API Reference](./api-reference.md)** — Complete method documentation.
- **[Architecture Overview](./architecture.md)** — Understand the cognitive module system and event bus.
