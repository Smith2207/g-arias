'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Plus } from 'lucide-react';
const links = [
  { href: '/admin', label: 'Inicio', Icon: LayoutDashboard },
  { href: '/admin/productos', label: 'Productos', Icon: Package },
  { href: '/admin/productos/nuevo', label: 'Crear producto', Icon: Plus },
];
export function AdminNav() {
  const pathname = usePathname();
  return <nav aria-label="Administración" className="grid grid-cols-3 gap-1 lg:grid-cols-1 lg:gap-2">{links.map(({ href, label, Icon }) => {
    const active = href === '/admin/productos' ? pathname.startsWith(href) && pathname !== '/admin/productos/nuevo' : pathname === href;
    return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 py-3 text-[11px] font-medium transition sm:text-sm lg:justify-start lg:px-4 ${active ? 'bg-white/15 text-white' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}><Icon size={17} className="shrink-0" /><span>{label}</span></Link>;
  })}</nav>;
}
