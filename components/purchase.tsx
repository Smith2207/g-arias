'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { money, Presentation, presentationLabel, presentations } from '@/lib/commerce';
export function Purchase({ product }: { product: { id: string; nombre: string; imagen: string; unidadesPorCaja: number; prices: Record<Presentation, number> } }) {
  const [type, setType] = useState<Presentation>('mediaDocena');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => { Promise.resolve(useCart.persist.rehydrate()).then(() => setReady(true)); }, []);
  return <form className="card mt-6 p-5" onSubmit={e => { e.preventDefault(); useCart.getState().add({ id: product.id, nombre: product.nombre, imagen: product.imagen, unidadesPorCaja: product.unidadesPorCaja, precio: product.prices[type], cantidad: quantity, presentacion: type }); setAdded(true); }}><label htmlFor="presentation" className="mb-2 block text-sm font-semibold">Presentación</label><select id="presentation" value={type} onChange={e => { setType(e.target.value as Presentation); setAdded(false); }} className="field">{presentations.map(p => <option key={p} value={p}>{presentationLabel(p, product.unidadesPorCaja)} — {money(product.prices[p])}</option>)}</select><div className="mt-5 flex items-end gap-4"><div className="w-24"><label htmlFor="quantity" className="mb-2 block text-sm font-semibold">Paquetes</label><input id="quantity" className="field" type="number" min={1} max={999} required value={quantity} onChange={e => { setQuantity(Number(e.target.value)); setAdded(false); }}/></div><button disabled={!ready || !Number.isInteger(quantity) || quantity < 1 || quantity > 999} className="btn flex-1">Agregar al carrito</button></div><p className="mt-4 text-sm text-stone-500">Subtotal: <strong className="text-ink">{money(Math.round(product.prices[type] * 100) * quantity / 100)}</strong></p>{added && <p role="status" className="mt-4 text-sm">✓ Agregado a tu pedido. <Link href="/carrito" className="font-bold underline">Ver carrito →</Link></p>}</form>;
}
