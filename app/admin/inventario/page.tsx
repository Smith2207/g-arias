import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { ManagementForm } from '@/components/management-form';
import { saveStock } from '../gestion-actions';
export default async function Inventory({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; bajo?: string }>;
}) {
  await requireAdmin();
  const { q = '', bajo } = await searchParams;
  const products = await db.producto.findMany({
    where: { nombre: { contains: q.slice(0, 100), mode: 'insensitive' } },
    include: { variantes: { where: { activo: true } } },
    orderBy: { nombre: 'asc' },
  });
  const rows = products
    .flatMap<{
      id: string;
      kind: string;
      nombre: string;
      stock: number | null;
      stockMinimo: number;
    }>((p) => (p.variantes.length ? p.variantes.map((v) => ({ ...v, kind: 'variante', nombre: `${p.nombre} · ${[v.color, v.talla].filter(Boolean).join(' / ')}` })) : [{ ...p, kind: 'producto' }]))
    .filter(
      (r) => bajo !== '1' || (r.stock !== null && r.stock <= r.stockMinimo),
    );
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Inventario</h1>
      <p className="mt-3 text-sm leading-6 text-stone-500">
        Stock en unidades. Se descuenta al confirmar un pedido. Deja el stock
        vacío para trabajar sin control de existencias.
      </p>
      <form className="my-6 flex flex-wrap gap-3">
        <input
          aria-label="Buscar producto"
          name="q"
          defaultValue={q}
          placeholder="Buscar producto"
          className="field max-w-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="bajo"
            value="1"
            defaultChecked={bajo === '1'}
          />
          Solo stock bajo
        </label>
        <button className="btn-secondary">Filtrar</button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((r) => (
          <section key={r.id} className="card min-w-0 p-5">
            <h2 className="mb-2 break-words font-semibold">{r.nombre}</h2>
            <p className="mb-5 text-xs text-stone-500">
              {r.stock === null
                ? 'Sin control de stock'
                : r.stock <= r.stockMinimo
                  ? 'Stock bajo · Reponer pronto'
                  : `${r.stock} unidades disponibles`}
            </p>
            <ManagementForm
              key={`${r.id}:${r.stock}:${r.stockMinimo}`}
              action={saveStock}
              label="Actualizar stock"
            >
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="kind" value={r.kind} />
              <input type="hidden" name="previous" value={r.stock ?? ''} />
              <input type="hidden" name="previousMin" value={r.stockMinimo} />
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Unidades
                  <input
                    className="field mt-2"
                    name="stock"
                    type="number"
                    min="0"
                    max="10000000"
                    defaultValue={r.stock ?? ''}
                    placeholder="Sin control"
                  />
                </label>
                <label className="text-sm">
                  Avisar desde
                  <input
                    className="field mt-2"
                    name="stockMinimo"
                    type="number"
                    min="0"
                    max="10000000"
                    required
                    defaultValue={r.stockMinimo}
                  />
                </label>
              </div>
            </ManagementForm>
          </section>
        ))}
      </div>
      {!rows.length && (
        <p className="card p-8 text-sm text-stone-500">
          No hay productos que coincidan. Crea tus productos para empezar a
          gestionar el stock.
        </p>
      )}
    </>
  );
}
