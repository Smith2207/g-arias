import { test } from 'node:test';
import assert from 'node:assert/strict';
import { whatsappUrl, subtotal, type CartItem } from '../lib/commerce';
import { productSchema } from '../lib/validation';
const item: CartItem = { id: 'one', nombre: 'Gorra & algodón', imagen: '', presentacion: 'caja', unidadesPorCaja: 144, cantidad: 3, precio: 10.10 };
test('Calcula importes en céntimos y codifica el mensaje de WhatsApp', () => {
  assert.equal(subtotal(item),3030);
  const result = new URL(whatsappUrl('51999999999',[item])!);
  assert.equal(result.hostname,'wa.me');
  const message = result.searchParams.get('text')!;
  assert.match(message,/Gorra & algodón/);
  assert.match(message,/12 docenas \(144 unidades\) × 3/);
  assert.match(message,/30[.,]30/);
  assert.equal(whatsappUrl('bad',[item]),null);
  assert.equal(whatsappUrl('51999999999',[]),null);
});
test('Rechaza precios inválidos, cajas fraccionadas e imágenes ajenas a Blob', () => {
  const valid = { nombre: 'Sombrero', descripcion: 'Algodón', categoria: 'Sombreros', precioMediaDocena: '30.00', precioDocena: '50', precioCaja: '400', unidadesPorCaja: 144, activo: true, imagenes: ['https://store.public.blob.vercel-storage.com/productos/test.jpg'] };
  assert.equal(productSchema.safeParse(valid).success,true);
  for (const patch of [{ precioCaja: '-1' },{ precioCaja: '1.999' },{ unidadesPorCaja: 13 },{ imagenes: ['https://evil.com/productos/test.jpg'] }]) assert.equal(productSchema.safeParse({...valid,...patch}).success,false);
});
