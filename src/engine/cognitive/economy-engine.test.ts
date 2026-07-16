import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CognitiveEventBus } from './event-bus';
import { EconomyEngine, BASE_PRICES, ITEM_TYPES } from './economy-engine';
import type { WorldEvent } from '../types';

describe('EconomyEngine', () => {
  let eventBus: CognitiveEventBus;
  let economy: EconomyEngine;

  beforeEach(() => {
    eventBus = new CognitiveEventBus();
    economy = new EconomyEngine(eventBus);
  });

  describe('processTransaction', () => {
    it('completes valid transaction and returns transaction record', () => {
      economy.setNPCWallet('buyer-1', 1000);

      const tx = economy.processTransaction('buyer-1', 'world', 'food', 5);

      expect(tx).not.toBeNull();
      expect(tx!.buyerId).toBe('buyer-1');
      expect(tx!.sellerId).toBe('world');
      expect(tx!.itemType).toBe('food');
      expect(tx!.quantity).toBe(5);
      expect(tx!.totalPrice).toBe(BASE_PRICES.food * 5);
      expect(tx!.id).toBeDefined();
      expect(tx!.timestamp).toBeDefined();
    });

    it('deducts funds from buyer wallet', () => {
      economy.setNPCWallet('buyer-1', 1000);
      const expectedPrice = BASE_PRICES.food * 5;

      economy.processTransaction('buyer-1', 'world', 'food', 5);

      expect(economy.getNPCWallet('buyer-1')).toBe(1000 - expectedPrice);
    });

    it('credits funds to seller wallet', () => {
      economy.setNPCWallet('buyer-1', 1000);
      economy.setNPCWallet('seller-1', 0);
      const expectedPrice = BASE_PRICES.food * 5;

      economy.processTransaction('buyer-1', 'seller-1', 'food', 5);

      expect(economy.getNPCWallet('seller-1')).toBe(expectedPrice);
    });

    it('returns null when insufficient funds', () => {
      economy.setNPCWallet('buyer-1', 1);

      const tx = economy.processTransaction('buyer-1', 'world', 'weapon', 1);

      expect(tx).toBeNull();
    });

    it('returns null when insufficient supply', () => {
      economy.setNPCWallet('buyer-1', 1000000);

      const tx = economy.processTransaction('buyer-1', 'world', 'weapon', 9999);

      expect(tx).toBeNull();
    });

    it('returns null for zero or negative quantity', () => {
      economy.setNPCWallet('buyer-1', 1000);

      expect(economy.processTransaction('buyer-1', 'world', 'food', 0)).toBeNull();
      expect(economy.processTransaction('buyer-1', 'world', 'food', -5)).toBeNull();
    });

    it('emits ECONOMY_TRANSACTION event', () => {
      const handler = vi.fn();
      eventBus.subscribe('ECONOMY_TRANSACTION', handler);
      economy.setNPCWallet('buyer-1', 1000);

      economy.processTransaction('buyer-1', 'world', 'food', 3);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe('ECONOMY_TRANSACTION');
      expect(event.data.itemType).toBe('food');
      expect(event.data.quantity).toBe(3);
    });

    it('reduces supply after transaction', () => {
      economy.setNPCWallet('buyer-1', 10000);
      const inventory = economy.getInventory();
      const initialSupply = inventory.food.supply;

      economy.processTransaction('buyer-1', 'world', 'food', 10);

      expect(economy.getInventory().food.supply).toBe(initialSupply - 10);
    });
  });

  describe('updatePrices', () => {
    it('adjusts prices based on supply/demand', () => {
      const initialPrice = economy.getItemPrice('food');

      const inventory = economy.getInventory();
      inventory.food.supply = 10;
      inventory.food.demand = 200;

      economy.updatePrices();

      expect(economy.getItemPrice('food')).not.toBe(initialPrice);
    });

    it('emits ECONOMY_PRICE_UPDATE event', () => {
      const handler = vi.fn();
      eventBus.subscribe('ECONOMY_PRICE_UPDATE', handler);

      economy.updatePrices();

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe('ECONOMY_PRICE_UPDATE');
      expect(event.data.updates).toBeDefined();
    });

    it('updates all item types', () => {
      economy.updatePrices();

      const handler = vi.fn();
      eventBus.subscribe('ECONOMY_PRICE_UPDATE', handler);
      economy.updatePrices();

      const updates = handler.mock.calls[0][0].data.updates;
      expect(Object.keys(updates)).toHaveLength(9);
    });
  });

  describe('getItemPrice', () => {
    it('returns current price', () => {
      expect(economy.getItemPrice('food')).toBe(BASE_PRICES.food);
      expect(economy.getItemPrice('weapon')).toBe(BASE_PRICES.weapon);
      expect(economy.getItemPrice('book')).toBe(BASE_PRICES.book);
    });
  });

  describe('getNPCWallet / setNPCWallet', () => {
    it('wallet management - default wallet is 0', () => {
      expect(economy.getNPCWallet('npc-1')).toBe(0);
    });

    it('setNPCWallet sets the wallet amount', () => {
      economy.setNPCWallet('npc-1', 500);
      expect(economy.getNPCWallet('npc-1')).toBe(500);
    });

    it('setNPCWallet does not allow negative amounts', () => {
      economy.setNPCWallet('npc-1', -100);
      expect(economy.getNPCWallet('npc-1')).toBe(0);
    });

    it('setNPCWallet can update existing wallet', () => {
      economy.setNPCWallet('npc-1', 500);
      economy.setNPCWallet('npc-1', 250);
      expect(economy.getNPCWallet('npc-1')).toBe(250);
    });
  });

  describe('applyWorldEvent', () => {
    it('adjusts supply/demand based on event impact', () => {
      const initialFoodSupply = economy.getInventory().food.supply;

      const event: WorldEvent = {
        id: 'evt-1',
        type: 'drought',
        timestamp: Date.now(),
        description: 'A drought struck the land.',
        affectedLocations: [],
        economicImpact: {
          food: -30,
          water: -20,
          weapon: 0,
          tool: 0,
          medicine: 0,
          clothing: 0,
          luxury: 0,
          material: 0,
          book: 0,
        },
        duration: 7,
      };

      economy.applyWorldEvent(event);

      expect(economy.getInventory().food.supply).toBe(initialFoodSupply - 30);
    });

    it('increases supply for positive impacts', () => {
      const initialMaterialSupply = economy.getInventory().material.supply;

      const event: WorldEvent = {
        id: 'evt-2',
        type: 'discovery',
        timestamp: Date.now(),
        description: 'A new resource was discovered.',
        affectedLocations: [],
        economicImpact: {
          food: 0,
          water: 0,
          weapon: 0,
          tool: 0,
          medicine: 0,
          clothing: 0,
          luxury: 0,
          material: 30,
          book: 0,
        },
        duration: 2,
      };

      economy.applyWorldEvent(event);

      expect(economy.getInventory().material.supply).toBe(initialMaterialSupply + 30);
    });

    it('increases demand when supply is reduced', () => {
      const initialFoodDemand = economy.getInventory().food.demand;

      const event: WorldEvent = {
        id: 'evt-3',
        type: 'storm',
        timestamp: Date.now(),
        description: 'A storm hit.',
        affectedLocations: [],
        economicImpact: {
          food: -20,
          water: 0,
          weapon: 0,
          tool: 0,
          medicine: 0,
          clothing: 0,
          luxury: 0,
          material: 0,
          book: 0,
        },
        duration: 1,
      };

      economy.applyWorldEvent(event);

      expect(economy.getInventory().food.demand).toBeGreaterThan(initialFoodDemand);
    });
  });

  describe('item types', () => {
    it('9 item types initialized', () => {
      expect(ITEM_TYPES).toHaveLength(9);
      const expectedTypes = [
        'food', 'water', 'weapon', 'tool', 'medicine',
        'clothing', 'luxury', 'material', 'book',
      ];
      expect(ITEM_TYPES).toEqual(expectedTypes);
    });

    it('all items have base price, current price, supply, and demand', () => {
      const inventory = economy.getInventory();

      for (const type of ITEM_TYPES) {
        const item = inventory[type];
        expect(item.basePrice).toBeGreaterThan(0);
        expect(item.currentPrice).toBeGreaterThan(0);
        expect(item.supply).toBeGreaterThan(0);
        expect(item.demand).toBeGreaterThan(0);
        expect(item.priceHistory.length).toBeGreaterThan(0);
      }
    });

    it('current price starts at base price', () => {
      const inventory = economy.getInventory();

      for (const type of ITEM_TYPES) {
        expect(inventory[type].currentPrice).toBe(BASE_PRICES[type]);
      }
    });
  });
});
