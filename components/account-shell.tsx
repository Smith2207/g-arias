import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Layers3 } from 'lucide-react';

export function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page py-7 md:py-12">
      <Link href="/#catalogo" className="mb-6 inline-flex min-h-11 items-center gap-2 text-xs text-stone-600 transition hover:text-ink"><ArrowLeft size={15} /> Volver a la colección</Link>
      <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-[0_20px_80px_-45px_rgba(34,35,31,0.3)] lg:grid lg:grid-cols-2">
        <div className="relative hidden min-h-[640px] flex-col justify-between overflow-hidden bg-[#d6bf9b] p-10 lg:flex">
          <Image src="/images/editorial-hats.webp" alt="" fill sizes="50vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#242219]/90 via-[#242219]/10 to-[#242219]/25" />
          <span className="relative w-fit rounded-full border border-white/50 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white">Hecho para tu próximo paso</span>
          <div className="relative text-white">
            <p className="mb-5 text-xs uppercase tracking-[0.2em] text-white/80">Tu negocio, tu estilo</p>
            <h2 className="max-w-sm text-5xl leading-[1.08] tracking-tight">Las buenas ideas<br />empiezan <span className="font-serif italic text-[#e8d5b4]">por arriba.</span></h2>
            <div className="mt-8 flex items-center justify-between border-t border-white/30 pt-6 text-xs"><span className="flex items-center gap-2"><Layers3 size={17} /> Desde media docena</span><ArrowUpRight size={24} /></div>
          </div>
        </div>
        <div className="flex items-center px-6 py-9 sm:px-12 sm:py-12 lg:px-14"><div className="mx-auto w-full max-w-md">{children}</div></div>
      </div>
    </div>
  );
}
