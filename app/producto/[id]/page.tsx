import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { databaseConfigStatus } from '@/lib/database-config';
import { Gallery } from '@/components/gallery';
import { Purchase } from '@/components/purchase';
import { ArrowLeft, MessageCircle } from 'lucide-react';
export const dynamic = 'force-dynamic';
export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (databaseConfigStatus(process.env.DATABASE_URL) !== 'ready') notFound();
  const p = await db.producto.findFirst({ where: { id, activo: true }, include: { imagenes: { orderBy: { orden: 'asc' } } } });
  if (!p) notFound();
  const prices = { mediaDocena: Number(p.precioMediaDocena), docena: Number(p.precioDocena), caja: Number(p.precioCaja) };
  return <div className="container-page pt-7"><nav aria-label="Ruta de navegación" className="flex flex-wrap items-center gap-3 text-xs text-stone-500"><Link href="/#catalogo" className="inline-flex min-h-11 items-center gap-2 hover:text-ink"><ArrowLeft size={15} />Colección</Link><span aria-hidden="true">/</span><span>{p.categoria}</span></nav><div className="mt-6 grid items-start gap-6 md:grid-cols-2 lg:gap-12"><div className="lg:sticky lg:top-32"><Gallery images={p.imagenes} name={p.nombre} /></div><div><p className="eyebrow text-accent">{p.categoria} · Venta mayorista</p><h1 className="mt-4 break-words text-3xl font-medium leading-tight tracking-tight lg:text-4xl">{p.nombre}</h1><p className="mt-4 text-sm leading-7 text-stone-500">Precios por paquete completo.</p><Purchase product={{ id: p.id, nombre: p.nombre, imagen: p.imagenes[0]?.url ?? '', unidadesPorCaja: p.unidadesPorCaja, prices }} /><p className="mt-5 flex gap-2 text-xs leading-6 text-stone-500"><MessageCircle size={17} className="mt-1 shrink-0 text-accent" />Confirmaremos disponibilidad, pago y envío por WhatsApp.</p><details className="mt-8 border-t border-ink/10 pt-5"><summary className="cursor-pointer py-2 text-sm font-semibold">Detalles del modelo</summary><p className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-600">{p.descripcion}</p></details></div></div></div>;
}
