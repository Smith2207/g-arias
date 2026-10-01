'use client';
import { useActionState, useRef, useState } from 'react';
import Image from 'next/image';
import { VariantFields, VariantInput } from './variant-fields';
import Link from 'next/link';
import { ImagePlus, LoaderCircle, ArrowLeft } from 'lucide-react';
import { upload } from '@vercel/blob/client';
import { saveProduct } from '@/app/admin/actions';
type EditableProduct = {
  variantes?: VariantInput[];
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precioMediaDocena: string;
  precioDocena: string;
  precioCaja: string;
  unidadesPorCaja: number;
  activo: boolean;
  imagenes: { url: string }[];
};
export function ProductForm({ product }: { product?: EditableProduct }) {
  const [state, action, pending] = useActionState(
    saveProduct.bind(null, product?.id ?? null),
    {},
  );
  const [images, setImages] = useState<string[]>(
    product?.imagenes.map((i) => i.url) ?? [],
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const uploadingRef = useRef(false);
  async function uploadFiles(files: FileList | null) {
    if (!files || uploadingRef.current) return;
    const selected = Array.from(files);
    if (images.length + selected.length > 12) {
      setUploadError('Máximo 12 imágenes por producto.');
      return;
    }
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/avif': 'avif',
    };
    if (selected.some((f) => !extensions[f.type] || f.size > 5 * 1024 * 1024)) {
      setUploadError('Usa JPG, PNG, WebP o AVIF de hasta 5 MB.');
      return;
    }
    uploadingRef.current = true;
    setUploading(true);
    setUploadError('');
    try {
      for (const file of selected) {
        const blob = await upload(
          `productos/${crypto.randomUUID()}.${extensions[file.type]}`,
          file,
          { access: 'public', handleUploadUrl: '/api/upload' },
        );
        setImages((previous) => [...previous, blob.url]);
      }
    } catch {
      setUploadError(
        'Una imagen no pudo subirse. Las anteriores se conservaron; reintenta la que falta.',
      );
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  }
  return (
    <form
      action={action}
      className="product-editor"
      onSubmit={(e) => {
        if (uploadingRef.current) e.preventDefault();
      }}
    >
      <div className="editor-toolbar">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/admin/productos"
            aria-label="Volver a productos"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white hover:bg-stone-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1>{product ? 'Editar producto' : 'Nuevo producto'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/productos" className="btn-secondary">
            Cancelar
          </Link>
          <button disabled={pending || uploading} className="btn">
            {pending && <LoaderCircle size={16} className="animate-spin" />}
            {pending ? 'Guardando…' : 'Guardar producto'}
          </button>
        </div>
      </div>
      {state.error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}
      <fieldset disabled={pending} className="editor-grid">
        <div className="min-w-0 space-y-4">
          <section className="editor-card" aria-labelledby="product-details">
            <h2 id="product-details">Información</h2>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <label className="editor-label">
                Nombre
                <input
                  className="field"
                  name="nombre"
                  required
                  minLength={2}
                  maxLength={150}
                  placeholder="Ej. Sombrero de paja"
                  defaultValue={product?.nombre}
                />
              </label>
              <label className="editor-label">
                Categoría
                <input
                  className="field"
                  name="categoria"
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="Ej. Sombreros"
                  defaultValue={product?.categoria}
                />
              </label>
              <label className="editor-label sm:col-span-2">
                Descripción
                <textarea
                  className="field"
                  name="descripcion"
                  rows={3}
                  required
                  maxLength={5000}
                  placeholder="Material, acabado y detalles del producto"
                  defaultValue={product?.descripcion}
                />
              </label>
            </div>
          </section>
          <section className="editor-card" aria-labelledby="product-prices">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="product-prices" className="!mb-0">
                Precios
              </h2>
              <span className="text-xs text-stone-500">Soles · S/</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 xl:grid-cols-4">
              {(
                ['precioMediaDocena', 'precioDocena', 'precioCaja'] as const
              ).map((field, i) => (
                <label key={field} className="editor-label">
                  <span className="min-h-8 leading-4">
                    {['Media docena', 'Docena', 'Caja completa'][i]}
                  </span>
                  <input
                    className="field"
                    name={field}
                    type="number"
                    required
                    min="0.01"
                    max="99999999.99"
                    step="0.01"
                    placeholder="0.00"
                    defaultValue={product?.[field]}
                  />
                  <span className="text-xs font-normal text-stone-400">
                    {['6 unidades', '12 unidades', 'Precio por caja'][i]}
                  </span>
                </label>
              ))}
              <label className="editor-label" htmlFor="box-units">
                <span className="min-h-8 leading-4">Unidades por caja</span>
                <input
                  id="box-units"
                  className="field"
                  name="unidadesPorCaja"
                  type="number"
                  min={12}
                  max={12000}
                  step={12}
                  required
                  defaultValue={product?.unidadesPorCaja ?? 144}
                  aria-describedby="box-help"
                />
                <span className="text-xs font-normal text-stone-400">
                  Múltiplos de 12
                </span>
              </label>
            </div>
            <p
              id="box-help"
              className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-400"
            >
              Los precios corresponden al paquete completo.
            </p>
          </section>
          <VariantFields initial={product?.variantes} />
        </div>
        <div className="min-w-0 space-y-4">
          <section className="editor-card">
            <h2>Publicación</h2>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-ink"
                name="activo"
                defaultChecked={product?.activo ?? true}
              />
              Visible en el catálogo
            </label>
            <p className="mt-2 pl-7 text-xs leading-5 text-stone-400">
              Desactívalo para guardarlo como borrador.
            </p>
          </section>
          <section className="editor-card" aria-labelledby="product-photos">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="product-photos" className="!mb-0">
                Fotografías
              </h2>
              <span className="text-xs text-stone-400">{images.length}/12</span>
            </div>
            <label className="relative flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 bg-stone-50/60 p-4 text-center transition hover:border-stone-500 focus-within:ring-2 focus-within:ring-ink">
              <ImagePlus
                size={24}
                strokeWidth={1.4}
                className="text-stone-400"
              />
              <span className="text-sm font-medium">Agregar imágenes</span>
              <span className="text-xs text-stone-400">
                JPG, PNG, WebP o AVIF · Hasta 5 MB
              </span>
              <input
                aria-label="Agregar imágenes"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                disabled={uploading || pending}
                onChange={(e) => {
                  void uploadFiles(e.target.files);
                  e.target.value = '';
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-wait"
              />
            </label>
            <input
              type="hidden"
              name="imagenes"
              value={JSON.stringify(images)}
            />
            {uploading && (
              <p role="status" className="mt-3 text-xs">
                Subiendo imágenes…
              </p>
            )}
            {uploadError && (
              <p role="alert" className="mt-3 text-xs text-red-700">
                {uploadError}
              </p>
            )}
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {images.map((url, i) => (
                  <div key={url} className="min-w-0">
                    <div className="relative aspect-square overflow-hidden rounded-lg border border-stone-100 bg-stone-50">
                      <Image
                        src={url}
                        alt={`Imagen ${i + 1} del producto`}
                        fill
                        sizes="(min-width: 1024px) 180px, 40vw"
                        className="object-contain p-2"
                      />
                    </div>
                    <div className="flex flex-wrap justify-between gap-1 text-[11px]">
                      <button
                        disabled={pending || uploading || i === 0}
                        type="button"
                        onClick={() =>
                          setImages((prev) => [
                            url,
                            ...prev.filter((x) => x !== url),
                          ])
                        }
                        className="min-h-11 text-stone-600 disabled:text-stone-400"
                      >
                        {i === 0 ? 'Portada' : 'Hacer portada'}
                      </button>
                      <button
                        disabled={pending || uploading}
                        type="button"
                        onClick={() =>
                          setImages((prev) => prev.filter((x) => x !== url))
                        }
                        className="min-h-11 text-red-700"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-stone-400">
              La primera imagen será la portada.
            </p>
          </section>
        </div>
      </fieldset>
    </form>
  );
}
