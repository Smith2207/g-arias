'use client';
import { useActionState, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { upload } from '@vercel/blob/client';
import { saveProduct } from '@/app/admin/actions';
type EditableProduct = { id: string; nombre: string; descripcion: string; categoria: string; precioMediaDocena: string; precioDocena: string; precioCaja: string; unidadesPorCaja: number; activo: boolean; imagenes: { url: string }[] };
export function ProductForm({ product }: { product?: EditableProduct }) {
  const [state, action, pending] = useActionState(saveProduct.bind(null, product?.id ?? null), {});
  const [images, setImages] = useState<string[]>(product?.imagenes.map(i => i.url) ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const uploadingRef = useRef(false);
  async function uploadFiles(files: FileList | null) {
    if (!files || uploadingRef.current) return;
    const selected = Array.from(files);
    if (images.length + selected.length > 12) { setUploadError('Máximo 12 imágenes por producto.'); return; }
    const extensions: Record<string,string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };
    if (selected.some(f => !extensions[f.type] || f.size > 5 * 1024 * 1024)) { setUploadError('Usa JPG, PNG, WebP o AVIF de hasta 5 MB.'); return; }
    uploadingRef.current = true; setUploading(true); setUploadError('');
    try {
      for (const file of selected) {
        const blob = await upload(`productos/${crypto.randomUUID()}.${extensions[file.type]}`, file, { access: 'public', handleUploadUrl: '/api/upload' });
        setImages(previous => [...previous, blob.url]);
      }
    } catch { setUploadError('Una imagen no pudo subirse. Las anteriores se conservaron; reintenta la que falta.'); }
    finally { uploadingRef.current = false; setUploading(false); }
  }
  return <form action={action} className="max-w-4xl space-y-7" onSubmit={e => { if (uploadingRef.current) e.preventDefault(); }}><fieldset disabled={pending} className="card grid gap-5 p-6 md:grid-cols-2"><legend className="px-2 font-semibold">Información del producto</legend><label className="text-sm font-semibold md:col-span-2">Nombre<input className="field mt-2" name="nombre" required minLength={2} maxLength={150} defaultValue={product?.nombre}/></label><label className="text-sm font-semibold">Categoría<input className="field mt-2" name="categoria" required minLength={2} maxLength={80} placeholder="Ej. Sombreros" defaultValue={product?.categoria}/></label><label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5 accent-ink" name="activo" defaultChecked={product?.activo ?? true}/>Visible en el catálogo</label><label className="text-sm font-semibold md:col-span-2">Descripción<textarea className="field mt-2" name="descripcion" rows={5} required maxLength={5000} defaultValue={product?.descripcion}/></label></fieldset><fieldset disabled={pending} className="card grid gap-5 p-6 sm:grid-cols-2"><legend className="px-2 font-semibold">Precios por presentación (S/)</legend>{(['precioMediaDocena','precioDocena','precioCaja'] as const).map((field,i) => <label key={field} className="text-sm font-semibold">{['Media docena (6 unidades)','Docena (12 unidades)','Caja completa'][i]}<input className="field mt-2" name={field} type="number" required min="0.01" max="99999999.99" step="0.01" defaultValue={product?.[field]}/></label>)}<label className="text-sm font-semibold">Unidades por caja<input className="field mt-2" name="unidadesPorCaja" type="number" min={12} max={12000} step={12} required defaultValue={product?.unidadesPorCaja ?? 144}/><span className="mt-2 block text-xs font-normal text-stone-500">Múltiplo de 12. Ej. 144 unidades = 12 docenas.</span></label></fieldset><section className="card p-6"><h2 className="font-semibold">Imágenes</h2><p className="my-2 text-sm text-stone-500">La primera imagen será la portada. Hasta 12 imágenes, 5 MB cada una.</p><label className="my-4 block text-sm">Agregar imágenes<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={uploading || pending} onChange={e => { void uploadFiles(e.target.files); e.target.value = ''; }} className="field mt-2"/></label><input type="hidden" name="imagenes" value={JSON.stringify(images)}/>{uploading && <p role="status" className="my-3 text-sm">Subiendo imágenes… Espera antes de guardar.</p>}{uploadError && <p role="alert" className="my-3 text-sm text-red-700">{uploadError}</p>}<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{images.map((url,i) => <div key={url} className="rounded-lg border border-stone-200 p-2"><div className="relative aspect-square overflow-hidden rounded-md bg-stone-50"><Image src={url} alt={`Imagen ${i+1} del producto`} fill sizes="180px" className="object-contain"/></div><div className="mt-2 flex flex-wrap gap-2 text-xs"><button disabled={pending || uploading || i === 0} type="button" onClick={() => setImages(prev => [url,...prev.filter(x => x !== url)])} className="min-h-10 rounded border px-2 disabled:opacity-40">{i === 0 ? 'Portada' : 'Usar de portada'}</button><button disabled={pending || uploading} type="button" onClick={() => setImages(prev => prev.filter(x => x !== url))} className="min-h-10 px-2 text-red-700">Quitar</button></div></div>)}</div></section>{state.error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{state.error}</p>}<div className="flex gap-4"><button disabled={pending || uploading} className="btn">{pending ? 'Guardando…' : 'Guardar producto'}</button><Link href="/admin/productos" className="btn-secondary">Volver</Link></div></form>;
}
