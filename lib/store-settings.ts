import 'server-only';
import { cache } from 'react';
import { db } from './db';
import { databaseConfigStatus } from './database-config';
export const getStoreSettings = cache(async () => {
  const defaults = {
    nombre: 'Arias',
    whatsapp: process.env.WHATSAPP_NUMBER ?? '',
    contacto: '',
    condicionesEnvio: 'Coordinamos disponibilidad, pago y envío por WhatsApp.',
  };
  if (databaseConfigStatus(process.env.DATABASE_URL) !== 'ready')
    return defaults;
  try {
    return (
      (await db.configuracion.findUnique({ where: { id: 'tienda' } })) ??
      defaults
    );
  } catch {
    return defaults;
  }
});
