import type { CognitiveEventBus } from './event-bus';
import type {
  Prediction,
  NPCCore,
  CognitiveEventType,
} from '../types';

const DEFAULT_WINDOW = 50;
const MIN_CONFIDENCE = 0.3;

type NPCPredictionData = {
  history: Prediction[];
  actionCounts: Record<string, number>;
  totalActions: number;
  correctPredictions: number;
  totalPredictions: number;
};

export class PredictionEngine {
  private eventBus: CognitiveEventBus;
  private windowSize: number;
  private minConfidence: number;
  private npcData: Map<string, NPCPredictionData> = new Map();
  private idCounter = 0;

  constructor(eventBus: CognitiveEventBus) {
    this.eventBus = eventBus;
    this.windowSize = DEFAULT_WINDOW;
    this.minConfidence = MIN_CONFIDENCE;
  }

  private getData(npcId: string): NPCPredictionData {
    let data = this.npcData.get(npcId);
    if (!data) {
      data = {
        history: [],
        actionCounts: {},
        totalActions: 0,
        correctPredictions: 0,
        totalPredictions: 0,
      };
      this.npcData.set(npcId, data);
    }
    return data;
  }

  predict(npc: NPCCore): Prediction {
    const data = this.getData(npc.id);
    const recentHistory = npc.decisionHistory ?? [];
    const recentActions = recentHistory
      .slice(-this.windowSize)
      .map((d) => d.action);

    let predictedAction = 'idle';
    let confidence = 0;

    if (recentActions.length === 0 && data.totalActions === 0) {
      predictedAction = 'idle';
      confidence = 0.1;
    } else {
      const counts: Record<string, number> = {};
      for (const action of recentActions) {
        counts[action] = (counts[action] ?? 0) + 1;
      }

      let maxCount = 0;
      for (const action of Object.keys(counts)) {
        if (counts[action] > maxCount) {
          maxCount = counts[action];
          predictedAction = action;
        }
      }

      const total = recentActions.length || 1;
      confidence = maxCount / total;

      if (confidence < this.minConfidence) {
        const lastAction = recentActions[recentActions.length - 1];
        if (lastAction) {
          predictedAction = lastAction;
          confidence = Math.max(confidence, this.minConfidence);
        }
      }
    }

    const prediction: Prediction = {
      id: `pred_${Date.now()}_${++this.idCounter}`,
      npcId: npc.id,
      predictedAction,
      confidence,
      timestamp: Date.now(),
      verified: false,
    };

    data.history.push(prediction);
    if (data.history.length > this.windowSize) {
      data.history.shift();
    }

    this.eventBus.emit({
      type: 'PREDICTION_MADE' as CognitiveEventType,
      source: 'prediction-engine',
      npcId: npc.id,
      data: { predictedAction, confidence, predictionId: prediction.id },
    });

    return prediction;
  }

  verify(
    npc: NPCCore,
    prediction: Prediction,
    actualAction: string,
  ): Prediction {
    const data = this.getData(npc.id);
    const verified: Prediction = {
      ...prediction,
      verified: true,
      actualAction,
    };

    data.totalPredictions += 1;
    if (prediction.predictedAction === actualAction) {
      data.correctPredictions += 1;
    }

    data.actionCounts[actualAction] =
      (data.actionCounts[actualAction] ?? 0) + 1;
    data.totalActions += 1;

    const idx = data.history.findIndex((p) => p.id === prediction.id);
    if (idx >= 0) {
      data.history[idx] = verified;
    }

    this.eventBus.emit({
      type: 'PREDICTION_VERIFIED' as CognitiveEventType,
      source: 'prediction-engine',
      npcId: npc.id,
      data: {
        predictionId: prediction.id,
        predictedAction: prediction.predictedAction,
        actualAction,
        correct: prediction.predictedAction === actualAction,
      },
    });

    return verified;
  }

  getAccuracy(npcId: string): number {
    const data = this.npcData.get(npcId);
    if (!data || data.totalPredictions === 0) return 0;
    return data.correctPredictions / data.totalPredictions;
  }

  getPredictions(npcId: string): Prediction[] {
    const data = this.npcData.get(npcId);
    return data ? [...data.history] : [];
  }
}

export { DEFAULT_WINDOW as PREDICTION_WINDOW, MIN_CONFIDENCE as PREDICTION_MIN_CONFIDENCE };
