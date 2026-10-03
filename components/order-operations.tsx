import Link from 'next/link';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { money } from '@/lib/commerce';
import { dispatchLabels, movementLabels, netCollected } from '@/lib/operations';
import { ManagementForm } from './management-form';
import { MovementForm } from './movement-form';
import { saveDispatch } from '@/app/admin/operaciones-actions';
export function OrderOperations({ order: o }: { order: Prisma.PedidoGetPayload<{ include: { movimientos: true } }> }) {
  const collected = netCollected(o.movimientos);
  const active = o.estado === 'CONFIRMADO' || o.estado === 'ENTREGADO';
  return <div className="mt-5 grid items-start gap-5 lg:grid-cols-2">
    <section id="contabilidad" className="card min-w-0 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Cobros y saldo</h2><Link className="text-sm underline" href="/admin/contabilidad">Ver contabilidad</Link></div>
      <dl className="my-5 space-y-2 text-sm"><div className="flex flex-wrap justify-between gap-2"><dt>Cobrado neto</dt><dd>{money(Number(collected))}</dd></div><div className="flex flex-wrap justify-between gap-2"><dt>{o.estado === 'CANCELADO' ? 'Por devolver' : 'Por cobrar'}</dt><dd className="font-semibold">{money(Number(o.estado === 'CANCELADO' ? collected : o.total.minus(collected)))}</dd></div></dl>
      {o.estado === 'CANCELADO' && collected.gt(0) && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">La cancelación devolvió el stock, pero falta devolver el dinero al cliente. Registra la devolución cuando la hayas realizado.</p>}
      {o.estado === 'PENDIENTE' && <p className="mb-4 text-sm text-stone-500">Confirma el pedido para habilitar cobros.</p>}
      {((active && collected.lt(o.total)) || collected.gt(0)) && <MovementForm pedidoId={o.id} allowCollection={active && collected.lt(o.total)} allowRefund={collected.gt(0)} initialKey={randomUUID()} />}
      <h3 className="mt-6 text-sm font-semibold">Historial de movimientos</h3>
      <ul className="mt-3 divide-y divide-stone-100">{o.movimientos.map(m => <li key={m.id} className="space-y-1 py-3 text-sm"><p className="break-words">{movementLabels[m.tipo]} · {money(Number(m.monto))} · {m.concepto}</p><p className="break-words text-xs text-stone-500">{m.medio} · {m.registradoPor} · {m.createdAt.toLocaleString('es-PE', { timeZone: 'America/Lima' })}{m.referencia ? ` · ${m.referencia}` : ''}</p></li>)}</ul>
      {!o.movimientos.length && <p className="mt-3 text-sm text-stone-500">Sin cobros ni devoluciones registrados.</p>}
    </section>
    <section id="logistica" className="card min-w-0 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Despacho</h2><Link className="text-sm underline" href="/admin/logistica">Ver logística</Link></div>
      <p className="my-4 text-sm text-stone-500">{o.estado === 'PENDIENTE' ? 'Pendiente de confirmar el pedido' : dispatchLabels[o.despacho]}</p>
      {o.estado === 'CONFIRMADO' ? <ManagementForm action={saveDispatch} label="Guardar despacho">
        <input type="hidden" name="id" value={o.id} /><input type="hidden" name="previous" value={o.despacho} />
        <label className="block text-sm">Dirección de entrega<textarea className="field mt-1" name="direccion" maxLength={300} defaultValue={o.direccion} /></label>
        <label className="block text-sm">Transportista o responsable<input className="field mt-1" name="transportista" maxLength={100} defaultValue={o.transportista} /></label>
        <label className="block text-sm">Número de guía / seguimiento<input className="field mt-1" name="seguimiento" maxLength={100} defaultValue={o.seguimiento} /></label>
        <label className="block text-sm">Estado del despacho<select className="field mt-1" name="despacho" defaultValue={o.despacho}><option value="PREPARACION">En preparación / retornado al almacén</option><option value="EN_CAMINO">En camino</option></select></label>
        <p className="text-xs leading-5 text-stone-500">Usa “Marcar como entregado” en el pedido al completar la entrega. Para cancelar un envío en camino, primero verifica su retorno al almacén y vuelve a preparación.</p>
      </ManagementForm> : <p className="whitespace-pre-wrap break-words text-sm">{[o.direccion, o.transportista, o.seguimiento].filter(Boolean).join('\n') || 'Sin datos de despacho.'}</p>}
      {o.enviadoAt && <p className="mt-4 text-xs text-stone-500">Despachado: {o.enviadoAt.toLocaleString('es-PE', { timeZone: 'America/Lima' })}</p>}
      {o.entregadoAt && <p className="mt-2 text-xs text-stone-500">Entregado: {o.entregadoAt.toLocaleString('es-PE', { timeZone: 'America/Lima' })}</p>}
    </section>
  </div>;
}
