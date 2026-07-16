import type {
  CognitiveEvent,
  CognitiveEventType,
  DebugPanelConfig,
  ElysiumPlugin,
  GOAPAction,
  GOAPGoal,
  LogLevel,
  NPCCore,
  NPCId,
  PluginContext,
  PluginManifest,
  PluginPermission,
  WorldState,
} from '../engine/types';
import type { ElysiumRuntime } from '../engine/elysium-runtime';
import type { DebugPanelRegistry } from './debug-panel-registry';

const REQUIRED_PERMISSIONS: PluginPermission[] = [
  'read:npc',
  'write:npc',
  'read:events',
  'write:events',
  'read:world',
  'write:world',
  'register:actions',
  'register:goals',
  'register:debug-panels',
  'register:memory-types',
  'emit:events',
];

const ALL_PERMISSIONS = new Set<PluginPermission>(REQUIRED_PERMISSIONS);

export type PluginManagerStats = {
  loadedPlugins: number;
  registeredActions: number;
  registeredGoals: number;
  pluginNames: string[];
};

export class PluginManager {
  private runtime: ElysiumRuntime;
  private debugPanels: DebugPanelRegistry;
  private plugins: Map<string, ElysiumPlugin> = new Map();
  private contexts: Map<string, PluginContext> = new Map();
  private registeredActions: Map<string, GOAPAction> = new Map();
  private registeredGoals: Map<string, GOAPGoal> = new Map();
  private grantedPermissions: Map<string, Set<PluginPermission>> = new Map();

  constructor(runtime: ElysiumRuntime, debugPanels: DebugPanelRegistry) {
    this.runtime = runtime;
    this.debugPanels = debugPanels;
  }

  load(plugin: ElysiumPlugin): void {
    this.validateManifest(plugin.manifest);
    this.checkDependencies(plugin.manifest);
    this.checkPermissions(plugin);

    const ctx = this.createContext(plugin);
    this.contexts.set(plugin.manifest.name, ctx);

    try {
      plugin.install(ctx);
      this.plugins.set(plugin.manifest.name, plugin);
      this.runtime.eventBus.emit({
        type: 'PLUGIN_LOADED',
        source: 'plugin-manager',
        data: { name: plugin.manifest.name, version: plugin.manifest.version },
      });
    } catch (err) {
      this.runtime.eventBus.emit({
        type: 'PLUGIN_ERROR',
        source: 'plugin-manager',
        data: {
          name: plugin.manifest.name,
          phase: 'install',
          error: err instanceof Error ? err.message : String(err),
        },
      });
      console.error(`[PluginManager] Failed to install plugin "${plugin.manifest.name}":`, err);
    }
  }

  unload(name: string): void {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    try {
      plugin.uninstall?.();
    } catch (err) {
      console.error(`[PluginManager] Error during uninstall of "${name}":`, err);
    }

    this.plugins.delete(name);
    this.contexts.delete(name);
    this.grantedPermissions.delete(name);

    this.runtime.eventBus.emit({
      type: 'PLUGIN_UNLOADED',
      source: 'plugin-manager',
      data: { name },
    });
  }

  getPlugin(name: string): ElysiumPlugin | undefined {
    return this.plugins.get(name);
  }

  getLoadedPlugins(): ElysiumPlugin[] {
    return [...this.plugins.values()];
  }

  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  tickAll(npcs: NPCCore[]): void {
    for (const plugin of this.plugins.values()) {
      try {
        plugin.onTick?.(npcs);
      } catch (err) {
        this.runtime.eventBus.emit({
          type: 'PLUGIN_ERROR',
          source: 'plugin-manager',
          data: {
            name: plugin.manifest.name,
            phase: 'onTick',
            error: err instanceof Error ? err.message : String(err),
          },
        });
      }
    }
  }

  handleEvent(event: CognitiveEvent): void {
    for (const plugin of this.plugins.values()) {
      try {
        plugin.onEvent?.(event);
      } catch (err) {
        this.runtime.eventBus.emit({
          type: 'PLUGIN_ERROR',
          source: 'plugin-manager',
          data: {
            name: plugin.manifest.name,
            phase: 'onEvent',
            error: err instanceof Error ? err.message : String(err),
          },
        });
      }
    }
  }

  getRegisteredActions(): GOAPAction[] {
    return [...this.registeredActions.values()];
  }

  getRegisteredGoals(): GOAPGoal[] {
    return [...this.registeredGoals.values()];
  }

  getStats(): PluginManagerStats {
    return {
      loadedPlugins: this.plugins.size,
      registeredActions: this.registeredActions.size,
      registeredGoals: this.registeredGoals.size,
      pluginNames: [...this.plugins.keys()],
    };
  }

  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.name || typeof manifest.name !== 'string') {
      throw new Error(`[PluginManager] Invalid manifest: missing or invalid "name".`);
    }
    if (!manifest.version || typeof manifest.version !== 'string') {
      throw new Error(`[PluginManager] Invalid manifest for "${manifest.name}": missing or invalid "version".`);
    }
    if (!manifest.author || typeof manifest.author !== 'string') {
      throw new Error(`[PluginManager] Invalid manifest for "${manifest.name}": missing or invalid "author".`);
    }
    if (!manifest.description || typeof manifest.description !== 'string') {
      throw new Error(`[PluginManager] Invalid manifest for "${manifest.name}": missing or invalid "description".`);
    }
  }

  private checkDependencies(manifest: PluginManifest): void {
    const deps = manifest.dependencies ?? [];
    for (const dep of deps) {
      if (!this.plugins.has(dep)) {
        throw new Error(
          `[PluginManager] Plugin "${manifest.name}" requires missing dependency "${dep}".`,
        );
      }
    }
  }

  private checkPermissions(plugin: ElysiumPlugin): void {
    const requested = plugin.manifest.permissions ?? [];
    const granted = new Set<PluginPermission>();

    for (const perm of requested) {
      if (ALL_PERMISSIONS.has(perm)) {
        granted.add(perm);
      } else {
        console.warn(
          `[PluginManager] Plugin "${plugin.manifest.name}" requested unknown permission "${perm}" — skipping.`,
        );
      }
    }

    this.grantedPermissions.set(plugin.manifest.name, granted);
  }

  private hasPermission(name: string, perm: PluginPermission): boolean {
    const granted = this.grantedPermissions.get(name);
    return granted ? granted.has(perm) : false;
  }

  private createContext(plugin: ElysiumPlugin): PluginContext {
    const pluginName = plugin.manifest.name;
    const runtime = this.runtime;

    const ctx: PluginContext = {
      runtime,
      eventBus: runtime.eventBus,
      log: (level: LogLevel, message: string, npcId?: NPCId) => {
        runtime.log(level, `[${pluginName}] ${message}`, 'plugin-manager', npcId);
      },
      registerAction: (action: GOAPAction) => {
        if (!this.hasPermission(pluginName, 'register:actions')) {
          console.warn(
            `[PluginManager] Plugin "${pluginName}" lacks "register:actions" permission — skipping action "${action.name}".`,
          );
          return;
        }
        this.registeredActions.set(action.name, action);
      },
      registerGoal: (goal: GOAPGoal) => {
        if (!this.hasPermission(pluginName, 'register:goals')) {
          console.warn(
            `[PluginManager] Plugin "${pluginName}" lacks "register:goals" permission — skipping goal "${goal.name}".`,
          );
          return;
        }
        this.registeredGoals.set(goal.name, goal);
      },
      registerDebugPanel: (panel: DebugPanelConfig) => {
        if (!this.hasPermission(pluginName, 'register:debug-panels')) {
          console.warn(
            `[PluginManager] Plugin "${pluginName}" lacks "register:debug-panels" permission — skipping panel "${panel.id}".`,
          );
          return;
        }
        this.debugPanels.register(panel);
      },
      getNPC: (npcId: NPCId) => runtime.getNPC(npcId),
      getAllNPCs: () => runtime.getAllNPCs(),
      getWorldState: (): WorldState => runtime.getWorldState(),
      emit: (event) => {
        if (!this.hasPermission(pluginName, 'emit:events')) {
          console.warn(
            `[PluginManager] Plugin "${pluginName}" lacks "emit:events" permission — skipping emit of "${event.type}".`,
          );
          return;
        }
        runtime.eventBus.emit(event);
      },
    };

    return ctx;
  }
}
