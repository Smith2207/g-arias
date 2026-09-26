import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, MoveUpRight, UserRound } from 'lucide-react';
import { CartLink } from '@/components/cart-link';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Arias · Sombreros y gorras al por mayor', template: '%s | Arias' },
  description: 'Estilo para tu tienda. Sombreros y gorras por media docena, docena o caja. Arma tu pedido y conversemos por WhatsApp.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col">
        <a href="#contenido" className="skip-link">Saltar al contenido</a>
        <div className="announcement">
          <span>BUEN ESTILO. MEJORES OPORTUNIDADES.</span>
          <span className="hidden sm:flex">Venta al por mayor · Desde 6 unidades <ArrowUpRight size={13} /></span>
        </div>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" aria-label="Arias, inicio" className="brand"><strong>Arias</strong></Link>
            <nav aria-label="Navegación principal" className="main-nav">
              <Link href="/#catalogo">Colección</Link>
              <Link href="/#como-comprar" className="hidden sm:block">Cómo comprar</Link>
            </nav>
            <div className="flex items-center gap-2"><Link href="/login" aria-label="Mi cuenta" className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 hover:border-ink/50"><UserRound size={18} /></Link><CartLink /></div>
          </div>
        </header>
        <main id="contenido" className="flex-1">{children}</main>
        <footer className="site-footer">
          <div className="container-page pb-7">
            <div className="flex flex-col justify-between gap-8 border-b border-white/15 pb-10 sm:flex-row">
              <div>
                <Link href="/" className="brand text-white"><strong>Arias</strong></Link>
                <p className="mt-5 max-w-xs text-sm leading-7 text-white/60">Sombreros y gorras al por mayor.<br />Una nueva oportunidad para tu negocio.</p>
              </div>
              <nav aria-label="Enlaces de ayuda" className="grid content-start gap-4 text-sm">
                <Link href="/#catalogo" className="flex items-center gap-8">Explorar la colección <MoveUpRight size={16} /></Link>
                <Link href="/#como-comprar">Cómo hacer tu pedido</Link>
                <Link href="/carrito">Ver mi pedido</Link>
                <Link href="/login">Mi cuenta</Link>
              </nav>
            </div>
            <div className="flex flex-wrap justify-between gap-3 pt-6 text-xs text-white/50">
              <p>© {new Date().getFullYear()} Coorporacion Global Arias G&amp;L. Todos los derechos reservados.</p>
              <p>Venta mayorista · Atención personalizada</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
