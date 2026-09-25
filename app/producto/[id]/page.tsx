import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { databaseConfigStatus } from '@/lib/database-config';
import { Gallery } from '@/components/gallery';
import { Purchase } from '@/components/purchase';
import { money, presentationLabel, presentations } from '@/lib/commerce';
export const dynamic = 'force-dynamic';
export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (databaseConfigStatus(process.env.DATABASE_URL) !== 'ready') notFound();
  const p = await db.producto.findFirst({ where: { id, activo: true }, include: { imagenes: { orderBy: { orden: 'asc' } } } });
  if (!p) notFound();
  const prices = { mediaDocena: Number(p.precioMediaDocena), docena: Number(p.precioDocena), caja: Number(p.precioCaja) };
  return <div className="container-page"><Link href="/" className="text-sm text-stone-500">← Volver al catálogo</Link><div className="mt-8 grid gap-10 md:grid-cols-2"><Gallery images={p.imagenes} name={p.nombre}/><div><p className="eyebrow">{p.categoria}</p><h1 className="mt-3 font-serif text-4xl md:text-5xl">{p.nombre}</h1><p className="my-6 whitespace-pre-line leading-7 text-stone-600">{p.descripcion}</p><h2 className="mb-3 font-semibold">Precios al por mayor</h2><table className="w-full text-sm"><thead className="text-left text-stone-500"><tr><th className="py-3 font-normal">Presentación</th><th className="text-right font-normal">Precio por paquete</th></tr></thead><tbody>{presentations.map(type => <tr className="border-t border-stone-200" key={type}><td className="py-4">{presentationLabel(type,p.unidadesPorCaja)}</td><td className="text-right font-semibold">{money(prices[type])}</td></tr>)}</tbody></table><Purchase product={{ id: p.id, nombre: p.nombre, imagen: p.imagenes[0]?.url ?? '', unidadesPorCaja: p.unidadesPorCaja, prices }}/><p className="mt-4 text-xs leading-5 text-stone-500">Pedido sujeto a confirmación de disponibilidad. Coordinaremos el pago y el envío por WhatsApp.</p></div></div></div>;
}
