'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ClipboardList,
  Settings,
} from 'lucide-react';
const links = [
  { href: '/admin', label: 'Inicio', Icon: LayoutDashboard },
  { href: '/admin/productos', label: 'Productos', Icon: Package },
  { href: '/admin/inventario', label: 'Inventario', Icon: Boxes },
  { href: '/admin/pedidos', label: 'Pedidos', Icon: ClipboardList },
  { href: '/admin/configuracion', label: 'Ajustes', Icon: Settings },
];
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Administración"
      className="grid grid-cols-5 gap-1 lg:grid-cols-1 lg:gap-1"
    >
      {links.map(({ href, label, Icon }) => {
        const active =
          href === '/admin' ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-w-0 min-h-12 flex-col items-center justify-center gap-1 rounded-md px-0.5 py-2 text-[10px] font-medium transition sm:text-xs lg:flex-row lg:justify-start lg:gap-1 lg:px-3 lg:min-h-10 ${active ? 'bg-white text-ink shadow-sm' : 'text-stone-500 hover:bg-white/60 hover:text-ink'}`}
          >
            <Icon size={17} className="shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
