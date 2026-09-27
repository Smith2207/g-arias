import { requireAdmin } from '@/lib/auth';
import { getStoreSettings } from '@/lib/store-settings';
import { ManagementForm } from '@/components/management-form';
import { saveSettings } from '../gestion-actions';
export default async function Settings() {
  await requireAdmin();
  const s = await getStoreSettings();
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Configuración</h1>
      <p className="mt-3 text-sm text-stone-500">
        Los datos que tus clientes ven al comprar.
      </p>
      <section className="card mt-7 max-w-2xl p-5 sm:p-7">
        <ManagementForm action={saveSettings}>
          <label className="block text-sm">
            Nombre del negocio
            <input
              className="field mt-2"
              name="nombre"
              defaultValue={s.nombre}
              required
              minLength={2}
              maxLength={60}
            />
          </label>
          <label className="block text-sm">
            WhatsApp de pedidos
            <input
              className="field mt-2"
              name="whatsapp"
              defaultValue={s.whatsapp}
              required
              inputMode="numeric"
              pattern="[1-9][0-9]{7,14}"
              placeholder="51987654321"
            />
            <span className="mt-2 block text-xs text-stone-500">
              Código de país y número, sin espacios ni signo +.
            </span>
          </label>
          <label className="block text-sm">
            Contacto o dirección
            <input
              className="field mt-2"
              name="contacto"
              defaultValue={s.contacto}
              maxLength={200}
            />
          </label>
          <label className="block text-sm">
            Condiciones de envío y compra
            <textarea
              className="field mt-2"
              name="condicionesEnvio"
              defaultValue={s.condicionesEnvio}
              required
              maxLength={1000}
              rows={4}
            />
          </label>
        </ManagementForm>
      </section>
    </>
  );
}
