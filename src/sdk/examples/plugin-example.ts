import { ElysiumAPI } from '../public-api';
import type {
  ElysiumPlugin,
  PluginManifest,
  PluginContext,
  GOAPAction,
  GOAPGoal,
  DebugPanelConfig,
  NPCCore,
  CognitiveEvent,
} from '../../engine/types';

// ═══════════════════════════════════════════════════════════════
// Custom Plugin: Patrol & Perimeter Security
// ═══════════════════════════════════════════════════════════════

const PATROL_ACTION: GOAPAction = {
  name: 'patrol',
  cost: 3,
  preconditions: { isSafe: true },
  effects: { perimeterSecured: true },
};

const SECURE_PERIMETER_GOAL: GOAPGoal = {
  name: 'secure_perimeter',
  priority: 8,
  targetState: { perimeterSecured: true },
};

const DEBUG_PANEL: DebugPanelConfig = {
  id: 'patrol-debug-panel',
  name: 'Patrol Debugger',
  icon: 'shield',
  render: (ctx: PluginContext) => {
    const npcs = ctx.getAllNPCs();
    const patrolling = npcs.filter((n) => n.currentAction === 'patrol');
    return {
      totalNPCs: npcs.length,
      patrollingCount: patrolling.length,
      patrolNames: patrolling.map((n) => n.name),
    };
  },
};

function createPatrolPlugin(): ElysiumPlugin {
  let tickCount = 0;
  let eventCount = 0;

  const manifest: PluginManifest = {
    name: 'patrol-plugin',
    version: '1.0.0',
    author: 'Guard Captain',
    description: 'Adds patrol GOAP action, secure_perimeter goal, and a debug panel for tracking guard behavior.',
    permissions: [
      'register:actions',
      'register:goals',
      'register:debug-panels',
      'read:npc',
      'read:events',
    ],
  };

  return {
    manifest,

    install(ctx: PluginContext): void {
      ctx.log('info', 'Installing patrol plugin...', 'patrol-plugin');

      ctx.registerAction(PATROL_ACTION);
      ctx.log('info', 'Registered GOAP action: patrol', 'patrol-plugin');

      ctx.registerGoal(SECURE_PERIMETER_GOAL);
      ctx.log('info', 'Registered GOAP goal: secure_perimeter', 'patrol-plugin');

      ctx.registerDebugPanel(DEBUG_PANEL);
      ctx.log('info', 'Registered debug panel: Patrol Debugger', 'patrol-plugin');

      ctx.emit({
        type: 'PLUGIN_LOADED',
        source: 'patrol-plugin',
        data: { actions: 1, goals: 1, debugPanels: 1 },
      });
    },

    uninstall(): void {
      console.log('    [patrol-plugin] Patrol plugin uninstalled');
    },

    onTick(npcs: NPCCore[]): void {
      tickCount++;

      // Every 3 ticks, log patrol status
      if (tickCount % 3 === 0) {
        const patrolling = npcs.filter((n) => n.currentAction === 'patrol');
        if (patrolling.length > 0) {
          console.log(`    [patrol-plugin] tick ${tickCount}: ${patrolling.length} NPC(s) on patrol`);
        }
      }
    },

    onEvent(event: CognitiveEvent): void {
      eventCount++;

      if (event.type === 'DECISION_MADE' && event.data?.action === 'patrol') {
        console.log(`    [patrol-plugin] ${event.npcId} decided to patrol!`);
      }

      if (event.type === 'GOAL_COMPLETED' && event.npcId) {
        console.log(`    [patrol-plugin] Goal completed for ${event.npcId}`);
      }
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// Main Example
// ═══════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Elysium Engine — Plugin Development Example');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  // ── 1. Create API instance ──────────────────────────────
  console.log('▶ Creating ElysiumAPI instance...');
  const api = new ElysiumAPI({
    autoStart: false,
    tickIntervalMs: 1000,
  maxNPCs: 500,
  enableCache: true,
  enableBatchWrites: true,
    enablePersistence: false,
  });
  console.log('  ✓ API created');
  console.log('');

  // ── 2. Create some NPCs ──────────────────────────────────
  console.log('▶ Creating NPCs...');
  const guard1 = api.createNPC({
    id: 'guard-1',
    name: 'Sentinel Bram',
    age: 32,
    personality: {
      openness: 30,
      conscientiousness: 90,
      extraversion: 35,
      agreeableness: 40,
      neuroticism: 55,
    },
    position: { x: 40, y: -30 },
  });

  const guard2 = api.createNPC({
    id: 'guard-2',
    name: 'Sentinel Vera',
    age: 27,
    personality: {
      openness: 45,
      conscientiousness: 85,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 40,
    },
    position: { x: 35, y: -25 },
  });

  const civilian = api.createNPC({
    id: 'civilian-1',
    name: 'Tomas the Baker',
    age: 50,
    personality: {
      openness: 55,
      conscientiousness: 60,
      extraversion: 65,
      agreeableness: 70,
      neuroticism: 30,
    },
    position: { x: 0, y: 0 },
  });

  console.log(`  ✓ Created: ${guard1.name}, ${guard2.name}, ${civilian.name}`);
  console.log('');

  // ── 3. Create and load the plugin ───────────────────────
  console.log('▶ Creating patrol plugin...');
  const patrolPlugin = createPatrolPlugin();
  console.log(`  ✓ Plugin manifest: ${patrolPlugin.manifest.name} v${patrolPlugin.manifest.version}`);
  console.log(`    ${patrolPlugin.manifest.description}`);
  console.log('');

  console.log('▶ Loading plugin via API...');
  const pluginManager = api.getPluginManager();
  pluginManager.load(patrolPlugin);
  console.log(`  ✓ Plugin loaded. Loaded plugins: ${pluginManager.getLoadedPlugins().join(', ')}`);
  console.log('');

  // ── 4. Verify registered actions and goals ──────────────
  console.log('▶ Verifying plugin registrations...');
  const registeredActions = pluginManager.getRegisteredActions();
  const registeredGoals = pluginManager.getRegisteredGoals();
  const debugPanels = api.getDebugPanels().getAllPanels();

  console.log(`  ✓ Registered actions: ${registeredActions.map((a) => a.name).join(', ')}`);
  console.log(`  ✓ Registered goals: ${registeredGoals.map((g) => g.name).join(', ')}`);
  console.log(`  ✓ Debug panels: ${debugPanels.map((p) => p.name).join(', ')}`);
  console.log('');

  // ── 5. Set the plugin's goal on guard NPCs ───────────────
  console.log('▶ Assigning secure_perimeter goal to guards...');
  api.setGoal('guard-1', SECURE_PERIMETER_GOAL);
  api.setGoal('guard-2', SECURE_PERIMETER_GOAL);
  console.log('  ✓ Goals assigned');
  console.log('');

  // ── 6. Run simulation with the plugin active ────────────
  console.log('▶ Running simulation with plugin active...');
  for (let i = 1; i <= 6; i++) {
    api.tick();
    console.log(`  ✓ Tick ${i} complete`);
  }
  console.log('');

  // ── 7. Check NPC states after simulation ────────────────
  console.log('▶ NPC states after simulation:');
  for (const npc of api.getAllNPCs()) {
    console.log(`  ${npc.name}:`);
    console.log(`    action: ${npc.currentAction ?? 'idle'}`);
    console.log(`    mood:   ${npc.emotions.mood}`);
    console.log(`    goal:   ${npc.currentGoal?.name ?? 'none'}`);
  }
  console.log('');

  // ── 8. Render the debug panel ───────────────────────────
  console.log('▶ Rendering debug panel...');
  const panel = api.getDebugPanels().getPanel('patrol-debug-panel');
  if (panel) {
    const rendered = panel.render({
      runtime: api.getRuntime(),
      eventBus: api.getRuntime().eventBus,
      log: () => {},
      registerAction: () => {},
      registerGoal: () => {},
      registerDebugPanel: () => {},
      getNPC: (id) => api.getNPC(id),
      getAllNPCs: () => api.getAllNPCs(),
      getWorldState: () => api.getWorldState(),
      emit: () => {},
    });
    console.log(`  Panel: ${panel.name}`);
    console.log(`  Rendered data: ${JSON.stringify(rendered)}`);
  }
  console.log('');

  // ── 9. SDK stats ────────────────────────────────────────
  console.log('▶ SDK stats:');
  const stats = api.getStats();
  console.log(`  Registered plugins:      ${stats.registeredPlugins}`);
  console.log(`  Registered actions:      ${stats.registeredActions}`);
  console.log(`  Registered goals:        ${stats.registeredGoals}`);
  console.log(`  Registered debug panels: ${stats.registeredDebugPanels}`);
  console.log(`  API calls:               ${stats.apiCalls}`);
  console.log('');

  // ── 10. Unload the plugin ────────────────────────────────
  console.log('▶ Unloading plugin...');
  pluginManager.unload('patrol-plugin');
  console.log(`  ✓ Plugin unloaded. Remaining plugins: ${pluginManager.getLoadedPlugins().length}`);
  console.log(`  ✓ Registered actions after unload: ${pluginManager.getRegisteredActions().length}`);
  console.log(`  ✓ Registered goals after unload: ${pluginManager.getRegisteredGoals().length}`);
  console.log('');

  // ── 11. Run a tick without the plugin ────────────────────
  console.log('▶ Running one more tick without plugin...');
  api.tick();
  console.log('  ✓ Tick complete (no plugin active)');
  console.log('');

  // ── 12. Clean shutdown ───────────────────────────────────
  console.log('▶ Shutting down...');
  api.stop();
  console.log('  ✓ Clean shutdown complete');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Plugin example complete!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
}

main().catch((err) => {
  console.error('Example failed:', err);
  const g = globalThis as any;
  if (g.process && typeof g.process.exit === 'function') {
    g.process.exit(1);
  }
});
