'use client';
import { useRef, useState } from 'react';
import { submitOrder } from '@/app/pedidos/actions';
import type { CartItem } from '@/lib/commerce';
export function Checkout({ items }: { items: CartItem[] }) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    codigo: string;
    url: string;
    fingerprint: string;
  } | null>(null);
  const request = useRef({ fingerprint: '', clave: '' });
  const inFlight = useRef(false);
  const payload = {
    nombre,
    telefono,
    notas,
    items: items.map(
      ({
        id,
        varianteId,
        presentacion,
        cantidad,
        precio,
        unidadesPorCaja,
      }) => ({
        id,
        varianteId,
        presentacion,
        cantidad,
        precio,
        unidadesPorCaja,
      }),
    ),
  };
  const fingerprint = JSON.stringify(payload);
  const current = result?.fingerprint === fingerprint ? result : null;
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (inFlight.current) return;
        inFlight.current = true;
        setPending(true);
        setError('');
        if (request.current.fingerprint !== fingerprint)
          request.current = { fingerprint, clave: crypto.randomUUID() };
        // Mantener la clave durante los reintentos evita registrar dos veces el mismo pedido.
        try {
          const response = await submitOrder({
            ...payload,
            clave: request.current.clave,
          });
          if (response.error) setError(response.error);
          else if (response.codigo && response.url)
            setResult({
              codigo: response.codigo,
              url: response.url,
              fingerprint,
            });
        } catch {
          setError(
            'No pudimos conectar. Inténtalo nuevamente; no duplicaremos el pedido.',
          );
        } finally {
          inFlight.current = false;
          setPending(false);
        }
      }}
    >
      <fieldset disabled={pending || !!current} className="space-y-4">
        <label className="block text-sm">
          Tu nombre
          <input
            className="field mt-2"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Tu WhatsApp
          <input
            className="field mt-2"
            required
            inputMode="tel"
            autoComplete="tel"
            pattern="[1-9][0-9]{7,14}"
            placeholder="51987654321"
            value={telefono}
            onChange={(e) =>
              setTelefono(e.target.value.replace(/[\s+()-]/g, ''))
            }
          />
          <span className="mt-1 block text-xs text-stone-500">
            Incluye el código de país.
          </span>
        </label>
        <details>
          <summary className="cursor-pointer py-2 text-sm">
            Agregar una nota (opcional)
          </summary>
          <textarea
            aria-label="Nota del pedido"
            className="field mt-2"
            maxLength={500}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </details>
        {!current && (
          <button className="btn w-full" disabled={pending}>
            {pending ? 'Guardando…' : 'Guardar pedido y continuar'}
          </button>
        )}
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {current && (
        <div role="status" className="space-y-3 rounded-xl bg-white p-4">
          <p className="text-sm">
            Pedido <strong>{current.codigo}</strong> registrado.
          </p>
          <a
            className="btn w-full"
            href={current.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir WhatsApp
          </a>
          <p className="text-xs leading-5 text-stone-500">
            Envía el mensaje para coordinar disponibilidad, pago y envío.
          </p>
        </div>
      )}
      <p className="text-xs leading-5 text-stone-500">
        Tu pedido queda pendiente hasta que la tienda lo confirme. Tus datos se
        usarán para atender esta compra.
      </p>
    </form>
  );
}
