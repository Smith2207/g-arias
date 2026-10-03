import { createHash, randomBytes } from 'node:crypto';
import { Prisma, PrismaClient, EstadoPedido } from '@prisma/client';
import { z } from 'zod';
import {
  presentations,
  Presentation,
  money,
  presentationLabel,
} from './commerce';
export class OrderError extends Error {}
export const checkoutSchema = z.object({
  clave: z.string().uuid(),
  nombre: z.string().trim().min(2).max(100),
  telefono: z
    .string()
    .trim()
    .regex(
      /^[1-9]\d{7,14}$/,
      'Escribe tu teléfono con código de país, solo dígitos.',
    ),
  notas: z.string().trim().max(500).default(''),
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        varianteId: z.string().max(100).optional(),
        presentacion: z.enum(presentations),
        cantidad: z.number().int().min(1).max(999),
        precio: z.number().positive().max(99999999.99),
        unidadesPorCaja: z.number().int().min(12).max(12000),
      }),
    )
    .min(1)
    .max(50),
});
export const transitions: Record<EstadoPedido, EstadoPedido[]> = {
  PENDIENTE: ['CONFIRMADO', 'CANCELADO'],
  CONFIRMADO: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
};
export const orderLabels: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};
export async function serializable<T>(
  db: PrismaClient,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10000,
        timeout: 20000,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034' &&
        attempt < 3
      )
        continue;
      throw error;
    }
  }
}
export async function createOrder(db: PrismaClient, input: unknown) {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success)
    throw new OrderError(
      parsed.error.issues[0]?.message ?? 'Revisa los datos del pedido.',
    );
  const { clave, items, ...customer } = parsed.data;
  const huella = createHash('sha256')
    .update(JSON.stringify({ ...customer, items }))
    .digest('hex');
  try {
    return await serializable(db, async (tx) => {
      const previous = await tx.pedido.findUnique({
        where: { clave },
        include: { lineas: true },
      });
      if (previous) {
        if (previous.huella !== huella)
          throw new OrderError(
            'El pedido cambió. Actualiza la página para volver a intentarlo.',
          );
        return previous;
      }
      const recent = await tx.pedido.count({
        where: {
          telefono: customer.telefono,
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      });
      if (recent >= 5)
        throw new OrderError(
          'Ya recibimos varios pedidos con este teléfono. Contacta con la tienda antes de crear otro.',
        );
      const products = await tx.producto.findMany({
        where: { id: { in: items.map((i) => i.id) }, activo: true },
        include: { variantes: true },
      });
      const needs = new Map<
        string,
        { units: number; stock: number | null; name: string }
      >();
      const lines = items.map((i) => {
        const p = products.find((p) => p.id === i.id);
        if (!p)
          throw new OrderError(
            'Un producto ya no está disponible. Quítalo del carrito y revisa el catálogo.',
          );
        const variants = p.variantes.filter((v) => v.activo);
        const variant = i.varianteId
          ? variants.find((v) => v.id === i.varianteId)
          : undefined;
        if ((i.varianteId && !variant) || (variants.length && !variant))
          throw new OrderError(
            `Selecciona una variante disponible de ${p.nombre}. Vuelve a agregarla desde el catálogo.`,
          );
        const price = {
          mediaDocena: p.precioMediaDocena,
          docena: p.precioDocena,
          caja: p.precioCaja,
        }[i.presentacion];
        if (
          Math.round(Number(price) * 100) !== Math.round(i.precio * 100) ||
          p.unidadesPorCaja !== i.unidadesPorCaja
        )
          throw new OrderError(
            `Cambió el precio o presentación de ${p.nombre}. Quítalo del carrito y agrégalo de nuevo.`,
          );
        const units =
          (i.presentacion === 'mediaDocena'
            ? 6
            : i.presentacion === 'docena'
              ? 12
              : p.unidadesPorCaja) * i.cantidad;
        const key = variant ? `v:${variant.id}` : `p:${p.id}`;
        const need = needs.get(key) ?? {
          units: 0,
          stock: variant ? variant.stock : p.stock,
          name: p.nombre,
        };
        need.units += units;
        needs.set(key, need);
        return {
          productoId: p.id,
          varianteId: variant?.id,
          nombre: p.nombre,
          varianteNombre: variant
            ? [variant.color, variant.talla].filter(Boolean).join(' · ')
            : '',
          presentacion: i.presentacion,
          cantidad: i.cantidad,
          unidades: units,
          precio: price,
        };
      });
      for (const need of needs.values())
        if (need.stock !== null && need.units > need.stock)
          throw new OrderError(
            `No hay suficientes unidades de ${need.name}. Reduce la cantidad.`,
          );
      const cents = lines.reduce(
        (sum, l) => sum + Math.round(Number(l.precio) * 100) * l.cantidad,
        0,
      );
      return tx.pedido.create({
        data: {
          ...customer,
          clave,
          huella,
          codigo: `AR-${randomBytes(5).toString('hex').toUpperCase()}`,
          total: new Prisma.Decimal(cents).div(100),
          lineas: { create: lines },
        },
        include: { lineas: true },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const previous = await db.pedido.findUnique({
        where: { clave },
        include: { lineas: true },
      });
      if (previous?.huella === huella) return previous;
    }
    throw error;
  }
}
export async function updateOrderStatus(
  db: PrismaClient,
  id: string,
  next: EstadoPedido,
) {
  return serializable(db, async (tx) => {
    const order = await tx.pedido.findUnique({
      where: { id },
      include: { lineas: true },
    });
    if (!order) throw new OrderError('Pedido no encontrado.');
    if (order.estado === next) return order;
    if (!transitions[order.estado].includes(next))
      throw new OrderError('Ese cambio de estado no está permitido.');
    if (next === 'CANCELADO' && order.despacho === 'EN_CAMINO')
      throw new OrderError('El pedido está en camino. Registra su retorno a preparación antes de cancelarlo.');
    // El cambio de estado y los movimientos de stock se confirman juntos.
    const changed = await tx.pedido.updateMany({
      where: { id, estado: order.estado },
      data: {
        estado: next,
        ...(next === 'ENTREGADO' ? { despacho: 'ENTREGADO' as const, entregadoAt: new Date() } : {}),
        ...(next === 'CANCELADO' ? { despacho: 'CANCELADO' as const } : {}),
      },
    });
    if (changed.count !== 1)
      throw new OrderError(
        'Otro usuario actualizó el pedido. Recarga la página.',
      );
    for (const line of [...order.lineas].sort((a, b) =>
      (a.varianteId ?? a.productoId).localeCompare(
        b.varianteId ?? b.productoId,
      ),
    )) {
      if (next === 'CONFIRMADO') {
        const product = await tx.producto.findUnique({
          where: { id: line.productoId },
          include: {
            variantes: { where: { activo: true }, select: { id: true } },
          },
        });
        const variant = line.varianteId
          ? await tx.variante.findUnique({ where: { id: line.varianteId } })
          : null;
        if (product && !line.varianteId && product.variantes.length)
          throw new OrderError(
            `${line.nombre} ahora tiene variantes. Cancela este pedido y solicita uno actualizado.`,
          );
        if (!product?.activo || (line.varianteId && !variant?.activo))
          throw new OrderError(`${line.nombre} ya no está disponible.`);
        const stock = variant ? variant.stock : product.stock;
        if (stock !== null) {
          const result = line.varianteId
            ? await tx.variante.updateMany({
                where: { id: line.varianteId, stock: { gte: line.unidades } },
                data: { stock: { decrement: line.unidades } },
              })
            : await tx.producto.updateMany({
                where: { id: line.productoId, stock: { gte: line.unidades } },
                data: { stock: { decrement: line.unidades } },
              });
          if (result.count !== 1)
            throw new OrderError(
              `Stock insuficiente para ${line.nombre}. Revisa el inventario.`,
            );
          await tx.lineaPedido.update({
            where: { id: line.id },
            data: { stockDescontado: true },
          });
        }
      }
      if (
        next === 'CANCELADO' &&
        order.estado === 'CONFIRMADO' &&
        line.stockDescontado
      ) {
        if (line.varianteId)
          await tx.variante.updateMany({
            where: { id: line.varianteId, stock: { not: null } },
            data: { stock: { increment: line.unidades } },
          });
        else
          await tx.producto.updateMany({
            where: { id: line.productoId, stock: { not: null } },
            data: { stock: { increment: line.unidades } },
          });
        await tx.lineaPedido.update({
          where: { id: line.id },
          data: { stockDescontado: false },
        });
      }
    }
    return tx.pedido.findUniqueOrThrow({ where: { id } });
  });
}
export function orderWhatsapp(
  number: string,
  order: Awaited<ReturnType<typeof createOrder>>,
) {
  const lines = order.lineas.map(
    (l) =>
      `• ${l.nombre}${l.varianteNombre ? ` (${l.varianteNombre})` : ''}\n  ${presentationLabel(l.presentacion as Presentation, l.unidades / l.cantidad)} × ${l.cantidad} · ${money(Number(l.precio) * l.cantidad)}`,
  );
  const message = [
    `Hola, quiero confirmar mi pedido ${order.codigo}.`,
    `Nombre: ${order.nombre}`,
    ...lines,
    `Total de productos: ${money(Number(order.total))}`,
    order.notas ? `Nota: ${order.notas}` : '',
    'Pendiente de confirmar disponibilidad, pago y envío.',
  ]
    .filter(Boolean)
    .join('\n\n');
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
