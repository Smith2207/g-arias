'use server';
import { db } from '@/lib/db';
import { createOrder, orderWhatsapp, OrderError } from '@/lib/orders';
import { getStoreSettings } from '@/lib/store-settings';
import { revalidatePath } from 'next/cache';
export async function submitOrder(
  input: unknown,
): Promise<{ error?: string; codigo?: string; url?: string }> {
  try {
    const settings = await getStoreSettings();
    if (!/^[1-9]\d{7,14}$/.test(settings.whatsapp))
      return {
        error: 'La tienda todavía no tiene habilitado el canal de pedidos.',
      };
    const order = await createOrder(db, input);
    revalidatePath('/admin');
    revalidatePath('/admin/pedidos');
    return {
      codigo: order.codigo,
      url: orderWhatsapp(settings.whatsapp, order),
    };
  } catch (error) {
    return {
      error:
        error instanceof OrderError
          ? error.message
          : 'No pudimos guardar tu pedido. Puedes volver a intentarlo sin duplicarlo.',
    };
  }
}
