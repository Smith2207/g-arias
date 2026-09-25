-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "precioMediaDocena" DECIMAL(10,2) NOT NULL,
    "precioDocena" DECIMAL(10,2) NOT NULL,
    "precioCaja" DECIMAL(10,2) NOT NULL,
    "unidadesPorCaja" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagenProducto" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ImagenProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Producto_activo_categoria_idx" ON "Producto"("activo", "categoria");

-- CreateIndex
CREATE INDEX "ImagenProducto_productoId_orden_idx" ON "ImagenProducto"("productoId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_usuario_key" ON "Admin"("usuario");

-- AddForeignKey
ALTER TABLE "ImagenProducto" ADD CONSTRAINT "ImagenProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Invariantes que también protegen escrituras fuera del formulario.
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_precios_positivos"
CHECK ("precioMediaDocena" > 0 AND "precioDocena" > 0 AND "precioCaja" > 0);
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_caja_docenas"
CHECK ("unidadesPorCaja" >= 12 AND "unidadesPorCaja" <= 12000 AND "unidadesPorCaja" % 12 = 0);
ALTER TABLE "ImagenProducto" ADD CONSTRAINT "ImagenProducto_orden_no_negativo" CHECK ("orden" >= 0);
