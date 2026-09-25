'use client';
import { useState } from 'react';
import Image from 'next/image';
import { ProductImage } from './product-image';
export function Gallery({ images, name }: { images: { url: string; id: string }[]; name: string }) {
  const [index, setIndex] = useState(0);
  return <div><ProductImage url={images[index]?.url} name={name} priority/>{images.length > 1 && <div className="mt-3 flex flex-wrap gap-3">{images.map((image, i) => <button key={image.id} type="button" aria-label={`Ver imagen ${i + 1} de ${name}`} aria-pressed={index === i} onClick={() => setIndex(i)} className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 ${index === i ? 'border-ink' : 'border-transparent'}`}><Image src={image.url} alt="" fill sizes="80px" className="object-cover"/></button>)}</div>}</div>;
}
