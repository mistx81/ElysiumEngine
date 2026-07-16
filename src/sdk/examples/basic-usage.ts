import { ElysiumAPI } from '../public-api';

async function main(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Elysium Engine — Basic Usage Example');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  // ── 1. Creating an API instance ──────────────────────────
  console.log('▶ Creating ElysiumAPI instance...');
  const api = new ElysiumAPI({
    autoStart: false,
    tickIntervalMs: 1000,
    maxNPCs: 1000,
    enableCache: true,
    enableBatchWrites: true,
    enablePersistence: true,
  });
  console.log('  ✓ API created');
  console.log('');

  // ── 2. Creating NPCs with custom personalities ──────────
  console.log('▶ Creating NPCs with custom personalities...');
  const aldric = api.createNPC({
    id: 'aldric',
    name: 'Aldric the Merchant',
    age: 42,
    personality: {
      openness: 70,
      conscientiousness: 80,
      extraversion: 65,
      agreeableness: 55,
      neuroticism: 35,
    },
    wallet: 250,
    position: { x: 50, y: 0 },
  });

  const mira = api.createNPC({
    id: 'mira',
    name: 'Mira the Healer',
    age: 28,
    personality: {
      openness: 60,
      conscientiousness: 75,
      extraversion: 50,
      agreeableness: 85,
      neuroticism: 45,
    },
    wallet: 120,
    position: { x: 0, y: -40 },
  });

  const thorne = api.createNPC({
    id: 'thorne',
    name: 'Thorne the Guard',
    age: 35,
    personality: {
      openness: 30,
      conscientiousness: 90,
      extraversion: 40,
      agreeableness: 30,
      neuroticism: 60,
    },
    wallet: 80,
    position: { x: 40, y: -30 },
  });

  console.log(`  ✓ Created: ${aldric.name}, ${mira.name}, ${thorne.name}`);
  console.log(`  ✓ Total NPCs: ${api.getAllNPCs().length}`);
  console.log('');

  // ── 3. Setting goals ─────────────────────────────────────
  console.log('▶ Setting goals for NPCs...');
  api.setGoal('aldric', {
    name: 'earnGold',
    priority: 8,
    targetState: { earnedMoney: true },
  });

  api.setGoal('mira', {
    name: 'helpOthers',
    priority: 7,
    targetState: { helped: true },
  });

  api.setGoal('thorne', {
    name: 'patrolTown',
    priority: 9,
    targetState: { isSafe: true },
  });

  console.log('  ✓ Goals set for all NPCs');
  console.log(`    Aldric → ${aldric.currentGoal?.name}`);
  console.log(`    Mira  → ${mira.currentGoal?.name}`);
  console.log(`    Thorne → ${thorne.currentGoal?.name}`);
  console.log('');

  // ── 4. Subscribing to events ──────────────────────────────
  console.log('▶ Subscribing to cognitive events...');
  const emotionEvents: string[] = [];
  const memoryEvents: string[] = [];
  const decisionEvents: string[] = [];

  api.subscribe('EMOTION_CHANGED', (event) => {
    if (event.npcId) emotionEvents.push(`${event.npcId}: mood=${event.data?.mood ?? '?'}`);
  });

  api.subscribe('MEMORY_FORMED', (event) => {
    if (event.npcId) memoryEvents.push(`${event.npcId}: ${event.data?.content ?? '?'}`);
  });

  api.subscribe('DECISION_MADE', (event) => {
    if (event.npcId) decisionEvents.push(`${event.npcId} → ${event.data?.action} (score: ${event.data?.score?.toFixed(1)})`);
  });

  console.log('  ✓ Subscribed to EMOTION_CHANGED, MEMORY_FORMED, DECISION_MADE');
  console.log('');

  // ── 5. Running simulation ticks ──────────────────────────
  console.log('▶ Running simulation ticks...');
  for (let i = 1; i <= 5; i++) {
    api.tick();
    console.log(`  ✓ Tick ${i} complete — ${api.getAllNPCs().length} NPCs processed`);
  }
  console.log('');

  // ── 6. Getting NPC state ─────────────────────────────────
  console.log('▶ Getting NPC state after ticks...');
  for (const npc of api.getAllNPCs()) {
    console.log(`  ${npc.name}:`);
    console.log(`    current action: ${npc.currentAction ?? 'idle'}`);
    console.log(`    mood:           ${npc.emotions.mood}`);
    console.log(`    pleasure:       ${npc.emotions.pad.pleasure.toFixed(3)}`);
    console.log(`    arousal:        ${npc.emotions.pad.arousal.toFixed(3)}`);
    console.log(`    dominance:      ${npc.emotions.pad.dominance.toFixed(3)}`);
    console.log(`    memories:       ${Object.values(npc.memories).reduce((s, m) => s + m.length, 0)} total`);
    console.log(`    predictions:    ${npc.predictions.length}`);
    console.log(`    wallet:         ${npc.wallet} gold`);
  }
  console.log('');

  // ── 7. Trading ───────────────────────────────────────────
  console.log('▶ Trading between NPCs...');
  const foodPrice = api.getEconomyPrice('food');
  console.log(`  Current food price: ${foodPrice} gold`);

  const tradeResult = api.trade('aldric', 'world', 'food', 5);
  console.log(`  Aldric buys 5 food from world: ${tradeResult ? 'success' : 'failed'}`);

  const medicinePrice = api.getEconomyPrice('medicine');
  console.log(`  Current medicine price: ${medicinePrice} gold`);

  const tradeResult2 = api.trade('mira', 'world', 'medicine', 3);
  console.log(`  Mira buys 3 medicine from world: ${tradeResult2 ? 'success' : 'failed'}`);
  console.log('');

  // ── 8. Triggering world events ───────────────────────────
  console.log('▶ Triggering world events...');
  console.log('  Triggering festival...');
  api.triggerWorldEvent('festival');

  console.log('  Triggering storm...');
  api.triggerWorldEvent('storm');

  const worldState = api.getWorldState();
  console.log(`  Active world events: ${worldState.activeEvents.length}`);
  console.log(`  Current weather: ${worldState.weather}`);
  console.log(`  Day: ${worldState.day}, Hour: ${worldState.hour}`);
  console.log('');

  // ── 9. Exporting / importing state ───────────────────────
  console.log('▶ Exporting / importing state...');
  const exported = api.exportState();
  console.log(`  ✓ Exported ${exported.length} bytes of state`);

  const api2 = new ElysiumAPI();
  api2.importState(exported);
  const importedNPCs = api2.getAllNPCs();
  console.log(`  ✓ Imported ${importedNPCs.length} NPCs into new API instance`);
  console.log(`    Imported NPC names: ${importedNPCs.map((n) => n.name).join(', ')}`);
  api2.stop();
  console.log('');

  // ── 10. Event summary ────────────────────────────────────
  console.log('▶ Event subscription summary:');
  console.log(`  Emotion events captured:  ${emotionEvents.length}`);
  console.log(`  Memory events captured:   ${memoryEvents.length}`);
  console.log(`  Decision events captured: ${decisionEvents.length}`);
  if (decisionEvents.length > 0) {
    console.log('  Recent decisions:');
    for (const d of decisionEvents.slice(-3)) {
      console.log(`    ${d}`);
    }
  }
  console.log('');

  // ── 11. SDK stats ────────────────────────────────────────
  console.log('▶ SDK stats:');
  const stats = api.getStats();
  console.log(`  API calls:          ${stats.apiCalls}`);
  console.log(`  Registered plugins: ${stats.registeredPlugins}`);
  console.log(`  Uptime:             ${stats.uptime} ms`);
  console.log('');

  // ── 12. Clean shutdown ───────────────────────────────────
  console.log('▶ Shutting down...');
  api.stop();
  console.log('  ✓ Auto simulation stopped');
  console.log('  ✓ Clean shutdown complete');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Basic usage example complete!');
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
