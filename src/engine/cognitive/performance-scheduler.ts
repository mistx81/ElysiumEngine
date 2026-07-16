import type {
  SchedulerTask,
  SchedulerStats,
  SchedulerConfig,
} from '../types';
import type { CognitiveEventBus } from './event-bus';

const DEFAULT_BUDGET_MS = 16;

type TaskFn = () => void;

type InternalTask = {
  id: string;
  name: string;
  priority: number;
  intervalMs: number;
  taskFn: TaskFn;
  lastRunMs: number;
  avgExecutionMs: number;
  maxExecutionMs: number;
  executionCount: number;
  isOverBudget: boolean;
  enabled: boolean;
};

export class PerformanceScheduler {
  private eventBus: CognitiveEventBus;
  private budgetMs: number;

  private tasks: Map<string, InternalTask> = new Map();
  private running = false;
  private timerId: ReturnType<typeof setInterval> | null = null;

  private totalExecutions = 0;
  private tasksOverBudget = 0;

  constructor(eventBus: CognitiveEventBus) {
    this.eventBus = eventBus;
    this.budgetMs = DEFAULT_BUDGET_MS;
  }

  registerTask(
    id: string,
    name: string,
    priority: number,
    intervalMs: number,
    taskFn: TaskFn,
  ): void {
    if (this.tasks.has(id)) {
      this.unregisterTask(id);
    }

    const task: InternalTask = {
      id,
      name,
      priority,
      intervalMs,
      taskFn,
      lastRunMs: 0,
      avgExecutionMs: 0,
      maxExecutionMs: 0,
      executionCount: 0,
      isOverBudget: false,
      enabled: true,
    };

    this.tasks.set(id, task);

    this.eventBus.emit({
      type: 'SCHEDULE_TASK_QUEUED',
      source: 'performance-scheduler',
      data: { id, name, priority, intervalMs },
    });
  }

  unregisterTask(id: string): void {
    this.tasks.delete(id);
  }

  tick(): void {
    const frameStart = performance.now();
    let elapsed = 0;
    let executedThisFrame = 0;

    const sorted = [...this.tasks.values()].sort((a, b) => b.priority - a.priority);

    for (const task of sorted) {
      if (!task.enabled) continue;

      const now = performance.now();
      if (task.intervalMs > 0 && now - task.lastRunMs < task.intervalMs) continue;

      if (elapsed >= this.budgetMs) break;

      const taskStart = performance.now();
      try {
        task.taskFn();
      } catch {
        // task errors are isolated
      }
      const taskEnd = performance.now();
      const taskDuration = taskEnd - taskStart;

      task.lastRunMs = taskEnd;
      task.executionCount += 1;
      task.maxExecutionMs = Math.max(task.maxExecutionMs, taskDuration);
      task.avgExecutionMs =
        task.executionCount > 0
          ? (task.avgExecutionMs * (task.executionCount - 1) + taskDuration) / task.executionCount
          : taskDuration;

      this.totalExecutions += 1;
      executedThisFrame += 1;

      const taskBudget = this.budgetMs / Math.max(1, this.tasks.size);
      if (taskDuration > taskBudget) {
        task.isOverBudget = true;
        this.tasksOverBudget += 1;

        this.eventBus.emit({
          type: 'SCHEDULE_BUDGET_EXCEEDED',
          source: 'performance-scheduler',
          data: {
            taskId: task.id,
            taskName: task.name,
            durationMs: taskDuration,
            budgetMs: taskBudget,
          },
        });
      } else {
        task.isOverBudget = false;
      }

      this.eventBus.emit({
        type: 'SCHEDULE_TASK_EXECUTED',
        source: 'performance-scheduler',
        data: {
          taskId: task.id,
          taskName: task.name,
          durationMs: taskDuration,
          executionCount: task.executionCount,
        },
      });

      elapsed = taskEnd - frameStart;
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.timerId = setInterval(() => {
      this.tick();
    }, this.budgetMs);
  }

  stop(): void {
    this.running = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  getStats(): SchedulerStats {
    let overBudgetCount = 0;
    const tasks: SchedulerTask[] = [];

    for (const task of this.tasks.values()) {
      if (task.isOverBudget) overBudgetCount += 1;
      tasks.push({
        id: task.id,
        name: task.name,
        priority: task.priority,
        intervalMs: task.intervalMs,
        lastRunMs: task.lastRunMs,
        avgExecutionMs: task.avgExecutionMs,
        maxExecutionMs: task.maxExecutionMs,
        executionCount: task.executionCount,
        isOverBudget: task.isOverBudget,
        enabled: task.enabled,
      });
    }

    tasks.sort((a, b) => b.priority - a.priority);

    return {
      totalTasks: this.tasks.size,
      totalExecutions: this.totalExecutions,
      tasksOverBudget: overBudgetCount,
      budgetUtilization: this.budgetMs > 0 ? Math.min(1, overBudgetCount / Math.max(1, this.tasks.size)) : 0,
      budgetMs: this.budgetMs,
      tasks,
    };
  }

  getTasks(): SchedulerTask[] {
    return this.getStats().tasks;
  }

  setBudget(budgetMs: number): void {
    this.budgetMs = budgetMs;
    if (this.running) {
      this.stop();
      this.start();
    }
  }
}

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  budgetMs: DEFAULT_BUDGET_MS,
};
