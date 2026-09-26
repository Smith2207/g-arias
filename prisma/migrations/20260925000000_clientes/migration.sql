CREATE TABLE "Cliente" (
  "id" TEXT NOT NULL,
  "usuario" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Cliente_usuario_key" ON "Cliente"("usuario");
