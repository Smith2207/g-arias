import { z } from 'zod';
export function isProductImage(url: string) {
  try { const u = new URL(url); return u.protocol === 'https:' && /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(u.hostname) && u.pathname.startsWith('/productos/') && !u.search && !u.hash; } catch { return false; }
}
const price = z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, 'Usa un precio válido con hasta 2 decimales.').refine(v => Number(v) > 0, 'El precio debe ser mayor a cero.');
export const productSchema = z.object({
  nombre: z.string().trim().min(2).max(150), descripcion: z.string().trim().min(1).max(5000), categoria: z.string().trim().min(2).max(80),
  precioMediaDocena: price, precioDocena: price, precioCaja: price,
  unidadesPorCaja: z.coerce.number().int().min(12).max(12000).multipleOf(12, 'La caja debe contener docenas completas.'),
  activo: z.boolean(), imagenes: z.array(z.string().refine(isProductImage, 'Imagen no válida.')).max(12),
});
export type FormState = { error?: string };
