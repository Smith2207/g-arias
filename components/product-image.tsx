import Image from 'next/image';
import { HatGlasses } from 'lucide-react';

export function ProductImage({ url, name, priority = false }: {
  url?: string; name: string; priority?: boolean;
}) {
  return (
    <div className="product-photo">
      {url ? (
        <Image src={url} alt={name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 45vw, 25vw" className="object-contain p-4 md:p-6" priority={priority} />
      ) : (
        <div className="flex flex-col items-center gap-4 text-stone-400">
          <HatGlasses size={56} strokeWidth={0.9} aria-hidden="true" />
          <span className="text-[10px] uppercase tracking-[0.15em]">Arias · Colección</span>
        </div>
      )}
    </div>
  );
}
