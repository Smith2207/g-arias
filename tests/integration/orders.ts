import { operationsFlow } from './operations-flow';
import { browserFlow } from './browser-flow';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import {
  createOrder,
  updateOrderStatus,
  orderWhatsapp,
} from '../../lib/orders';
const directUrl = new URL(process.env.DATABASE_URL!);
directUrl.hostname = directUrl.hostname.replace('-pooler', '');
directUrl.searchParams.set('connect_timeout', '30');
directUrl.searchParams.set('pool_timeout', '40');
directUrl.searchParams.set('connection_limit', '2');
const root = new PrismaClient({ datasourceUrl: directUrl.toString() });
const schema = `qa_orders_${randomUUID().replaceAll('-', '')}`;
const url = new URL(directUrl);
url.searchParams.set('schema', schema);
const db = new PrismaClient({ datasourceUrl: url.toString() });
async function main() {
  await root.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  try {
    const dirs = (await readdir('prisma/migrations', { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    await db.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
        for (const dir of dirs) {
          const sql = (
            await readFile(`prisma/migrations/${dir}/migration.sql`, 'utf8')
          ).replace(/CREATE SCHEMA IF NOT EXISTS "public";/, '');
          for (const statement of sql.split(';').filter((s) => s.trim()))
            await tx.$executeRawUnsafe(statement);
        }
      },
      { timeout: 120000, maxWait: 40000 },
    );
    console.log('Esquema de prueba preparado.');
    const p = await db.producto.create({
      data: {
        nombre: 'Producto QA',
        descripcion: 'Prueba aislada',
        categoria: 'QA',
        precioMediaDocena: 30,
        precioDocena: 60,
        precioCaja: 720,
        unidadesPorCaja: 144,
        stock: 18,
      },
    });
    let phone = 10000000;
    const input = (
      items: unknown[] = [
        {
          id: p.id,
          presentacion: 'docena',
          cantidad: 1,
          precio: 60,
          unidadesPorCaja: 144,
        },
      ],
    ) => ({
      clave: randomUUID(),
      nombre: 'Cliente QA',
      telefono: `51${phone++}`,
      notas: 'Prueba',
      items,
    });
    const request = input();
    const [a, retry] = await Promise.all([
      createOrder(db, request),
      createOrder(db, request),
    ]);
    assert.equal(a.id, retry.id);
    assert.equal(await db.pedido.count(), 1);
    assert.equal(Number(a.total), 60);
    assert.equal(
      (await db.producto.findUniqueOrThrow({ where: { id: p.id } })).stock,
      18,
    );
    await assert.rejects(
      createOrder(db, { ...request, nombre: 'Otro cliente' }),
    );
    await assert.rejects(
      createOrder(db, input([{ ...(request.items[0] as object), precio: 1 }])),
    );
    const b = await createOrder(db, input());
    const confirmations = await Promise.allSettled([
      updateOrderStatus(db, a.id, 'CONFIRMADO'),
      updateOrderStatus(db, b.id, 'CONFIRMADO'),
    ]);
    assert.equal(
      confirmations.filter((r) => r.status === 'fulfilled').length,
      1,
    );
    assert.equal(
      (await db.producto.findUniqueOrThrow({ where: { id: p.id } })).stock,
      6,
    );
    const confirmed = await db.pedido.findFirstOrThrow({
      where: { estado: 'CONFIRMADO' },
    });
    await updateOrderStatus(db, confirmed.id, 'CONFIRMADO');
    assert.equal(
      (await db.producto.findUniqueOrThrow({ where: { id: p.id } })).stock,
      6,
    );
    await Promise.all([
      updateOrderStatus(db, confirmed.id, 'CANCELADO'),
      updateOrderStatus(db, confirmed.id, 'CANCELADO'),
    ]);
    assert.equal(
      (await db.producto.findUniqueOrThrow({ where: { id: p.id } })).stock,
      18,
    );
    await assert.rejects(updateOrderStatus(db, confirmed.id, 'CONFIRMADO'));
    await assert.rejects(
      createOrder(
        db,
        input([{ ...(request.items[0] as object), cantidad: 2 }]),
      ),
    );
    const v = await db.variante.create({
      data: { productoId: p.id, color: 'Azul', talla: 'M', stock: 12 },
    });
    await assert.rejects(createOrder(db, input()));
    await assert.rejects(
      createOrder(
        db,
        input([
          { ...(request.items[0] as object), varianteId: v.id },
          {
            id: p.id,
            varianteId: v.id,
            presentacion: 'mediaDocena',
            precio: 30,
            cantidad: 1,
            unidadesPorCaja: 144,
          },
        ]),
      ),
    );
    const variantOrder = await createOrder(
      db,
      input([{ ...(request.items[0] as object), varianteId: v.id }]),
    );
    await updateOrderStatus(db, variantOrder.id, 'CONFIRMADO');
    assert.equal(
      (await db.variante.findUniqueOrThrow({ where: { id: v.id } })).stock,
      0,
    );
    assert.equal(
      (await db.producto.findUniqueOrThrow({ where: { id: p.id } })).stock,
      18,
    );
    await updateOrderStatus(db, variantOrder.id, 'ENTREGADO');
    await assert.rejects(updateOrderStatus(db, variantOrder.id, 'CANCELADO'));
    const message = new URL(
      orderWhatsapp('51999999999', variantOrder),
    ).searchParams.get('text')!;
    assert.match(message, /Azul · M/);
    assert.ok(message.includes(variantOrder.codigo));
    await db.variante.update({ where: { id: v.id }, data: { stock: null } });
    const unlimited = await createOrder(
      db,
      input([
        { ...(request.items[0] as object), varianteId: v.id, cantidad: 999 },
      ]),
    );
    await updateOrderStatus(db, unlimited.id, 'CONFIRMADO');
    await updateOrderStatus(db, unlimited.id, 'CANCELADO');
    assert.equal(
      (await db.variante.findUniqueOrThrow({ where: { id: v.id } })).stock,
      null,
    );
    await operationsFlow(db);
    await browserFlow(db, url.toString());
    console.log(
      'Pedidos: idempotencia concurrente, precios, stock, variantes, estados y cancelación verificados en un esquema aislado.',
    );
  } finally {
    await db.$disconnect();
    await root.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
    await root.$disconnect();
  }
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : 'Falló la prueba');
  process.exitCode = 1;
});
