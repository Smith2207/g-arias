'use client';
import { useState } from 'react';
export type VariantInput = { id?: string; color: string; talla: string };
export function VariantFields({ initial = [] }: { initial?: VariantInput[] }) {
  const [rows, setRows] = useState(
    initial.map((v) => ({ ...v, key: v.id ?? crypto.randomUUID() })),
  );
  return (
    <details className="editor-card group" open={initial.length > 0}>
      <summary className="flex min-h-6 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold">
        Colores y tallas
        <span className="flex items-center gap-3 text-xs font-normal text-stone-400">
          {rows.length ? `${rows.length} variantes` : 'Opcional'}
          <span
            aria-hidden="true"
            className="transition-transform group-open:rotate-45 text-lg"
          >
            +
          </span>
        </span>
      </summary>
      <p className="my-3 text-xs leading-5 text-stone-500">
        Mismos precios, stock por variante. Ajusta las existencias en
        Inventario.
      </p>
      <input
        type="hidden"
        name="variantes"
        value={JSON.stringify(
          rows.map(({ id, color, talla }) => ({ id, color, talla })),
        )}
      />
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r.key} className="flex flex-wrap items-end gap-2">
            <label className="min-w-0 flex-1 text-xs">
              Color
              <input
                aria-label={`Color ${i + 1}`}
                className="field mt-2"
                maxLength={50}
                value={r.color}
                onChange={(e) =>
                  setRows(
                    rows.map((v) =>
                      v.key === r.key ? { ...v, color: e.target.value } : v,
                    ),
                  )
                }
              />
            </label>
            <label className="min-w-0 flex-1 text-xs">
              Talla
              <input
                aria-label={`Talla ${i + 1}`}
                className="field mt-2"
                maxLength={50}
                value={r.talla}
                onChange={(e) =>
                  setRows(
                    rows.map((v) =>
                      v.key === r.key ? { ...v, talla: e.target.value } : v,
                    ),
                  )
                }
              />
            </label>
            <button
              type="button"
              aria-label={`Quitar variante ${i + 1}`}
              className="min-h-11 px-2 text-xs text-red-700"
              onClick={() => setRows(rows.filter((v) => v.key !== r.key))}
            >
              Quitar
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={rows.length >= 30}
        className="btn-secondary mt-4"
        onClick={() =>
          setRows([...rows, { key: crypto.randomUUID(), color: '', talla: '' }])
        }
      >
        Agregar variante
      </button>
    </details>
  );
}
