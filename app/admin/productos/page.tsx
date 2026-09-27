import Image from 'next/image';
import Link from 'next/link';
import { HatGlasses, Plus, Search } from 'lucide-react';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { money } from '@/lib/commerce';
import { ProductControls } from '@/components/product-controls';
export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string; fotos?: string }> }) {
  await requireAdmin();
  const products = await db.producto.findMany({ orderBy: { createdAt: 'desc' }, include: { imagenes: { orderBy: { orden: 'asc' }, take: 1 } } });
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const status = params.estado === 'publicados' || params.estado === 'ocultos' ? params.estado : '';
  const noPhotos = params.fotos === 'sin';
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  const filtered = products.filter(p => (!query || normalize(`${p.nombre} ${p.categoria}`).includes(normalize(query))) && (!status || p.activo === (status === 'publicados')) && (!noPhotos || !p.imagenes.length));
  const active = products.filter(p => p.activo).length;
  return <>
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-medium tracking-tight">Productos</h1><p className="mt-2 text-sm text-stone-500">{active} publicados · {products.length - active} ocultos</p></div><Link href="/admin/productos/nuevo" className="btn"><Plus size={18} />Nuevo producto</Link></div>
    {products.length > 0 && <form action="/admin/productos" role="search" aria-label="Buscar en administración" className="mb-6 flex flex-wrap items-end gap-3">{noPhotos && <input type="hidden" name="fotos" value="sin" />}<label className="min-w-0 basis-full text-xs font-medium sm:basis-auto sm:flex-1">Buscar producto<div className="relative mt-2"><Search size={17} className="absolute left-4 top-4 text-stone-400" /><input type="search" name="q" maxLength={100} defaultValue={query} placeholder="Nombre o categoría" className="field pl-11" /></div></label><label className="text-xs font-medium">Estado<select name="estado" defaultValue={status} className="field mt-2"><option value="">Todos</option><option value="publicados">Publicados</option><option value="ocultos">Ocultos</option></select></label><button className="btn-secondary">Filtrar</button>{(query || status || noPhotos) && <Link href="/admin/productos" className="inline-flex min-h-12 items-center text-xs underline underline-offset-4">Limpiar filtros</Link>}</form>}
    {products.length > 0 && <p className="mb-4 text-xs text-stone-500" role="status">{filtered.length} de {products.length} productos{noPhotos ? ' · Sin fotografías' : ''}</p>}
    {products.length && !filtered.length ? <div className="card px-6 py-12 text-center"><Search size={28} className="mx-auto mb-4 text-accent" /><h2 className="text-xl font-medium">No encontramos ese producto</h2><p className="mt-3 text-sm text-stone-500">Prueba otro nombre o cambia el estado seleccionado.</p><Link href="/admin/productos" className="btn-secondary mt-6">Mostrar todos</Link></div> : products.length ? <div className="space-y-3">{filtered.map(p => <article key={p.id} className="card flex flex-col gap-5 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 items-center gap-4"><div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f1efe8]">{p.imagenes[0] ? <Image src={p.imagenes[0].url} alt={p.nombre} fill sizes="80px" className="object-contain p-2" /> : <HatGlasses size={30} strokeWidth={1} className="text-accent" />}</div><div className="min-w-0"><p className="eyebrow text-[9px]">{p.categoria}</p><h2 className="mt-1 break-words text-base font-semibold">{p.nombre}</h2><p className="mt-2 text-xs text-stone-500">½ docena <span className="font-medium text-ink">{money(Number(p.precioMediaDocena))}</span></p></div></div>
      <div className="flex flex-wrap items-center gap-4 border-t border-stone-100 pt-4 xl:shrink-0 xl:border-0 xl:pt-0"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium ${p.activo ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}><span className={`h-1.5 w-1.5 rounded-full ${p.activo ? 'bg-emerald-600' : 'bg-stone-400'}`} />{p.activo ? 'Publicado' : 'Oculto'}</span><ProductControls id={p.id} active={p.activo} /></div>
    </article>)}</div> : <div className="rounded-2xl border border-dashed border-ink/20 px-6 py-12 text-center"><HatGlasses size={32} strokeWidth={1.25} className="mx-auto mb-4 text-accent" /><h2 className="text-xl font-medium">Aún no tienes productos</h2><p className="mt-3 text-sm leading-6 text-stone-500">Usa “Nuevo producto” para agregar fotos y precios.</p></div>}

  </>;
}
