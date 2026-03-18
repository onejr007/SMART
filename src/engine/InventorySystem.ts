/**
 * InventorySystem.ts
 * Inventory System (#33)
 * Grid-based inventory UI
 * Item stacking dan categorization
 */

export interface Item {
  id: string;
  name: string;
  description: string;
  icon?: string;
  stackable: boolean;
  maxStack: number;
  category: string;
  weight: number;
  value: number;
  metadata?: Record<string, any>;
}

export interface ItemStack {
  item: Item;
  quantity: number;
  slotIndex: number;
}

export interface InventoryConfig {
  maxSlots: number;
  maxWeight?: number;
  allowedCategories?: string[];
}

export class Inventory {
  private slots: (ItemStack | null)[];
  private config: InventoryConfig;
  private currentWeight: number = 0;
  private onChange?: () => void;

  constructor(config: InventoryConfig) {
    this.config = config;
    this.slots = new Array(config.maxSlots).fill(null);
  }

  public addItem(item: Item, quantity: number = 1): boolean {
    // Check category restriction
    if (this.config.allowedCategories && 
        !this.config.allowedCategories.includes(item.category)) {
      return false;
    }

    // Check weight limit
    if (this.config.maxWeight) {
      const newWeight = this.currentWeight + (item.weight * quantity);
      if (newWeight > this.config.maxWeight) {
        return false;
      }
    }

    let remainingQuantity = quantity;

    // Try to stack with existing items
    if (item.stackable) {
      for (let i = 0; i < this.slots.length; i++) {
        const slot = this.slots[i];
        if (slot && slot.item.id === item.id) {
          const canAdd = Math.min(
            remainingQuantity,
            slot.item.maxStack - slot.quantity
          );
          
          if (canAdd > 0) {
            slot.quantity += canAdd;
            remainingQuantity -= canAdd;
            this.currentWeight += item.weight * canAdd;
          }

          if (remainingQuantity === 0) {
            this.notifyChange();
            return true;
          }
        }
      }
    }

    // Add to empty slots
    while (remainingQuantity > 0) {
      const emptySlot = this.findEmptySlot();
      if (emptySlot === -1) {
        return false; // Inventory full
      }

      const addQuantity = item.stackable 
        ? Math.min(remainingQuantity, item.maxStack)
        : 1;

      this.slots[emptySlot] = {
        item,
        quantity: addQuantity,
        slotIndex: emptySlot
      };

      remainingQuantity -= addQuantity;
      this.currentWeight += item.weight * addQuantity;
    }

    this.notifyChange();
    return true;
  }

  public removeItem(slotIndex: number, quantity: number = 1): ItemStack | null {
    const slot = this.slots[slotIndex];
    if (!slot) return null;

    const removeQuantity = Math.min(quantity, slot.quantity);
    slot.quantity -= removeQuantity;
    this.currentWeight -= slot.item.weight * removeQuantity;

    const removed: ItemStack = {
      item: slot.item,
      quantity: removeQuantity,
      slotIndex
    };

    if (slot.quantity <= 0) {
      this.slots[slotIndex] = null;
    }

    this.notifyChange();
    return removed;
  }

  public moveItem(fromSlot: number, toSlot: number): boolean {
    if (fromSlot === toSlot) return false;
    if (fromSlot < 0 || fromSlot >= this.slots.length) return false;
    if (toSlot < 0 || toSlot >= this.slots.length) return false;

    const fromStack = this.slots[fromSlot];
    const toStack = this.slots[toSlot];

    if (!fromStack) return false;

    // Empty destination
    if (!toStack) {
      this.slots[toSlot] = fromStack;
      this.slots[fromSlot] = null;
      this.slots[toSlot]!.slotIndex = toSlot;
      this.notifyChange();
      return true;
    }

    // Same item, try to stack
    if (fromStack.item.id === toStack.item.id && toStack.item.stackable) {
      const canAdd = Math.min(
        fromStack.quantity,
        toStack.item.maxStack - toStack.quantity
      );

      if (canAdd > 0) {
        toStack.quantity += canAdd;
        fromStack.quantity -= canAdd;

        if (fromStack.quantity <= 0) {
          this.slots[fromSlot] = null;
        }

        this.notifyChange();
        return true;
      }
    }

    // Swap items
    this.slots[toSlot] = fromStack;
    this.slots[fromSlot] = toStack;
    fromStack.slotIndex = toSlot;
    toStack.slotIndex = fromSlot;

    this.notifyChange();
    return true;
  }

  public getItem(slotIndex: number): ItemStack | null {
    return this.slots[slotIndex];
  }

  public hasItem(itemId: string, quantity: number = 1): boolean {
    let total = 0;
    for (const slot of this.slots) {
      if (slot && slot.item.id === itemId) {
        total += slot.quantity;
        if (total >= quantity) return true;
      }
    }
    return false;
  }

  public countItem(itemId: string): number {
    let total = 0;
    for (const slot of this.slots) {
      if (slot && slot.item.id === itemId) {
        total += slot.quantity;
      }
    }
    return total;
  }

  public findItemsByCategory(category: string): ItemStack[] {
    return this.slots.filter(slot => 
      slot !== null && slot.item.category === category
    ) as ItemStack[];
  }

  public getEmptySlots(): number {
    return this.slots.filter(slot => slot === null).length;
  }

  private findEmptySlot(): number {
    return this.slots.findIndex(slot => slot === null);
  }

  public getCurrentWeight(): number {
    return this.currentWeight;
  }

  public getMaxWeight(): number {
    return this.config.maxWeight || Infinity;
  }

  public getSlots(): (ItemStack | null)[] {
    return [...this.slots];
  }

  public clear(): void {
    this.slots.fill(null);
    this.currentWeight = 0;
    this.notifyChange();
  }

  public serialize(): any {
    return {
      slots: this.slots.map(slot => slot ? {
        itemId: slot.item.id,
        quantity: slot.quantity,
        slotIndex: slot.slotIndex
      } : null),
      currentWeight: this.currentWeight
    };
  }

  public setOnChange(callback: () => void): void {
    this.onChange = callback;
  }

  private notifyChange(): void {
    if (this.onChange) {
      this.onChange();
    }
  }
}

// Item Registry
export class ItemRegistry {
  private static instance: ItemRegistry;
  private items: Map<string, Item> = new Map();

  private constructor() {}

  public static getInstance(): ItemRegistry {
    if (!ItemRegistry.instance) {
      ItemRegistry.instance = new ItemRegistry();
    }
    return ItemRegistry.instance;
  }

  public registerItem(item: Item): void {
    this.items.set(item.id, item);
  }

  public getItem(id: string): Item | undefined {
    return this.items.get(id);
  }

  public getAllItems(): Item[] {
    return Array.from(this.items.values());
  }

  public getItemsByCategory(category: string): Item[] {
    return Array.from(this.items.values()).filter(
      item => item.category === category
    );
  }
}
