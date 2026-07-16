import { ElysiumAPI } from '../public-api';

async function main(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Elysium Engine — NPC Lifecycle Example');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  // ── 1. Create API instance ──────────────────────────────
  console.log('▶ Creating ElysiumAPI instance...');
  const api = new ElysiumAPI({
    autoStart: false,
    tickIntervalMs: 1000,
    maxNPCs: 1000,
    enableCache: true,
    enableBatchWrites: true,
    enablePersistence: false,
  });
  console.log('  ✓ API created');
  console.log('');

  // ── 2. Track events for observation ──────────────────────
  console.log('▶ Setting up event tracking...');
  const driftEvents: { npcId: string; trait: string; delta: number; reason: string }[] = [];
  const memoryEvents: { npcId: string; type: string; content: string }[] = [];
  const relationshipEvents: { npcId: string; targetId: string; trust: number; action: string }[] = [];
  const emotionEvents: { npcId: string; mood: string; pleasure: number }[] = [];

  api.subscribe('PERSONALITY_DRIFTED', (event) => {
    if (event.npcId && event.data?.changes) {
      for (const change of event.data.changes) {
        driftEvents.push({
          npcId: event.npcId,
          trait: change.trait,
          delta: change.delta,
          reason: event.data.experienceType,
        });
      }
    }
  });

  api.subscribe('MEMORY_FORMED', (event) => {
    memoryEvents.push({
      npcId: event.npcId ?? 'unknown',
      type: event.data?.type ?? 'unknown',
      content: event.data?.content ?? '',
    });
  });

  api.subscribe('RELATIONSHIP_CHANGED', (event) => {
    if (event.npcId && event.data?.targetId) {
      relationshipEvents.push({
        npcId: event.npcId,
        targetId: event.data.targetId,
        trust: event.data.trust ?? 0,
        action: event.data.action ?? 'unknown',
      });
    }
  });

  api.subscribe('EMOTION_CHANGED', (event) => {
    if (event.npcId) {
      emotionEvents.push({
        npcId: event.npcId,
        mood: event.data?.mood ?? 'unknown',
        pleasure: event.data?.pad?.pleasure ?? 0,
      });
    }
  });

  console.log('  ✓ Subscribed to PERSONALITY_DRIFTED, MEMORY_FORMED, RELATIONSHIP_CHANGED, EMOTION_CHANGED');
  console.log('');

  // ── 3. Create an NPC ─────────────────────────────────────
  console.log('▶ Creating NPC: Lyra the Scholar...');
  const lyra = api.createNPC({
    id: 'lyra',
    name: 'Lyra the Scholar',
    age: 26,
    personality: {
      openness: 85,
      conscientiousness: 70,
      extraversion: 45,
      agreeableness: 60,
      neuroticism: 50,
    },
    needs: {
      hunger: 40,
      thirst: 40,
      sleep: 60,
      social: 30,
      safety: 70,
      esteem: 50,
      selfActualization: 80,
    },
    wallet: 150,
    position: { x: 0, y: -40 },
  });

  const kael = api.createNPC({
    id: 'kael',
    name: 'Kael the Warrior',
    age: 33,
    personality: {
      openness: 35,
      conscientiousness: 60,
      extraversion: 55,
      agreeableness: 40,
      neuroticism: 65,
    },
    wallet: 100,
    position: { x: 40, y: -30 },
  });

  console.log(`  ✓ Created: ${lyra.name} (age ${lyra.age})`);
  console.log(`  ✓ Created: ${kael.name} (age ${kael.age})`);
  console.log('');

  // ── 4. Set initial goals ─────────────────────────────────
  console.log('▶ Setting initial goals...');
  api.setGoal('lyra', {
    name: 'seekKnowledge',
    priority: 8,
    targetState: { learned: true },
  });

  api.setGoal('kael', {
    name: 'getRested',
    priority: 6,
    targetState: { rested: true },
  });

  console.log(`  ✓ Lyra's goal: ${lyra.currentGoal?.name}`);
  console.log(`  ✓ Kael's goal: ${kael.currentGoal?.name}`);
  console.log('');

  // ── 5. Initial state snapshot ────────────────────────────
  console.log('▶ Initial state snapshot:');
  console.log(`  ${lyra.name}:`);
  console.log(`    personality: O=${lyra.personality.openness} C=${lyra.personality.conscientiousness} E=${lyra.personality.extraversion} A=${lyra.personality.agreeableness} N=${lyra.personality.neuroticism}`);
  console.log(`    mood: ${lyra.emotions.mood}, pleasure: ${lyra.emotions.pad.pleasure.toFixed(3)}`);
  console.log(`    memories: ${Object.values(lyra.memories).reduce((s, m) => s + m.length, 0)}`);
  console.log(`    relationships: ${Object.keys(lyra.relationships).length}`);
  console.log('');

  // ── 6. Run initial ticks ─────────────────────────────────
  console.log('▶ Running initial simulation ticks (observing state changes)...');
  for (let i = 1; i <= 3; i++) {
    api.tick();
    console.log(`  ✓ Tick ${i}: Lyra action=${lyra.currentAction ?? 'idle'}, Kael action=${kael.currentAction ?? 'idle'}`);
  }
  console.log('');

  // ── 7. Trigger betrayal event ────────────────────────────
  console.log('▶ Triggering betrayal: Kael betrays Lyra...');
  const runtime = api.getRuntime();
  runtime.triggerBetrayal('lyra', 'kael');

  console.log(`  ✓ Betrayal processed`);
  console.log(`    Lyra mood: ${lyra.emotions.mood}`);
  console.log(`    Lyra pleasure: ${lyra.emotions.pad.pleasure.toFixed(3)}`);
  console.log(`    Lyra arousal: ${lyra.emotions.pad.arousal.toFixed(3)}`);
  console.log(`    Lyra dominance: ${lyra.emotions.pad.dominance.toFixed(3)}`);
  console.log('');

  // ── 8. Observe personality drift ─────────────────────────
  console.log('▶ Observing personality drift...');
  console.log(`  Personality after betrayal:`);
  console.log(`    openness:        ${lyra.personality.openness} (was 85)`);
  console.log(`    agreeableness:   ${lyra.personality.agreeableness} (was 60)`);
  console.log(`    neuroticism:     ${lyra.personality.neuroticism} (was 50)`);
  console.log(`    extraversion:    ${lyra.personality.extraversion} (was 45)`);
  console.log(`    conscientiousness: ${lyra.personality.conscientiousness} (was 70)`);
  console.log(`  Drift events recorded: ${driftEvents.length}`);
  for (const d of driftEvents.filter((e) => e.npcId === 'lyra')) {
    console.log(`    ${d.trait}: ${d.delta > 0 ? '+' : ''}${d.delta.toFixed(2)} (${d.reason})`);
  }
  console.log('');

  // ── 9. Observe relationship changes ───────────────────────
  console.log('▶ Observing relationship changes...');
  const lyraRelationships = runtime.relationshipGraph.getAllRelationships('lyra');
  console.log(`  Lyra's relationships: ${Object.keys(lyraRelationships).length}`);
  for (const [targetId, rel] of Object.entries(lyraRelationships)) {
    console.log(`    → ${targetId}: trust=${rel.trust.toFixed(1)}, affinity=${rel.affinity.toFixed(1)}, familiarity=${rel.familiarity.toFixed(1)}`);
  }
  console.log(`  Relationship events recorded: ${relationshipEvents.length}`);
  console.log('');

  // ── 10. Trigger kindness event ────────────────────────────
  console.log('▶ Triggering kindness: Lyra helps Kael...');
  runtime.triggerConversation('lyra', 'kael');
  runtime.personalityDrift.processExperience(lyra, 'kindness', 0.6);

  console.log(`  ✓ Kindness processed`);
  console.log(`    Lyra mood: ${lyra.emotions.mood}`);
  console.log(`    Lyra pleasure: ${lyra.emotions.pad.pleasure.toFixed(3)}`);
  console.log(`    Lyra agreeableness: ${lyra.personality.agreeableness.toFixed(1)}`);
  console.log('');

  // ── 11. Trigger combat event ──────────────────────────────
  console.log('▶ Triggering combat: Kael attacks Lyra...');
  runtime.triggerAttack('lyra', 'kael');

  console.log(`  ✓ Combat processed`);
  console.log(`    Lyra mood: ${lyra.emotions.mood}`);
  console.log(`    Lyra pleasure: ${lyra.emotions.pad.pleasure.toFixed(3)}`);
  console.log(`    Lyra arousal: ${lyra.emotions.pad.arousal.toFixed(3)}`);
  console.log(`    Lyra fear: ${lyra.emotions.emotions.fear.toFixed(1)}`);
  console.log(`    Lyra anger: ${lyra.emotions.emotions.anger.toFixed(1)}`);
  console.log('');

  // ── 12. Observe memory formation ──────────────────────────
  console.log('▶ Observing memory formation...');
  console.log(`  Memory events recorded: ${memoryEvents.length}`);
  for (const m of memoryEvents.filter((e) => e.npcId === 'lyra').slice(-5)) {
    console.log(`    [${m.type}] ${m.content}`);
  }

  const lyraMemoryCount = Object.values(lyra.memories).reduce((s, m) => s + m.length, 0);
  console.log(`  Total Lyra memories: ${lyraMemoryCount}`);
  for (const [type, memories] of Object.entries(lyra.memories)) {
    if (memories.length > 0) {
      console.log(`    ${type}: ${memories.length} memories`);
    }
  }
  console.log('');

  // ── 13. Run more ticks to observe consolidation ──────────
  console.log('▶ Running more ticks to observe memory consolidation...');
  for (let i = 4; i <= 8; i++) {
    api.tick();
  }
  console.log(`  ✓ 5 more ticks complete`);
  console.log(`  Lyra predictions: ${lyra.predictions.length}`);
  console.log(`  Lyra episodic events: ${lyra.episodicEvents.length}`);
  console.log(`  Lyra decision history: ${lyra.decisionHistory.length}`);
  console.log('');

  // ── 14. Observe emotional changes ─────────────────────────
  console.log('▶ Emotional change summary:');
  console.log(`  Emotion events recorded: ${emotionEvents.length}`);
  const lyraEmotions = emotionEvents.filter((e) => e.npcId === 'lyra');
  console.log(`  Lyra emotion changes: ${lyraEmotions.length}`);
  if (lyraEmotions.length > 0) {
    console.log(`  Recent mood transitions:`);
    for (const e of lyraEmotions.slice(-5)) {
      console.log(`    mood=${e.mood}, pleasure=${e.pleasure.toFixed(3)}`);
    }
  }
  console.log('');

  // ── 15. Final personality drift summary ──────────────────
  console.log('▶ Personality drift summary:');
  console.log(`  Total drift events: ${driftEvents.length}`);
  console.log(`  Lyra drift history: ${lyra.personalityDriftHistory.length} events`);
  for (const d of lyra.personalityDriftHistory.slice(-5)) {
    console.log(`    ${d.trait}: ${d.delta > 0 ? '+' : ''}${d.delta.toFixed(2)} (${d.reason})`);
  }
  console.log('');

  // ── 16. Export NPC state ──────────────────────────────────
  console.log('▶ Exporting NPC state...');
  const exported = api.exportState();
  console.log(`  ✓ Exported ${exported.length} bytes`);
  const parsed = JSON.parse(exported);
  console.log(`  Exported ${parsed.npcs.length} NPCs, ${parsed.events.length} events`);
  console.log('');

  // ── 17. Final NPC state ───────────────────────────────────
  console.log('▶ Final NPC state:');
  console.log(`  ${lyra.name}:`);
  console.log(`    personality: O=${lyra.personality.openness.toFixed(1)} C=${lyra.personality.conscientiousness.toFixed(1)} E=${lyra.personality.extraversion.toFixed(1)} A=${lyra.personality.agreeableness.toFixed(1)} N=${lyra.personality.neuroticism.toFixed(1)}`);
  console.log(`    mood: ${lyra.emotions.mood}`);
  console.log(`    emotions: joy=${lyra.emotions.emotions.joy.toFixed(1)} sadness=${lyra.emotions.emotions.sadness.toFixed(1)} anger=${lyra.emotions.emotions.anger.toFixed(1)} fear=${lyra.emotions.emotions.fear.toFixed(1)}`);
  console.log(`    memories: ${lyraMemoryCount} total`);
  console.log(`    predictions: ${lyra.predictions.length}`);
  console.log(`    episodic events: ${lyra.episodicEvents.length}`);
  console.log(`    relationships: ${Object.keys(lyra.relationships).length}`);
  console.log(`    wallet: ${lyra.wallet} gold`);
  console.log(`    isAlive: ${lyra.isAlive}`);
  console.log('');

  // ── 18. Remove the NPC ────────────────────────────────────
  console.log('▶ Removing NPC Lyra...');
  api.removeNPC('lyra');
  console.log(`  ✓ Lyra removed. Remaining NPCs: ${api.getAllNPCs().length}`);
  console.log(`  ✓ getNPC('lyra') returns: ${api.getNPC('lyra') ?? 'undefined'}`);
  console.log('');

  // ── 19. Clean shutdown ───────────────────────────────────
  console.log('▶ Shutting down...');
  api.stop();
  console.log('  ✓ Clean shutdown complete');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  NPC lifecycle example complete!');
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
