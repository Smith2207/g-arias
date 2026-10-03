import { Prisma, PrismaClient } from '@prisma/client';
export async function operationsSummary(db: PrismaClient) {
  const [sales, movements, activePayments, refunds, preparing, inTransit] = await db.$transaction([
    db.pedido.aggregate({ where: { estado: { in: ['CONFIRMADO', 'ENTREGADO'] } }, _sum: { total: true } }),
    db.movimientoCaja.groupBy({ by: ['tipo'], orderBy: { tipo: 'asc' }, _sum: { monto: true } }),
    db.movimientoCaja.groupBy({ by: ['tipo'], orderBy: { tipo: 'asc' }, where: { pedido: { estado: { in: ['CONFIRMADO', 'ENTREGADO'] } } }, _sum: { monto: true } }),
    db.movimientoCaja.groupBy({ by: ['tipo'], orderBy: { tipo: 'asc' }, where: { pedido: { estado: 'CANCELADO' } }, _sum: { monto: true } }),
    db.pedido.count({ where: { estado: 'CONFIRMADO', despacho: 'PREPARACION' } }),
    db.pedido.count({ where: { estado: 'CONFIRMADO', despacho: 'EN_CAMINO' } }),
  ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  const sum = (rows: typeof movements, tipo: string) => rows.find(r => r.tipo === tipo)?._sum?.monto ?? new Prisma.Decimal(0);
  const collections = sum(movements, 'COBRO');
  const expenses = sum(movements, 'GASTO');
  const returns = sum(movements, 'DEVOLUCION');
  return {
    sales: sales._sum.total ?? new Prisma.Decimal(0), collections, expenses, returns,
    cash: collections.minus(expenses).minus(returns),
    receivable: (sales._sum.total ?? new Prisma.Decimal(0)).minus(sum(activePayments, 'COBRO')).plus(sum(activePayments, 'DEVOLUCION')),
    refundable: sum(refunds, 'COBRO').minus(sum(refunds, 'DEVOLUCION')),
    preparing, inTransit,
  };
}
