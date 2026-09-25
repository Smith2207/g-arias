'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { z } from 'zod';
import { CartItem, itemKey, presentations } from './commerce';
const itemSchema = z.object({ id: z.string(), nombre: z.string(), imagen: z.string(), presentacion: z.enum(presentations), unidadesPorCaja: z.number().int().positive().multipleOf(12), precio: z.number().positive().max(99999999.99), cantidad: z.number().int().min(1).max(999) });
type Cart = { items: CartItem[]; add: (item: CartItem) => void; quantity: (key: string, n: number) => void; remove: (key: string) => void; clear: () => void };
export const useCart = create<Cart>()(persist((set) => ({
  items: [],
  add: item => set(s => { const existing = s.items.find(i => itemKey(i) === itemKey(item)); return { items: existing ? s.items.map(i => itemKey(i) === itemKey(item) ? { ...item, cantidad: Math.min(999, i.cantidad + item.cantidad) } : i) : [...s.items, item] }; }),
  quantity: (key, n) => { if (Number.isInteger(n) && n >= 1 && n <= 999) set(s => ({ items: s.items.map(i => itemKey(i) === key ? { ...i, cantidad: n } : i) })); },
  remove: key => set(s => ({ items: s.items.filter(i => itemKey(i) !== key) })),
  clear: () => set({ items: [] }),
}), { name: 'arias-cart-v1', storage: createJSONStorage(() => {
  const fallback = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  if (typeof window === 'undefined') return fallback;
  try { return window.localStorage; } catch { return fallback; }
}), skipHydration: true, partialize: s => ({ items: s.items }), merge: (persisted, current) => { const parsed = z.object({ items: z.array(itemSchema).max(500) }).safeParse(persisted); return { ...current, items: parsed.success ? parsed.data.items : [] }; } }));
