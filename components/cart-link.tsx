'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCart } from '@/lib/cart';

export function CartLink() {
  const items = useCart(state => state.items);
  const count = items.reduce((sum, item) => sum + item.cantidad, 0);
  const reduced = useReducedMotion();
  useEffect(() => { void useCart.persist.rehydrate(); }, []);

  return (
    <Link href="/carrito" className="cart-link" aria-label={`Mi pedido, ${count} paquetes`}>
      <ShoppingBag size={19} strokeWidth={1.6} aria-hidden="true" />
      <span className="hidden sm:inline">Mi pedido</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={count} initial={reduced ? false : { scale: 0.6 }} animate={{ scale: 1 }} className="cart-count">
          {count > 99 ? '99+' : count}
        </motion.span>
      </AnimatePresence>
    </Link>
  );
}
