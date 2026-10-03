import Link from 'next/link';
import { OrderOperations } from '@/components/order-operations';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { orderLabels, transitions } from '@/lib/orders';
import { money, presentationLabel, Presentation } from '@/lib/commerce';
import { ManagementForm } from '@/components/management-form';
import { changeOrder } from '../../gestion-actions';
export default async function Order({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const o = await db.pedido.findUnique({
    where: { id },
    include: { lineas: true, movimientos: { orderBy: { createdAt: 'desc' } } },
  });
  if (!o) notFound();
  return (
    <>
      <Link className="text-sm underline" href="/admin/pedidos">
        ← Pedidos
      </Link>
      <h1 className="mt-5 break-words text-3xl font-semibold">{o.codigo}</h1>
      <p className="mt-3 text-sm text-stone-500">
        {orderLabels[o.estado]} ·{' '}
        {o.createdAt.toLocaleString('es-PE', { timeZone: 'America/Lima' })}
      </p>
      <div className="mt-7 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="card min-w-0 p-5">
          <h2 className="font-semibold">Productos</h2>
          <div className="divide-y divide-stone-100">
            {o.lineas.map((l) => (
              <div
                key={l.id}
                className="flex flex-wrap justify-between gap-3 py-5"
              >
                <div>
                  <p className="break-words font-medium">{l.nombre}</p>
                  <p className="text-sm text-stone-500">{l.varianteNombre}</p>
                  <p className="mt-2 text-xs text-stone-500">
                    {presentationLabel(
                      l.presentacion as Presentation,
                      l.unidades / l.cantidad,
                    )}{' '}
                    × {l.cantidad}
                  </p>
                </div>
                <p>{money(Number(l.precio) * l.cantidad)}</p>
              </div>
            ))}
          </div>
          <p className="border-t pt-5 font-semibold">
            Total de productos: {money(Number(o.total))}
          </p>
          <p className="mt-2 text-xs text-stone-500">
            Envío y pago por coordinar. Este total no acredita un pago.
          </p>
        </section>
        <aside className="card min-w-0 space-y-5 p-5">
          <h2 className="font-semibold">Cliente</h2>
          <p className="break-words text-sm">
            {o.nombre}
            <br />
            {o.telefono}
          </p>
          {o.notas && (
            <p className="whitespace-pre-wrap break-words text-sm text-stone-500">
              {o.notas}
            </p>
          )}
          {transitions[o.estado].map((next) => (
            <ManagementForm
              key={next}
              action={changeOrder}
              label={
                next === 'CONFIRMADO'
                  ? 'Confirmar y descontar stock'
                  : next === 'ENTREGADO'
                    ? 'Marcar como entregado'
                    : 'Cancelar pedido'
              }
            >
              <input type="hidden" name="id" value={o.id} />
              <input type="hidden" name="estado" value={next} />
              {next === 'CANCELADO' && (
                <label className="flex gap-2 text-xs leading-5">
                  <input required type="checkbox" />
                  Confirmo la cancelación
                  {o.estado === 'CONFIRMADO'
                    ? ' y devolución del stock descontado'
                    : ''}
                  .
                </label>
              )}
            </ManagementForm>
          ))}
        </aside>
      </div>
      <OrderOperations order={o} />
    </>
  );
}
