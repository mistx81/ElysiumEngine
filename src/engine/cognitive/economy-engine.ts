import type { CognitiveEventBus } from './event-bus';
import type {
  EconomyItemType,
  EconomyItem,
  EconomyTransaction,
  EconomyConfig,
  NPCId,
  CognitiveEventType,
} from '../types';

const PRICE_ADJUSTMENT_RATE = 0.1;
const MAX_PRICE_HISTORY = 100;

const ITEM_BASE_PRICES: Record<EconomyItemType, number> = {
  food: 5,
  water: 3,
  weapon: 50,
  tool: 20,
  medicine: 30,
  clothing: 25,
  luxury: 100,
  material: 10,
  book: 15,
};

const ITEM_TYPES: EconomyItemType[] = [
  'food',
  'water',
  'weapon',
  'tool',
  'medicine',
  'clothing',
  'luxury',
  'material',
  'book',
];

function createItem(type: EconomyItemType): EconomyItem {
  const basePrice = ITEM_BASE_PRICES[type];
  return {
    type,
    basePrice,
    currentPrice: basePrice,
    supply: 100,
    demand: 100,
    priceHistory: [basePrice],
  };
}

function clampPrice(price: number): number {
  return Math.max(0.01, Math.round(price * 100) / 100);
}

type WorldEventImpact = {
  itemType?: EconomyItemType;
  supplyDelta?: number;
  demandDelta?: number;
  description?: string;
};

export class EconomyEngine {
  private eventBus: CognitiveEventBus;
  private config: EconomyConfig;
  private inventory: Map<EconomyItemType, EconomyItem> = new Map();
  private wallets: Map<NPCId, number> = new Map();
  private idCounter = 0;

  constructor(eventBus: CognitiveEventBus) {
    this.eventBus = eventBus;
    this.config = {
      priceAdjustmentRate: PRICE_ADJUSTMENT_RATE,
      maxPriceHistory: MAX_PRICE_HISTORY,
    };
    for (const type of ITEM_TYPES) {
      this.inventory.set(type, createItem(type));
    }
  }

  private ensureWallet(npcId: NPCId): number {
    let wallet = this.wallets.get(npcId);
    if (wallet === undefined) {
      wallet = 100;
      this.wallets.set(npcId, wallet);
    }
    return wallet;
  }

  processTransaction(
    buyerId: NPCId,
    sellerId: NPCId | 'world',
    itemType: EconomyItemType,
    quantity: number,
  ): EconomyTransaction | null {
    if (quantity <= 0) return null;
    const item = this.inventory.get(itemType);
    if (!item) return null;

    const totalPrice = clampPrice(item.currentPrice * quantity);
    const buyerWallet = this.ensureWallet(buyerId);

    if (buyerWallet < totalPrice) return null;

    this.wallets.set(buyerId, buyerWallet - totalPrice);
    if (sellerId !== 'world') {
      const sellerWallet = this.ensureWallet(sellerId);
      this.wallets.set(sellerId, sellerWallet + totalPrice);
    }

    item.supply = Math.max(0, item.supply - quantity);
    item.demand = item.demand + quantity;

    const transaction: EconomyTransaction = {
      id: `txn_${Date.now()}_${++this.idCounter}`,
      buyerId,
      sellerId,
      itemType,
      quantity,
      totalPrice,
      timestamp: Date.now(),
    };

    this.eventBus.emit({
      type: 'ECONOMY_TRANSACTION' as CognitiveEventType,
      source: 'economy-engine',
      data: {
        transactionId: transaction.id,
        buyerId,
        sellerId,
        itemType,
        quantity,
        totalPrice,
      },
    });

    return transaction;
  }

  updatePrices(): void {
    const updates: Record<string, number> = {};

    for (const [type, item] of this.inventory) {
      const ratio = item.supply > 0 ? item.demand / item.supply : item.demand;
      const targetPrice = item.basePrice * Math.max(0.1, Math.min(10, ratio));
      const delta = (targetPrice - item.currentPrice) * this.config.priceAdjustmentRate;
      const newPrice = clampPrice(item.currentPrice + delta);
      item.currentPrice = newPrice;

      item.priceHistory.push(newPrice);
      if (item.priceHistory.length > this.config.maxPriceHistory) {
        item.priceHistory.shift();
      }

      item.demand = Math.max(0, item.demand * 0.95);
      item.supply = Math.min(1000, item.supply + 5);

      updates[type] = newPrice;
    }

    this.eventBus.emit({
      type: 'ECONOMY_PRICE_UPDATE' as CognitiveEventType,
      source: 'economy-engine',
      data: { updates },
    });
  }

  getItemPrice(itemType: EconomyItemType): number {
    const item = this.inventory.get(itemType);
    return item ? item.currentPrice : 0;
  }

  getInventory(): EconomyItem[] {
    return [...this.inventory.values()];
  }

  applyWorldEvent(event: WorldEventImpact): void {
    if (event.itemType) {
      const item = this.inventory.get(event.itemType);
      if (item) {
        if (event.supplyDelta) item.supply = Math.max(0, item.supply + event.supplyDelta);
        if (event.demandDelta) item.demand = Math.max(0, item.demand + event.demandDelta);
      }
    } else {
      for (const item of this.inventory.values()) {
        if (event.supplyDelta) item.supply = Math.max(0, item.supply + event.supplyDelta);
        if (event.demandDelta) item.demand = Math.max(0, item.demand + event.demandDelta);
      }
    }
    this.updatePrices();
  }

  getNPCWallet(npcId: NPCId): number {
    return this.ensureWallet(npcId);
  }

  setNPCWallet(npcId: NPCId, amount: number): void {
    this.wallets.set(npcId, Math.max(0, amount));
  }
}

export {
  ITEM_BASE_PRICES as ECONOMY_ITEM_BASE_PRICES,
  ITEM_TYPES as ECONOMY_ITEM_TYPES,
  PRICE_ADJUSTMENT_RATE as ECONOMY_PRICE_ADJUSTMENT_RATE,
  MAX_PRICE_HISTORY as ECONOMY_MAX_PRICE_HISTORY,
};
export type { WorldEventImpact as EconomyWorldEventImpact };
