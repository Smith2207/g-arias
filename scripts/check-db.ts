import { PrismaClient } from '@prisma/client';
import { databaseConfigStatus } from '../lib/database-config';

async function main() {
  const status = databaseConfigStatus(process.env.DATABASE_URL);
  if (status !== 'ready') {
    console.error(status === 'example'
      ? 'DATABASE_URL contiene USER/PASSWORD/HOST de ejemplo. Copia la conexión real de Neon > Connect en .env.'
      : 'DATABASE_URL falta o no es una conexión PostgreSQL válida. Revisa .env.');
    process.exitCode = 1;
    return;
  }
  const db = new PrismaClient({ log: [] });
  try {
    await db.$queryRaw`SELECT 1`;
    const count = await db.producto.count({ where: { activo: true } });
    console.log(`Conexión y tablas correctas. Productos activos: ${count}.`);
  } catch (error) {
    const code = typeof error === 'object' && error !== null
      ? ('code' in error ? String(error.code) : 'errorCode' in error ? String(error.errorCode) : '')
      : '';
    const messages: Record<string, string> = {
      P1000: 'Usuario o contraseña rechazados. Copia de nuevo la conexión de Neon.',
      P1001: 'No se puede alcanzar el servidor. Revisa el host, la red y el estado del proyecto Neon.',
      P1002: 'El servidor no respondió a tiempo. Reintenta la conexión.',
      P1013: 'La URL de conexión es inválida. Copia la conexión completa de Neon.',
      P2021: 'Faltan las tablas. Ejecuta npm run db:deploy.',
      P2022: 'El esquema no está actualizado. Ejecuta npm run db:deploy.',
    };
    console.error(messages[code] ?? 'No se pudo conectar o consultar las tablas. Revisa DATABASE_URL y las migraciones.');
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}
void main();
