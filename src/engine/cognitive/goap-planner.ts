import type { CognitiveEventBus } from './event-bus';
import type {
  GOAPAction,
  GOAPGoal,
  GOAPPlan,
  GOAPWorldState,
  NPCCore,
  CognitiveEventType,
  GOAPPlannerConfig,
} from '../types';

const DEFAULT_CONFIG: GOAPPlannerConfig = {
  maxDepth: 8,
  maxIterations: 200,
  maxCacheSize: 50,
};

const ACTION_LIBRARY: GOAPAction[] = [
  {
    name: 'eat',
    cost: 1,
    preconditions: { hasFood: true },
    effects: { hunger: 80, hasFood: false },
  },
  {
    name: 'drink',
    cost: 1,
    preconditions: { hasWater: true },
    effects: { thirst: 80, hasWater: false },
  },
  {
    name: 'sleep',
    cost: 2,
    preconditions: { isSafe: true },
    effects: { sleep: 100, energy: 100 },
  },
  {
    name: 'socialize',
    cost: 3,
    preconditions: { nearNPC: true },
    effects: { social: 60 },
  },
  {
    name: 'work',
    cost: 4,
    preconditions: { energy: 50 },
    effects: { money: 20, energy: -20 },
  },
  {
    name: 'trade',
    cost: 3,
    preconditions: { nearNPC: true, hasMoney: true },
    effects: { traded: true },
  },
  {
    name: 'explore',
    cost: 5,
    preconditions: {},
    effects: { explored: true, knowledge: 10 },
  },
  {
    name: 'fight',
    cost: 6,
    preconditions: { hasWeapon: true },
    effects: { combatResolved: true, energy: -30 },
  },
  {
    name: 'flee',
    cost: 3,
    preconditions: { isThreatened: true },
    effects: { isSafe: true, isThreatened: false },
  },
  {
    name: 'rest',
    cost: 2,
    preconditions: {},
    effects: { energy: 30, sleep: 20 },
  },
  {
    name: 'craft',
    cost: 4,
    preconditions: { hasMaterials: true },
    effects: { hasItem: true, hasMaterials: false },
  },
  {
    name: 'gather',
    cost: 3,
    preconditions: { nearResource: true },
    effects: { hasMaterials: true, hasFood: true },
  },
  {
    name: 'travel',
    cost: 5,
    preconditions: {},
    effects: { atDestination: true },
  },
  {
    name: 'help',
    cost: 3,
    preconditions: { nearNPC: true },
    effects: { helped: true, social: 30 },
  },
  {
    name: 'steal',
    cost: 7,
    preconditions: { nearNPC: true },
    effects: { hasMoney: true, reputation: -20 },
  },
  {
    name: 'pray',
    cost: 2,
    preconditions: {},
    effects: { peace: true, esteem: 20 },
  },
  {
    name: 'learn',
    cost: 4,
    preconditions: { hasBook: true },
    effects: { knowledge: 20, hasBook: false },
  },
  {
    name: 'play',
    cost: 3,
    preconditions: { energy: 30 },
    effects: { joy: 50, energy: -10 },
  },
];

type AStarNode = {
  state: GOAPWorldState;
  actions: GOAPAction[];
  gCost: number;
  hCost: number;
  fCost: number;
  depth: number;
};

function cloneState(state: GOAPWorldState): GOAPWorldState {
  return { ...state };
}

function applyEffects(
  state: GOAPWorldState,
  effects: Record<string, any>,
): GOAPWorldState {
  const next = cloneState(state);
  for (const key of Object.keys(effects)) {
    const effect = effects[key];
    const current = next[key];
    if (typeof effect === 'number' && typeof current === 'number') {
      next[key] = current + effect;
    } else {
      next[key] = effect;
    }
  }
  return next;
}

function meetsPreconditions(
  state: GOAPWorldState,
  preconditions: Record<string, any>,
): boolean {
  for (const key of Object.keys(preconditions)) {
    const pre = preconditions[key];
    const current = state[key];
    if (typeof pre === 'number' && typeof current === 'number') {
      if (current < pre) return false;
    } else if (current !== pre) {
      return false;
    }
  }
  return true;
}

function isGoalSatisfied(
  state: GOAPWorldState,
  targetState: Record<string, any>,
): boolean {
  for (const key of Object.keys(targetState)) {
    const target = targetState[key];
    const current = state[key];
    if (typeof target === 'number' && typeof current === 'number') {
      if (current < target) return false;
    } else if (current !== target) {
      return false;
    }
  }
  return true;
}

function heuristic(
  state: GOAPWorldState,
  targetState: Record<string, any>,
): number {
  let h = 0;
  for (const key of Object.keys(targetState)) {
    const target = targetState[key];
    const current = state[key];
    if (typeof target === 'number' && typeof current === 'number') {
      h += Math.max(0, target - current);
    } else if (current !== target) {
      h += 1;
    }
  }
  return h;
}

function stateHash(state: GOAPWorldState): string {
  const keys = Object.keys(state).sort();
  return keys.map((k) => `${k}=${state[k]}`).join('|');
}

function planHash(
  npcId: string,
  goalName: string,
  worldState: GOAPWorldState,
): string {
  return `${npcId}:${goalName}:${stateHash(worldState)}`;
}

export class GOAPPlanner {
  private eventBus: CognitiveEventBus;
  private config: GOAPPlannerConfig;
  private actionLibrary: GOAPAction[];
  private cache: Map<string, GOAPPlan> = new Map();
  private cacheOrder: string[] = [];

  constructor(eventBus: CognitiveEventBus) {
    this.eventBus = eventBus;
    this.config = DEFAULT_CONFIG;
    this.actionLibrary = [...ACTION_LIBRARY];
  }

  plan(
    npc: NPCCore,
    goal: GOAPGoal,
    worldState: GOAPWorldState,
  ): GOAPPlan {
    const hash = planHash(npc.id, goal.name, worldState);

    this.eventBus.emit({
      type: 'GOAP_PLAN_REQUESTED' as CognitiveEventType,
      source: 'goap-planner',
      npcId: npc.id,
      data: { goal: goal.name, hash },
    });

    const cached = this.cache.get(hash);
    if (cached) {
      this.eventBus.emit({
        type: 'GOAP_PLAN_CACHED' as CognitiveEventType,
        source: 'goap-planner',
        npcId: npc.id,
        data: { goal: goal.name, hash },
      });
      return { ...cached, cached: true };
    }

    const result = this.aStarSearch(goal, worldState);

    if (result.found) {
      const plan: GOAPPlan = {
        goal,
        actions: result.actions,
        totalCost: result.cost,
        found: true,
        cached: false,
      };

      this.storeCache(hash, plan);

      this.eventBus.emit({
        type: 'GOAP_PLAN_FOUND' as CognitiveEventType,
        source: 'goap-planner',
        npcId: npc.id,
        data: { goal: goal.name, actionCount: result.actions.length, cost: result.cost },
      });

      return plan;
    }

    this.eventBus.emit({
      type: 'GOAP_PLAN_FAILED' as CognitiveEventType,
      source: 'goap-planner',
      npcId: npc.id,
      data: { goal: goal.name, reason: 'no_path_found' },
    });

    return {
      goal,
      actions: [],
      totalCost: 0,
      found: false,
      cached: false,
    };
  }

  private aStarSearch(
    goal: GOAPGoal,
    worldState: GOAPWorldState,
  ): { found: boolean; actions: GOAPAction[]; cost: number } {
    const startNode: AStarNode = {
      state: cloneState(worldState),
      actions: [],
      gCost: 0,
      hCost: heuristic(worldState, goal.targetState),
      fCost: heuristic(worldState, goal.targetState),
      depth: 0,
    };

    const open: AStarNode[] = [startNode];
    const closed = new Set<string>();
    let iterations = 0;

    while (open.length > 0 && iterations < this.config.maxIterations) {
      iterations += 1;

      open.sort((a, b) => a.fCost - b.fCost);
      const current = open.shift()!;

      const currentHash = stateHash(current.state);
      if (closed.has(currentHash)) continue;
      closed.add(currentHash);

      if (isGoalSatisfied(current.state, goal.targetState)) {
        return { found: true, actions: current.actions, cost: current.gCost };
      }

      if (current.depth >= this.config.maxDepth) continue;

      for (const action of this.actionLibrary) {
        if (!meetsPreconditions(current.state, action.preconditions)) continue;

        const newState = applyEffects(current.state, action.effects);
        const newHash = stateHash(newState);
        if (closed.has(newHash)) continue;

        const gCost = current.gCost + action.cost;
        const hCost = heuristic(newState, goal.targetState);

        open.push({
          state: newState,
          actions: [...current.actions, action],
          gCost,
          hCost,
          fCost: gCost + hCost,
          depth: current.depth + 1,
        });
      }
    }

    return { found: false, actions: [], cost: 0 };
  }

  getCachedPlan(hash: string): GOAPPlan | undefined {
    return this.cache.get(hash);
  }

  repairPlan(
    npc: NPCCore,
    plan: GOAPPlan,
    worldState: GOAPWorldState,
  ): GOAPPlan {
    const validActions: GOAPAction[] = [];
    let currentState = cloneState(worldState);

    for (const action of plan.actions) {
      if (meetsPreconditions(currentState, action.preconditions)) {
        validActions.push(action);
        currentState = applyEffects(currentState, action.effects);
      }
    }

    if (isGoalSatisfied(currentState, plan.goal.targetState)) {
      const repaired: GOAPPlan = {
        goal: plan.goal,
        actions: validActions,
        totalCost: validActions.reduce((sum, a) => sum + a.cost, 0),
        found: true,
        cached: false,
      };

      this.eventBus.emit({
        type: 'GOAP_PLAN_REPAIRED' as CognitiveEventType,
        source: 'goap-planner',
        npcId: npc.id,
        data: {
          goal: plan.goal.name,
          originalCount: plan.actions.length,
          repairedCount: validActions.length,
        },
      });

      return repaired;
    }

    const rePlanned = this.plan(npc, plan.goal, currentState);
    this.eventBus.emit({
      type: 'GOAP_PLAN_REPAIRED' as CognitiveEventType,
      source: 'goap-planner',
      npcId: npc.id,
      data: {
        goal: plan.goal.name,
        originalCount: plan.actions.length,
        rePlanned: true,
      },
    });
    return rePlanned;
  }

  getActionLibrary(): GOAPAction[] {
    return [...this.actionLibrary];
  }

  private storeCache(hash: string, plan: GOAPPlan): void {
    if (this.cache.size >= this.config.maxCacheSize) {
      const oldest = this.cacheOrder.shift();
      if (oldest) {
        this.cache.delete(oldest);
      }
    }
    this.cache.set(hash, plan);
    this.cacheOrder.push(hash);
  }
}

export { ACTION_LIBRARY, DEFAULT_CONFIG as GOAP_DEFAULT_CONFIG };
