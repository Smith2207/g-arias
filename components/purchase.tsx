'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { money, Presentation, presentationLabel, presentations } from '@/lib/commerce';
export function Purchase({ product }: { product: { id: string; nombre: string; imagen: string; unidadesPorCaja: number; prices: Record<Presentation, number> } }) {
  const [type, setType] = useState<Presentation>('mediaDocena');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => { Promise.resolve(useCart.persist.rehydrate()).then(() => setReady(true)); }, []);
  const valid = Number.isInteger(quantity) && quantity >= 1 && quantity <= 999;
  const units = type === 'mediaDocena' ? 6 : type === 'docena' ? 12 : product.unidadesPorCaja;
  function updateQuantity(value: number) { setQuantity(value); setAdded(false); }
  return <form className="mt-7" onSubmit={e => {
    e.preventDefault();
    if (!ready || !valid) return;
    useCart.getState().add({ id: product.id, nombre: product.nombre, imagen: product.imagen, unidadesPorCaja: product.unidadesPorCaja, precio: product.prices[type], cantidad: quantity, presentacion: type });
    setAdded(true);
  }}>
    <fieldset><legend className="mb-3 text-sm font-semibold">1. Elige tu presentación</legend><div className="space-y-2.5">{presentations.map(p => <label key={p} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition hover:border-accent ${type === p ? 'border-accent bg-[#f3eee5] shadow-sm' : 'border-ink/15 bg-white'}`}>
      <input type="radio" name="presentacion" value={p} checked={type === p} onChange={() => { setType(p); setAdded(false); }} className="h-4 w-4 shrink-0 accent-ink" />
      <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium">{presentationLabel(p, product.unidadesPorCaja)}</span><span className="text-right"><strong className="block text-base tabular-nums">{money(product.prices[p])}</strong><span className="text-[10px] text-stone-500">por paquete completo</span></span></span>
    </label>)}</div></fieldset>
    <div className="mt-6 flex flex-wrap items-end justify-between gap-5"><div><label htmlFor="quantity" className="mb-3 block text-sm font-semibold">2. Cantidad de paquetes</label><div className="inline-flex items-center rounded-full border border-ink/20 bg-white p-1"><button type="button" disabled={!valid || quantity <= 1} aria-label="Reducir paquetes" onClick={() => updateQuantity(quantity - 1)} className="quantity-button"><Minus size={16} /></button><input id="quantity" className="quantity-input" type="number" min={1} max={999} required value={quantity || ''} onChange={e => updateQuantity(Number(e.target.value))} /><button type="button" disabled={!valid || quantity >= 999} aria-label="Aumentar paquetes" onClick={() => updateQuantity(quantity + 1)} className="quantity-button"><Plus size={16} /></button></div></div><div className="text-right" aria-live="polite"><p className="text-xs text-stone-500">Subtotal · {valid ? quantity * units : 0} unidades</p><p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{valid ? money(Math.round(product.prices[type] * 100) * quantity / 100) : '—'}</p></div></div>
    {!valid && <p role="alert" className="mt-3 text-xs text-red-700">Elige entre 1 y 999 paquetes completos.</p>}
    <button disabled={!ready || !valid} className="btn mt-6 w-full"><ShoppingBag size={18} />Agregar al carrito <ArrowRight size={17} /></button>
    {added && <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"><span className="flex items-center gap-2"><Check size={17} />Agregado a tu pedido</span><Link href="/carrito" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">Ver carrito →</Link></div>}
  </form>;
}
