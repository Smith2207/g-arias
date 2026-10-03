import Link from 'next/link';
import { randomUUID } from 'node:crypto';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { money } from '@/lib/commerce';
import { movementLabels, netCollected } from '@/lib/operations';
import { operationsSummary } from '@/lib/operations-summary';
import { MovementForm } from '@/components/movement-form';
export const metadata = { title: 'Contabilidad' };
export default async function Accounting({ searchParams }: { searchParams: Promise<{ pagina?: string; vista?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.min(100000, Math.max(1, Number(params.pagina) || 1)) | 0;
  const view = params.vista === 'saldos' ? 'saldos' : 'movimientos';
  const [summary, movements, orders, count] = await Promise.all([
    operationsSummary(db),
    view === 'movimientos' ? db.movimientoCaja.findMany({ include: { pedido: { select: { id: true, codigo: true } } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 30, skip: (page - 1) * 30 }) : [],
    view === 'saldos' ? db.pedido.findMany({ where: { estado: { in: ['CONFIRMADO', 'ENTREGADO', 'CANCELADO'] } }, include: { movimientos: true }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 30, skip: (page - 1) * 30 }) : [],
    view === 'movimientos' ? db.movimientoCaja.count() : db.pedido.count({ where: { estado: { in: ['CONFIRMADO', 'ENTREGADO', 'CANCELADO'] } } }),
  ]);
  return <>
    <h1 className="text-3xl font-semibold tracking-tight">Contabilidad</h1>
    <p className="mt-3 text-sm leading-6 text-stone-500">Control operativo en soles: ventas confirmadas, cobros registrados y gastos. Acumulado histórico; caja refleja movimientos registrados, sin saldo inicial. No incluye impuestos, costo de ventas ni libros fiscales.</p>
    <div className="my-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
      ['Ventas vigentes', summary.sales], ['Cobros', summary.collections], ['Gastos', summary.expenses], ['Devoluciones realizadas', summary.returns], ['Flujo neto de caja', summary.cash], ['Por cobrar', summary.receivable], ['Por devolver (cancelados)', summary.refundable],
    ].map(([label, value]) => <div className="card min-w-0 p-5" key={String(label)}><p className="text-sm text-stone-500">{String(label)}</p><p className="mt-2 break-words text-2xl font-semibold">{money(Number(value))}</p></div>)}</div>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="card min-w-0 p-5">
        <nav aria-label="Vistas contables" className="mb-5 flex flex-wrap gap-4 text-sm"><Link aria-current={view === 'movimientos' ? 'page' : undefined} className="underline" href="?vista=movimientos">Movimientos de caja</Link><Link aria-current={view === 'saldos' ? 'page' : undefined} className="underline" href="?vista=saldos">Saldos por pedido</Link></nav>
        {view === 'movimientos' ? <div className="divide-y divide-stone-100">{movements.map(m => <article key={m.id} className="py-4 text-sm"><div className="flex flex-wrap justify-between gap-2"><h2 className="break-words font-medium">{movementLabels[m.tipo]} · {m.concepto}</h2><strong>{m.tipo === 'COBRO' ? '+' : '−'}{money(Number(m.monto))}</strong></div><p className="mt-2 break-words text-xs text-stone-500">{m.createdAt.toLocaleString('es-PE', { timeZone: 'America/Lima' })} · {m.medio} · {m.registradoPor}{m.referencia ? ` · Ref. ${m.referencia}` : ''}</p>{m.pedido && <Link className="mt-2 inline-block underline" href={`/admin/pedidos/${m.pedido.id}`}>{m.pedido.codigo}</Link>}</article>)}{!movements.length && <p className="py-8 text-sm text-stone-500">Aún no hay movimientos registrados. Registra los cobros desde cada pedido.</p>}</div>
        : <div className="divide-y divide-stone-100">{orders.map(o => { const net = netCollected(o.movimientos); const cancelled = o.estado === 'CANCELADO'; const balance = cancelled ? net : o.total.minus(net); return <article key={o.id} className="flex flex-wrap justify-between gap-3 py-4 text-sm"><div><Link className="font-medium underline" href={`/admin/pedidos/${o.id}`}>{o.codigo}</Link><p className="mt-1 break-words text-stone-500">{o.nombre} · {cancelled ? 'Cancelado' : 'Venta vigente'}</p></div><p>{cancelled ? 'Por devolver' : 'Por cobrar'}: <strong>{money(Number(balance))}</strong></p></article>; })}{!orders.length && <p className="py-8 text-sm text-stone-500">No hay pedidos confirmados.</p>}</div>}
        <nav aria-label="Paginación contable" className="mt-5 flex flex-wrap items-center gap-4 text-sm">{page > 1 && <Link className="underline" href={`?vista=${view}&pagina=${page - 1}`}>Anterior</Link>}<span>Página {page} · {count} registros</span>{page * 30 < count && <Link className="underline" href={`?vista=${view}&pagina=${page + 1}`}>Siguiente</Link>}</nav>
      </section>
      <aside className="card min-w-0 p-5"><h2 className="mb-4 font-semibold">Registrar gasto</h2><MovementForm initialKey={randomUUID()} /><p className="mt-5 text-xs leading-5 text-stone-500">Para registrar un cobro o una devolución, abre el pedido correspondiente.</p><Link className="mt-3 inline-block text-sm underline" href="/admin/pedidos">Ir a pedidos</Link></aside>
    </div>
  </>;
}
