import Link from 'next/link';
import { EstadoPedido } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { orderLabels } from '@/lib/orders';
import { money } from '@/lib/commerce';
export default async function Orders({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string; pagina?: string }>;
}) {
  await requireAdmin();
  const s = await searchParams;
  const q = (s.q ?? '').slice(0, 100);
  const estado = Object.values(EstadoPedido).includes(s.estado as EstadoPedido)
    ? (s.estado as EstadoPedido)
    : undefined;
  const page = Math.max(1, Math.min(10000, Number(s.pagina) || 1));
  const where = {
    estado,
    OR: [
      { codigo: { contains: q, mode: 'insensitive' as const } },
      { nombre: { contains: q, mode: 'insensitive' as const } },
      { telefono: { contains: q } },
    ],
  };
  const [orders, count] = await Promise.all([
    db.pedido.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 30,
      skip: (Math.floor(page) - 1) * 30,
    }),
    db.pedido.count({ where }),
  ]);
  const url = (p: number) =>
    `?${new URLSearchParams({ q, estado: estado ?? '', pagina: String(p) })}`;
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Pedidos</h1>
      <p className="mt-3 text-sm text-stone-500">
        Revisa, confirma y prepara cada pedido. El pago se coordina por
        WhatsApp.
      </p>
      <form className="my-6 flex flex-wrap gap-3">
        <input
          className="field max-w-sm"
          name="q"
          aria-label="Buscar pedido"
          placeholder="Código, cliente o teléfono"
          defaultValue={q}
        />
        <select
          className="field max-w-xs"
          aria-label="Estado"
          name="estado"
          defaultValue={estado ?? ''}
        >
          <option value="">Todos los estados</option>
          {Object.entries(orderLabels).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <button className="btn-secondary">Filtrar</button>
      </form>
      <div className="space-y-3">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/admin/pedidos/${o.id}`}
            className="card flex flex-wrap items-center justify-between gap-4 p-5 hover:border-accent"
          >
            <div className="min-w-0">
              <p className="font-semibold">{o.codigo}</p>
              <p className="mt-1 break-words text-sm text-stone-500">
                {o.nombre} ·{' '}
                {o.createdAt.toLocaleDateString('es-PE', {
                  timeZone: 'America/Lima',
                })}
              </p>
            </div>
            <div className="text-sm">
              <span className="rounded-full bg-stone-100 px-3 py-1">
                {orderLabels[o.estado]}
              </span>
              <p className="mt-3 font-semibold">{money(Number(o.total))}</p>
            </div>
          </Link>
        ))}
      </div>
      {!count && (
        <p className="card p-8 text-sm text-stone-500">
          Todavía no hay pedidos que coincidan.
        </p>
      )}
      <nav aria-label="Páginas de pedidos" className="mt-6 flex gap-4 text-sm">
        {page > 1 && (
          <Link className="btn-secondary" href={url(page - 1)}>
            Anterior
          </Link>
        )}
        {page * 30 < count && (
          <Link className="btn-secondary" href={url(page + 1)}>
            Siguiente
          </Link>
        )}
      </nav>
    </>
  );
}
