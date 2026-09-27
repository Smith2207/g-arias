import {getStoreSettings} from '@/lib/store-settings';
import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { CartLink } from '@/components/cart-link';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings=await getStoreSettings();
  return <>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" aria-label={`${settings.nombre}, inicio`} className="brand"><strong className="block max-w-28 truncate sm:max-w-56">{settings.nombre}</strong></Link>
            <nav aria-label="Navegación principal" className="main-nav">
              <Link href="/#catalogo">Colección</Link>
              <Link href="/#como-comprar" className="hidden sm:block">Cómo comprar</Link>
            </nav>
            <div className="flex items-center gap-2"><Link href="/login" aria-label="Mi cuenta" className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 hover:border-ink/50"><UserRound size={18} /></Link><CartLink /></div>
          </div>
        </header>
        <main id="contenido" className="flex-1">{children}</main>
        <footer className="border-t border-ink/10">
          <div className="container-page flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-stone-500">© {new Date().getFullYear()} {settings.nombre} · Venta al por mayor</p>{settings.contacto&&<p className="max-w-sm break-words text-xs text-stone-500">{settings.contacto}</p>}
            <nav aria-label="Enlaces de ayuda" className="flex flex-wrap gap-x-5 text-xs text-stone-600"><Link className="inline-flex min-h-11 items-center" href="/#como-comprar">Cómo comprar</Link><Link className="inline-flex min-h-11 items-center" href="/carrito">Ver mi pedido</Link><Link className="inline-flex min-h-11 items-center" href="/login">Mi cuenta</Link></nav>
          </div>
        </footer>
  </>;
}
