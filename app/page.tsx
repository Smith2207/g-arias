import Image from 'next/image';
import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, HatGlasses, Layers3, MessageCircle, PackageCheck, Search, ShoppingBag } from 'lucide-react';
import { db } from '@/lib/db';
import { databaseConfigStatus } from '@/lib/database-config';
import { money } from '@/lib/commerce';
import { ProductImage } from '@/components/product-image';
import { Reveal } from '@/components/reveal';

export const dynamic = 'force-dynamic';
type CatalogParams = { categoria?: string; q?: string; orden?: string };
type Product = Prisma.ProductoGetPayload<{ include: { imagenes: true } }>;

export default async function Catalog({ searchParams }: { searchParams: Promise<CatalogParams> }) {
  const params = await searchParams;
  const categoria = typeof params.categoria === 'string' ? params.categoria.slice(0, 80) : '';
  const query = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const order = params.orden === 'nombre' ? 'nombre' : 'recientes';
  const number = process.env.WHATSAPP_NUMBER ?? '';
  const contact = /^[1-9]\d{7,14}$/.test(number)
    ? `https://wa.me/${number}?text=${encodeURIComponent('Hola, quisiera información sobre sus sombreros y gorras al por mayor.')}`
    : null;
  let products: Product[] = [];
  let categories: { categoria: string }[] = [];
  const databaseStatus = databaseConfigStatus(process.env.DATABASE_URL);
  let unavailable = databaseStatus === 'example' || databaseStatus === 'invalid';

  if (databaseStatus === 'ready') {
    try {
      [products, categories] = await Promise.all([
        db.producto.findMany({
          where: {
            activo: true,
            ...(categoria ? { categoria } : {}),
            ...(query ? { OR: [
              { nombre: { contains: query, mode: 'insensitive' as const } },
              { descripcion: { contains: query, mode: 'insensitive' as const } },
            ] } : {}),
          },
          include: { imagenes: { orderBy: { orden: 'asc' }, take: 1 } },
          orderBy: order === 'nombre' ? { nombre: 'asc' } : { createdAt: 'desc' },
        }),
        db.producto.findMany({ where: { activo: true }, distinct: ['categoria'], select: { categoria: true }, orderBy: { categoria: 'asc' } }),
      ]);
    } catch {
      console.warn('[Catálogo] Consulta no disponible. Ejecuta npm run db:check para diagnosticar la conexión y las tablas.');
      unavailable = true;
    }
  }

  function categoryHref(value: string) {
    const next = new URLSearchParams();
    if (value) next.set('categoria', value);
    if (query) next.set('q', query);
    if (order !== 'recientes') next.set('orden', order);
    return `/${next.size ? `?${next}` : ''}#catalogo`;
  }

  return (
    <>
      <section className="container-page grid gap-8 pb-8 pt-7 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:pb-12 lg:pt-10">
        <Reveal className="flex flex-col justify-center py-4 lg:py-8">
          <div className="eyebrow mb-7 flex items-center gap-3"><span className="h-px w-7 bg-accent" />Sombreros & gorras · Al por mayor</div>
          <h1 className="hero-title">El estilo<br />empieza<br /><em>por arriba.</em></h1>
          <p className="mt-7 max-w-sm text-sm leading-7 text-stone-600 md:text-base">Explora nuestros modelos y precios al por mayor. Agrega tus favoritos al carrito y envíanos tu pedido por WhatsApp.</p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <a href="#catalogo" className="btn">Descubrir la colección <ArrowUpRight size={18} strokeWidth={1.5} /></a>
            <a href="#como-comprar" className="flex min-h-11 items-center gap-2 text-xs font-medium">Así de fácil <ArrowDown size={15} /></a>
          </div>
          <p className="mt-9 flex items-center gap-2 text-[11px] text-stone-500"><Check size={14} className="text-accent" />Desde media docena. Tú eliges cuánto crecer.</p>
        </Reveal>
        <Reveal delay={0.1} className="hero-photo">
          <Image src="/images/editorial-hats.webp" alt="Composición editorial de un sombrero de paja, una gorra y un bucket hat en tonos naturales" fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover object-[46%_center]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          <span className="absolute left-5 top-5 rounded-full border border-white/60 bg-white/30 px-4 py-2 text-[10px] uppercase tracking-[0.16em] backdrop-blur-md">La esencia de Arias</span>
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white">
            <p className="text-3xl font-medium leading-tight tracking-[-0.04em]">Distintos estilos.<br /><span className="font-serif italic">Una misma actitud.</span></p>
            <a href="#catalogo" aria-label="Explorar la colección" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/60 transition hover:bg-white hover:text-ink"><ArrowUpRight size={22} /></a>
          </div>
        </Reveal>
      </section>

      <div className="border-y border-ink/10 bg-[#f1efe8]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-ink/10 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:px-10">
          {[
            { Icon: Layers3, title: 'A la medida de tu negocio', text: '½ docena, docena o caja' },
            { Icon: MessageCircle, title: 'Hablemos por WhatsApp', text: 'Atención de persona a persona' },
            { Icon: PackageCheck, title: 'Tu pedido, paso a paso', text: 'Coordinamos disponibilidad y envío' },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="flex items-center justify-start gap-4 py-5 sm:justify-center sm:px-4 sm:py-7">
              <Icon size={24} strokeWidth={1.25} className="shrink-0 text-accent" aria-hidden="true" />
              <div><p className="text-xs font-semibold">{title}</p><p className="mt-1 text-[11px] text-stone-500">{text}</p></div>
            </div>
          ))}
        </div>
      </div>

      <section id="catalogo" className="container-page py-16 md:py-20">
        <Reveal className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="eyebrow mb-4">Buenos estilos, grandes posibilidades</p><h2 className="section-title">Encuentra tu próximo favorito<span className="text-accent">.</span></h2></div>
          <p className="pb-1 text-xs text-stone-500">{products.length} {products.length === 1 ? 'modelo disponible' : 'modelos disponibles'}</p>
        </Reveal>

        <div className="mb-8 mt-9 flex flex-col gap-5 border-b border-ink/10 pb-6 xl:flex-row xl:items-center xl:justify-between">
          <nav aria-label="Categorías" className="flex max-w-full gap-2 overflow-x-auto pb-1">
            <Link href={categoryHref('')} className="category-pill" aria-current={!categoria ? 'page' : undefined}><HatGlasses size={15} />Todos</Link>
            {categories.map(c => <Link key={c.categoria} href={categoryHref(c.categoria)} className="category-pill" aria-current={categoria === c.categoria ? 'page' : undefined}>{c.categoria}</Link>)}
          </nav>
          <form action="/#catalogo" className="flex flex-wrap gap-2" role="search">
            {categoria && <input type="hidden" name="categoria" value={categoria} />}
            <label className="relative min-w-0 flex-1 sm:flex-none">
              <span className="sr-only">Buscar productos</span>
              <Search size={16} className="absolute left-3 top-3.5 text-stone-400" aria-hidden="true" />
              <input name="q" type="search" defaultValue={query} maxLength={100} placeholder="¿Qué estás buscando?" className="h-11 w-full rounded-full border border-ink/15 bg-transparent pl-9 pr-3 text-xs sm:w-52" />
            </label>
            <label>
              <span className="sr-only">Ordenar productos</span>
              <select name="orden" defaultValue={order} className="h-11 max-w-36 rounded-full border border-ink/15 bg-transparent px-3 text-xs"><option value="recientes">Más recientes</option><option value="nombre">Nombre: A–Z</option></select>
            </label>
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white" aria-label="Aplicar búsqueda y orden"><ArrowRight size={17} /></button>
          </form>
        </div>
        {(query || categoria) && <p className="mb-6 text-sm text-stone-500">{query ? `Resultados para “${query}”` : categoria} <Link href="/#catalogo" className="ml-3 text-ink underline underline-offset-4">Limpiar filtros</Link></p>}

        {products.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-7 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p, index) => (
              <Reveal key={p.id} delay={Math.min(index % 4, 3) * 0.06}>
                <Link href={`/producto/${p.id}`} className="product-card group">
                  <div className="relative"><ProductImage url={p.imagenes[0]?.url} name={p.nombre} /><span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1.5 text-[9px] uppercase tracking-wider backdrop-blur-sm">Venta mayorista</span></div>
                  <div className="mt-4"><p className="eyebrow text-[9px]">{p.categoria}</p><h3 className="mt-2 text-sm font-medium leading-snug md:text-base">{p.nombre}</h3></div>
                  <p className="mt-4 text-[10px] text-stone-500">Precios por paquete completo</p>
                  <dl className="mt-2 space-y-2 text-xs">
                    {[
                      { label: '½ docena · 6 un.', price: p.precioMediaDocena },
                      { label: 'Docena · 12 un.', price: p.precioDocena },
                      { label: `Caja · ${p.unidadesPorCaja} un.`, price: p.precioCaja },
                    ].map(({ label, price }) => (
                      <div key={label} className="flex flex-wrap justify-between gap-x-2 gap-y-1">
                        <dt className="text-stone-600">{label}</dt>
                        <dd className="font-semibold tabular-nums">{money(Number(price))}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-ink/10 pt-3">
                    <span className="text-xs font-medium">Elegir y agregar</span>
                    <span className="product-arrow"><ArrowRight size={18} strokeWidth={1.5} /></span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="rounded-2xl border border-dashed border-ink/20 bg-[#f4f2ed] px-6 py-14 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8e3d8]"><HatGlasses size={30} strokeWidth={1} /></div>
            <h3 className="text-2xl font-medium tracking-tight">{unavailable ? 'La colección estará de vuelta en un momento' : query || categoria ? 'Probemos con otro estilo' : 'Estamos preparando algo especial'}</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-stone-500">{unavailable ? 'No pudimos cargar los modelos. Puedes volver a intentarlo o escribirnos para consultar.' : query || categoria ? 'No encontramos modelos con esos filtros. Explora la colección completa.' : 'Muy pronto encontrarás aquí nuestros modelos. Conversemos y te ayudamos a preparar tu próximo pedido.'}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {(query || categoria || unavailable) && <Link href="/#catalogo" className="btn-secondary">{unavailable ? 'Volver a intentar' : 'Ver toda la colección'} <ArrowRight size={16} /></Link>}
              {contact && <a href={contact} className="btn">Consultar por WhatsApp <MessageCircle size={17} /></a>}
            </div>
          </Reveal>
        )}
      </section>

      <section id="como-comprar" className="border-t border-ink/10 bg-[#f1efe8]">
        <div className="container-page py-16 md:py-20">
          <Reveal className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><p className="eyebrow mb-4">Menos vueltas, más oportunidades</p><h2 className="section-title">De nuestra colección<br />a tu negocio.</h2></div>
            <p className="max-w-xs text-sm leading-7 text-stone-500">Sin complicaciones. Arma tu pedido y coordinamos los detalles contigo.</p>
          </Reveal>
          <div className="grid gap-8 md:grid-cols-3 md:gap-12">
            {[
              { Icon: HatGlasses, title: 'Encuentra tu estilo', text: 'Explora la colección y elige los modelos que van con tus clientes.' },
              { Icon: ShoppingBag, title: 'Arma tu pedido', text: 'Selecciona media docena, docena o caja y agrega tus productos al carrito. Allí verás el total de tu selección.' },
              { Icon: MessageCircle, title: 'Envía por WhatsApp', text: 'Desde el carrito, abre tu pedido en WhatsApp y pulsa enviar. Coordinamos contigo la disponibilidad, el pago y el envío.' },
            ].map(({ Icon, title, text }, index) => (
              <Reveal key={title} delay={index * 0.08} className="border-t border-ink/20 pt-6">
                <div className="mb-7 flex items-center justify-between"><span className="font-serif text-4xl italic text-accent">0{index + 1}</span><Icon size={25} strokeWidth={1.25} /></div>
                <h3 className="text-xl font-medium tracking-tight">{title}</h3><p className="mt-3 max-w-xs text-sm leading-7 text-stone-500">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      {contact && <section className="container-page flex flex-col items-start justify-between gap-6 py-12 sm:flex-row sm:items-center"><div><p className="eyebrow mb-2">Estamos para ayudarte</p><h2 className="text-2xl tracking-tight">¿Armamos tu próximo pedido?</h2></div><a href={contact} className="btn-secondary">Hablemos por WhatsApp <ArrowUpRight size={17} /></a></section>}
    </>
  );
}
