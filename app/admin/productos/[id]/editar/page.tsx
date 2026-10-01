import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { ProductForm } from '@/components/product-form';
export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const p = await db.producto.findUnique({ where: { id }, include: { variantes: {where:{activo:true}}, imagenes: { orderBy: { orden: 'asc' } } } });
  if (!p) notFound();
  return <ProductForm product={{ ...p, precioMediaDocena: p.precioMediaDocena.toString(), precioDocena: p.precioDocena.toString(), precioCaja: p.precioCaja.toString() }}/>;
}
