import Link from 'next/link';
import { operationsSummary } from '@/lib/operations-summary';
import { money } from '@/lib/commerce';
import { ArrowRight, Camera, Eye, Package, Plus } from 'lucide-react';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
export const metadata = { title: 'Inicio del panel' };
export default async function AdminPage() {
  await requireAdmin();
  const [total, published, withoutPhotos, latest, pending, operations] = await Promise.all([
    db.producto.count(),
    db.producto.count({ where: { activo: true } }),
    db.producto.count({ where: { imagenes: { none: {} } } }),
    db.producto.findMany({ orderBy: { updatedAt: 'desc' }, take: 5, select: { id: true, nombre: true, categoria: true, activo: true } }),
    db.pedido.count({where:{estado:'PENDIENTE'}}),
    operationsSummary(db),
  ]);
  return <>
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-medium tracking-tight">Inicio</h1><p className="mt-2 text-sm text-stone-500">Ventas, contabilidad e inventario conectados con tus despachos.</p></div><Link href="/admin/productos/nuevo" className="btn"><Plus size={17} />Crear producto</Link></div>
    <div className="mb-7 grid gap-3 sm:grid-cols-3">{[
      { title: 'Productos', value: total, href: '/admin/productos', Icon: Package },
      { title: 'Publicados', value: published, href: '/admin/productos?estado=publicados', Icon: Eye },
      { title: 'Pedidos pendientes', value: pending, href: '/admin/pedidos?estado=PENDIENTE', Icon: Package },
    ].map(({ title, value, href, Icon }) => <Link href={href} key={title} className="card flex items-center gap-4 p-5 transition hover:border-accent/40"><Icon size={21} strokeWidth={1.5} className="text-stone-400" /><div className="flex flex-1 items-center justify-between gap-3 sm:block"><h2 className="text-sm text-stone-500">{title}</h2><p className="text-2xl font-semibold tabular-nums sm:mt-2">{value}</p></div><ArrowRight size={16} className="text-stone-400" /></Link>)}</div>
    <div className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
      { title: 'Por cobrar', value: money(Number(operations.receivable)), href: '/admin/contabilidad?vista=saldos' },
      { title: 'Flujo neto de caja', value: money(Number(operations.cash)), href: '/admin/contabilidad' },
      { title: 'Por preparar', value: operations.preparing, href: '/admin/logistica?estado=PREPARACION' },
      { title: 'En camino', value: operations.inTransit, href: '/admin/logistica?estado=EN_CAMINO' },
    ].map(item => <Link key={item.title} href={item.href} className="card min-w-0 p-5"><h2 className="text-sm text-stone-500">{item.title}</h2><p className="mt-2 break-words text-2xl font-semibold">{item.value}</p></Link>)}</div>
    {operations.refundable.gt(0) && <Link href="/admin/contabilidad?vista=saldos" className="mb-6 block rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Hay {money(Number(operations.refundable))} pendientes de devolver por pedidos cancelados. Revisar saldos →</Link>}
    <Link href="/admin/inventario?bajo=1" className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4">Revisar productos con stock bajo <ArrowRight size={15}/></Link>
    {withoutPhotos > 0 && <Link href="/admin/productos?fotos=sin" className="mb-7 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><Camera size={19} className="shrink-0" /><span className="flex-1">{withoutPhotos} {withoutPhotos === 1 ? 'producto sin fotografías' : 'productos sin fotografías'}. Agrega una imagen para completar el catálogo.</span><ArrowRight size={17} className="shrink-0" /></Link>}
    <section className="card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-5 py-4"><h2 className="font-semibold">Últimos productos actualizados</h2>{total > 0 && <Link href="/admin/productos" className="inline-flex min-h-11 items-center gap-2 text-xs text-stone-600">Ver todos <ArrowRight size={14} /></Link>}</div>
      {latest.length ? <ul className="divide-y divide-stone-100">{latest.map(p => <li key={p.id}><Link href={`/admin/productos/${p.id}/editar`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-stone-50"><div className="min-w-0 flex-1"><h3 className="break-words text-sm font-medium">{p.nombre}</h3><p className="mt-1 break-words text-xs text-stone-500">{p.categoria}</p></div><span className={`rounded-full px-2.5 py-1 text-[11px] ${p.activo ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-500'}`}>{p.activo ? 'Publicado' : 'Oculto'}</span><ArrowRight size={16} className="shrink-0 text-stone-400" /></Link></li>)}</ul> : <div className="px-5 py-10 text-center"><Package size={30} strokeWidth={1.25} className="mx-auto mb-4 text-stone-400" /><h3 className="text-lg font-medium">Empecemos por tu primer producto</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">Añade fotos y precios. Puedes dejarlo oculto hasta que esté listo.</p><Link href="/admin/productos/nuevo" className="btn-secondary mt-5">Agregar producto</Link></div>}
    </section>
    <p className="mt-6 text-xs leading-6 text-stone-500">Confirma los pedidos para descontar existencias. Al cancelar un pedido confirmado, el stock descontado se devuelve.</p>
  </>;
}
