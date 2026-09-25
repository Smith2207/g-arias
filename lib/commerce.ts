export const money = (value: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
export const presentations = ['mediaDocena', 'docena', 'caja'] as const;
export type Presentation = typeof presentations[number];
export function presentationLabel(type: Presentation, units: number) {
  return type === 'mediaDocena' ? '½ docena · 6 unidades' : type === 'docena' ? '1 docena · 12 unidades' : `Caja · ${units / 12} docenas (${units} unidades)`;
}
export type CartItem = { id: string; nombre: string; imagen: string; presentacion: Presentation; unidadesPorCaja: number; precio: number; cantidad: number };
export const itemKey = (item: Pick<CartItem, 'id' | 'presentacion'>) => `${item.id}:${item.presentacion}`;
export const subtotal = (item: CartItem) => Math.round(item.precio * 100) * item.cantidad;
export function whatsappUrl(number: string, items: CartItem[]) {
  if (!/^[1-9]\d{7,14}$/.test(number) || !items.length) return null;
  const message = ['Hola, quisiera realizar este pedido al por mayor:', '', ...items.map(i => `• ${i.nombre}\n  ${presentationLabel(i.presentacion, i.unidadesPorCaja)} × ${i.cantidad}\n  Precio: ${money(i.precio)} | Subtotal: ${money(subtotal(i) / 100)}`), '', `Total: ${money(items.reduce((sum, i) => sum + subtotal(i), 0) / 100)}`, 'Quedo pendiente de confirmar disponibilidad y envío.'].join('\n');
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
