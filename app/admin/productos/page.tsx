import Link from 'next/link';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { ProductControls } from '@/components/product-controls';
export default async function ProductsPage() {
  await requireAdmin();
  const products = await db.producto.findMany({ orderBy: { createdAt: 'desc' } });
  return <><div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow">Catálogo</p><h1 className="mt-2 font-serif text-4xl">Tus productos</h1></div><Link href="/admin/productos/nuevo" className="btn">+ Nuevo producto</Link></div><div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-stone-200 bg-stone-50"><tr>{['Producto','Categoría','Estado','Acciones'].map(t => <th key={t} className="p-4">{t}</th>)}</tr></thead><tbody>{products.map(p => <tr key={p.id} className="border-b border-stone-100"><td className="p-4 font-semibold">{p.nombre}</td><td className="p-4">{p.categoria}</td><td className="p-4"><span className={`rounded-full px-3 py-1 text-xs ${p.activo ? 'bg-green-50 text-green-800' : 'bg-stone-100 text-stone-500'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td><td className="min-w-80 p-4"><ProductControls id={p.id} active={p.activo}/></td></tr>)}</tbody></table>{!products.length && <p className="p-10 text-center text-stone-500">Aún no tienes productos. Crea el primero para publicarlo en el catálogo.</p>}</div></>;
}
