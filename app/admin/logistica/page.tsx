import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { dispatchLabels } from '@/lib/operations';
import { operationsSummary } from '@/lib/operations-summary';
export const metadata = { title: 'Logística' };
export default async function Logistics({ searchParams }: { searchParams: Promise<{ estado?: string; q?: string; pagina?: string }> }) {
  await requireAdmin();
  const { estado = 'PREPARACION', q = '', pagina } = await searchParams;
  const selected = estado === 'EN_CAMINO' || estado === 'ENTREGADO' ? estado : 'PREPARACION';
  const page = Math.min(100000, Math.max(1, Number(pagina) || 1)) | 0;
  const where: Prisma.PedidoWhereInput = { estado: { in: ['CONFIRMADO', 'ENTREGADO'] as ('CONFIRMADO' | 'ENTREGADO')[] }, despacho: selected, OR: [{ codigo: { contains: q.slice(0, 100), mode: 'insensitive' as const } }, { nombre: { contains: q.slice(0, 100), mode: 'insensitive' as const } }] };
  const [orders, count, summary] = await Promise.all([
    db.pedido.findMany({ where, include: { lineas: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], take: 30, skip: (page - 1) * 30 }),
    db.pedido.count({ where }), operationsSummary(db),
  ]);
  const href = (p: number) => `?${new URLSearchParams({ estado: selected, q, pagina: String(p) })}`;
  return <>
    <h1 className="text-3xl font-semibold tracking-tight">Logística</h1>
    <p className="mt-3 text-sm leading-6 text-stone-500">Los pedidos confirmados entran a preparación con el stock ya descontado. Administra dirección, transportista y seguimiento desde el pedido.</p>
    <div className="my-6 grid gap-3 sm:grid-cols-3"><Link href="?estado=PREPARACION" className="card p-5"><p className="text-sm text-stone-500">Por preparar</p><p className="mt-2 text-2xl font-semibold">{summary.preparing}</p></Link><Link href="?estado=EN_CAMINO" className="card p-5"><p className="text-sm text-stone-500">En camino</p><p className="mt-2 text-2xl font-semibold">{summary.inTransit}</p></Link><Link href="/admin/inventario?bajo=1" className="card flex items-center p-5 text-sm underline">Revisar stock y reposición →</Link></div>
    <form className="mb-6 flex flex-wrap gap-3"><input className="field max-w-sm" name="q" aria-label="Buscar pedido o cliente" placeholder="Código o cliente" defaultValue={q} /><select className="field max-w-xs" name="estado" aria-label="Estado del despacho" defaultValue={selected}>{(['PREPARACION', 'EN_CAMINO', 'ENTREGADO'] as const).map(s => <option key={s} value={s}>{dispatchLabels[s]}</option>)}</select><button className="btn-secondary">Filtrar</button></form>
    <div className="grid gap-4 md:grid-cols-2">{orders.map(o => <article key={o.id} className="card min-w-0 space-y-3 p-5"><div className="flex flex-wrap justify-between gap-2"><Link href={`/admin/pedidos/${o.id}#logistica`} className="font-semibold underline">{o.codigo}</Link><span className="text-xs text-stone-500">{dispatchLabels[o.despacho]}</span></div><p className="break-words text-sm">{o.nombre} · {o.telefono}</p><p className="text-sm text-stone-500">{o.lineas.reduce((sum, l) => sum + l.unidades, 0)} unidades · {o.createdAt.toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}</p><p className="break-words text-sm">{o.direccion || 'Dirección por completar'}</p><p className="break-words text-sm text-stone-500">{o.transportista || 'Transportista por asignar'}{o.seguimiento ? ` · Guía: ${o.seguimiento}` : ''}</p><Link href={`/admin/pedidos/${o.id}`} className="inline-block text-sm underline">Gestionar despacho y cobros →</Link></article>)}</div>
    {!orders.length && <p className="card p-8 text-sm text-stone-500">No hay pedidos en este estado con los filtros seleccionados.</p>}
    <nav aria-label="Paginación logística" className="mt-6 flex flex-wrap gap-4 text-sm">{page > 1 && <Link className="underline" href={href(page - 1)}>Anterior</Link>}<span>Página {page} · {count} pedidos</span>{page * 30 < count && <Link className="underline" href={href(page + 1)}>Siguiente</Link>}</nav>
  </>;
}
