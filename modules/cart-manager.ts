import type { CartItem } from "../types.js";
import { showToast } from "./utils.js";

const STORAGE_KEY = "cartStorage";

export class CartManager {
  private items: CartItem[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return;

      this.items = parsed.filter(
        (item): item is CartItem =>
          item &&
          (typeof item.key === "string" || typeof item.name === "string") &&
          typeof item.name === "string" &&
          typeof item.price === "number" &&
          typeof item.qty === "number"
      ).map((item) => ({
        ...item,
        key: typeof item.key === "string" ? item.key : item.name,
      }));
    } catch {
      this.items = [];
    }
  }

  public saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
  }

  public add(key: string, name: string, price: number, image: string, categoryName?: string): void {
    const existing = this.items.find((item) => item.key === key);
    if (existing) {
      existing.qty++;
    } else {
      this.items.push({ key, name, categoryName, price, qty: 1, image });
    }
    this.saveToStorage();
  }

  public remove(key: string): void {
    const before = this.items.length;
    const removed = this.items.find((i) => i.key === key);
    this.items = this.items.filter((i) => i.key !== key);
    if (this.items.length < before && removed) {
      showToast(`Usunięto produkt ${removed.name} z zamówienia.`);
    }
    this.saveToStorage();
  }

  public increaseQty(key: string): void {
    const item = this.items.find((i) => i.key === key);
    if (item) {
      item.qty++;
      showToast(`Dodano 1 szt. produktu ${name}.`);
      this.saveToStorage();
    }
  }

  public decreaseQty(key: string): void {
    const item = this.items.find((i) => i.key === key);
    if (item && item.qty > 1) {
      item.qty--;
      showToast(`Usunięto 1 szt. produktu ${name}.`);
      this.saveToStorage();
    }
  }

  public clear(): void {
    this.items = [];
    this.saveToStorage();
  }

  public getTotalPrice(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  public getTotalItemsCount(): number {
    return this.items.reduce((sum, item) => sum + item.qty, 0);
  }

  public getAll(): CartItem[] {
    return [...this.items];
  }

  public isEmpty(): boolean {
    return this.items.length === 0;
  }
}
