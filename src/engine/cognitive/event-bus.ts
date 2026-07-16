import type { CognitiveEvent, CognitiveEventType } from '../types';

type EventHandler = (event: CognitiveEvent) => void;

type Subscription = {
  id: string;
  eventType: CognitiveEventType | '*';
  handler: EventHandler;
};

const MAX_HISTORY = 500;

let idCounter = 0;

function generateId(): string {
  idCounter += 1;
  return `evt_${Date.now()}_${idCounter}`;
}

export class CognitiveEventBus {
  private subscriptions: Map<string, Subscription> = new Map();
  private history: CognitiveEvent[] = [];
  private emitCount = 0;
  private subscriberCount = 0;

  subscribe(eventType: CognitiveEventType | '*', handler: EventHandler): string {
    const id = generateId();
    this.subscriptions.set(id, { id, eventType, handler });
    this.subscriberCount += 1;
    return id;
  }

  unsubscribe(id: string): void {
    if (this.subscriptions.delete(id)) {
      this.subscriberCount = Math.max(0, this.subscriberCount - 1);
    }
  }

  emit(event: Omit<CognitiveEvent, 'id' | 'timestamp'>): void {
    const fullEvent: CognitiveEvent = {
      ...event,
      id: generateId(),
      timestamp: Date.now(),
    };

    this.emitCount += 1;

    if (this.history.length >= MAX_HISTORY) {
      this.history.shift();
    }
    this.history.push(fullEvent);

    for (const sub of this.subscriptions.values()) {
      if (sub.eventType === fullEvent.type || sub.eventType === '*') {
        try {
          sub.handler(fullEvent);
        } catch {
          // handler errors are isolated
        }
      }
    }
  }

  getHistory(): CognitiveEvent[] {
    return [...this.history];
  }

  getHistoryByType(type: CognitiveEventType): CognitiveEvent[] {
    return this.history.filter((e) => e.type === type);
  }

  clearHistory(): void {
    this.history = [];
  }

  getStats(): {
    totalEmitted: number;
    historySize: number;
    subscriberCount: number;
    byType: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    for (const e of this.history) {
      byType[e.type] = (byType[e.type] ?? 0) + 1;
    }
    return {
      totalEmitted: this.emitCount,
      historySize: this.history.length,
      subscriberCount: this.subscriberCount,
      byType,
    };
  }
}
