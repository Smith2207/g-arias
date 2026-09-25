# Arias · Catálogo mayorista

Catálogo responsive de sombreros y gorras con pedidos por WhatsApp, sin pasarela de pago. Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, Prisma 6, Neon/Postgres y Vercel Blob público.

## Instalar y configurar

Requiere Node.js 22.13+ y npm.

```sh
npm install
cp .env.example .env
```

Completa `.env` (no lo subas a Git):

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | URL PostgreSQL de Neon con `sslmode=require`. Usa la conexión pooled para Vercel. |
| `BLOB_READ_WRITE_TOKEN` | Token del almacén **público** de Vercel Blob. |
| `ADMIN_USER` | Usuario inicial del administrador, usado por el seed. |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt, usado por el seed. |
| `WHATSAPP_NUMBER` | Número internacional solo con dígitos, por ejemplo `51999999999`. |
| `SESSION_SECRET` | Secreto aleatorio de al menos 32 caracteres. |

Genera el secreto con `openssl rand -hex 32`. Para obtener el hash sin poner tu contraseña en el historial de la terminal, ejecuta en Bash o Zsh:

```sh
bash -c 'read -rsp "Contraseña (12–72 bytes): " admin_password; echo; printf "%s" "$admin_password" | npm run --silent hash-password; unset admin_password'
```

Copia el hash completo a `ADMIN_PASSWORD_HASH` en `.env`, entre comillas simples para conservar los signos `$`. Nunca uses la contraseña sin hash. Las variables del administrador no se envían al navegador.

## Si aparece «No se pudo consultar el catálogo»

El archivo `.env.example` contiene una URL de ejemplo; copiarla a `.env` no crea una base de datos. En tu proyecto de Neon abre **Connect**, copia la conexión PostgreSQL completa y reemplaza `DATABASE_URL` en `.env`. No pegues tu contraseña ni la URL privada en un chat ni en GitHub.

```sh
npm run db:check
```

El diagnóstico diferencia configuración de ejemplo, problemas de conexión y tablas sin migrar. Con la URL real configurada:

```sh
npm run db:deploy
npm run db:check
npm run db:seed
npm run dev
```

Reinicia el servidor de desarrollo después de cambiar `.env`. El seed requiere un hash bcrypt válido. El catálogo se llena creando productos desde `/admin/login`; el seed no inserta productos de muestra.

## Hacer el build

Desde la carpeta `g_arias`:

```sh
npm install
npm run build
npm start
```

`build` genera Prisma y compila para producción; `start` sirve esa compilación en `http://localhost:3000`. No ejecutes `dev` y `start` en el mismo puerto. El build puede terminar sin Neon porque el catálogo se consulta al abrir la página: compilar no soluciona una URL de base de datos inválida. Si tu entorno impide compilar con Turbopack, usa `npm run build -- --webpack`.

En Vercel importa el repositorio GitHub y configura las variables del `.env.example` en **Settings → Environment Variables**. No se suben `.env`, `.next` ni `node_modules` al repositorio. Vercel instala dependencias y ejecuta el build automáticamente.

## Base de datos y ejecución local

Crea un proyecto en Neon, copia su URL y ejecuta:

```sh
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

`db:deploy` aplica la migración inicial incluida sin necesitar una shadow database. Para futuros cambios del esquema, usa `npm run db:migrate -- --name nombre_del_cambio` contra una base de desarrollo; Prisma puede requerir permisos para crear la shadow database. No ejecutes `migrate dev` sobre producción.

El seed lee `.env` y crea/actualiza un solo administrador con ID fijo (`owner`); no carga productos ficticios. Vuelve a ejecutarlo para cambiar usuario o contraseña. Entra en `/admin/login` y crea los productos reales. Si no existe `DATABASE_URL`, la portada muestra un estado de preparación; no se sustituye una conexión fallida por datos de muestra.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

## Estructura

```text
prisma/
  schema.prisma                  # Producto, ImagenProducto, Admin
  migrations/                    # Migración inicial SQL
app/
  page.tsx                       # Catálogo y categorías (Server Component)
  producto/[id]/page.tsx          # Detalle (Server Component)
  carrito/page.tsx                # Carrito persistido en el navegador
  admin/login/page.tsx
  admin/productos/page.tsx
  admin/productos/nuevo/page.tsx
  admin/productos/[id]/editar/page.tsx
  admin/actions.ts               # Autenticación y mutaciones protegidas
  api/upload/route.ts             # Autorización de subida a Blob
components/                      # Galería, carrito, formularios e imágenes
lib/                             # Prisma, sesión, validaciones y cálculos
proxy.ts                         # Protección previa de /admin/*
scripts/                         # Seed de administrador y hash de contraseña
tests/                           # Sesiones, validaciones y WhatsApp
```

Next.js 16 renombró `middleware.ts` a `proxy.ts`. El proxy verifica la cookie firmada y las consultas/mutaciones administrativas comprueban además que el administrador exista en la base. La cookie es HttpOnly, SameSite=Lax, Secure en producción y caduca a las 8 horas. Las Server Actions tienen la comprobación de origen de Next.js; la autorización de subida comprueba origen y sesión. Configura una regla de rate limiting en el firewall de Vercel para `POST /admin/login` antes de exponer el acceso públicamente. Cambiar `SESSION_SECRET` invalida todas las sesiones existentes.

## Precios y pedidos

- Los tres precios corresponden al **paquete completo**, no a una unidad. “Desde” muestra el menor de esos tres precios.
- Una caja contiene un múltiplo de 12 unidades; el detalle muestra la cantidad de docenas.
- El selector y carrito cuentan paquetes (máximo 999 por línea). Un producto con distinta presentación ocupa líneas diferentes.
- Moneda inicial: soles peruanos (PEN), definida en `lib/commerce.ts` y en las etiquetas del formulario administrativo.
- El carrito usa Zustand + localStorage y conserva una copia de los precios al agregar productos. No reserva inventario ni valida precios actuales. El vendedor confirma precios, disponibilidad y envío antes de aceptar el pedido.
- El enlace `wa.me` abre un borrador con producto, presentación, cantidad, precio, subtotales y total. El comprador debe enviarlo en WhatsApp. No se registra un pedido en la base ni se cobra automáticamente.

## Imágenes

La subida se hace directamente del navegador a Blob mediante tokens autorizados por el servidor: hasta 12 imágenes por producto, JPG/PNG/WebP/AVIF y 5 MB por archivo. El formulario permite quitar imágenes y elegir la portada; se guarda el orden en `ImagenProducto.orden`. Las imágenes son públicas: no subas documentos privados.

Quitar una imagen o eliminar un producto elimina su referencia en la base, **no el archivo en Blob**. Las subidas de formularios abandonados también pueden quedar sin referencia. Revisa periódicamente el almacén y elimina manualmente archivos no usados después de comprobar sus referencias. Se evita borrar archivos que pudieran estar compartidos.

El callback de Blob no lleva cookie de navegador: su firma se valida mediante el SDK. Para probar callbacks en local usa un túnel HTTPS y configura opcionalmente `VERCEL_BLOB_CALLBACK_URL` según la documentación de Vercel. Guardar el producto utiliza las URLs devueltas por la subida, sin depender del callback.

## Desplegar en Vercel

1. Sube el repositorio a Git y crea un proyecto Vercel con preset Next.js y directorio raíz de este proyecto.
2. Crea/conecta Neon desde Marketplace/Storage. Configura `DATABASE_URL` para producción; usa una rama de Neon separada para previews y desarrollo.
3. Crea/conecta un almacén **público** Vercel Blob. Comprueba que Vercel configure `BLOB_READ_WRITE_TOKEN` en los entornos correspondientes.
4. Añade `WHATSAPP_NUMBER`, `SESSION_SECRET`, `ADMIN_USER` y `ADMIN_PASSWORD_HASH` en Environment Variables. En la interfaz de Vercel pega el hash literal, sin comillas envolventes.
5. Aplica `npm run db:deploy` a la base de producción desde un entorno seguro y ejecuta el seed con esas mismas credenciales (`.env` local temporal o un job seguro). No subas `.env` a Git. Si usas variables de CI, ejecuta `npx tsx scripts/seed.ts` directamente.
6. Despliega con `npm run build`; genera Prisma y compila Next.js. Las migraciones se ejecutan explícitamente, fuera del build, para evitar que previews modifiquen producción.
7. Verifica login, creación/edición, subida de imágenes, catálogo móvil y enlace de WhatsApp con tu número real. Activa la regla de rate limiting de login en Vercel Firewall.

La compilación no necesita conectarse a Neon: las páginas que consultan la base son dinámicas. Para comprobar los flujos con datos y las subidas sí son necesarias las credenciales reales.

Referencias: [Next.js Proxy](https://nextjs.org/docs/app/getting-started/proxy), [Prisma 6](https://www.prisma.io/docs/v6/orm/prisma-schema/overview/data-sources), [Vercel Blob Client Uploads](https://vercel.com/docs/vercel-blob/client-upload).

## Verificación en este entorno

TypeScript, ESLint, las 4 pruebas unitarias y las 6 pruebas de navegador (móvil y escritorio) pasan. La compilación de producción se verificó con `npm run build` (Turbopack) y anteriormente con `npm run build -- --webpack`. Webpack sigue disponible como alternativa si otro entorno restringe los sockets de Turbopack. No se ejecutaron migraciones sobre Neon ni subidas reales sin credenciales.

`npm audit` reporta un aviso alto de agotamiento de pila en `deepmerge-ts <8`, transitivo del CLI de Prisma 6 (`@prisma/config`). El proyecto no acepta configuración de Prisma de usuarios; evita cargar configuraciones externas no confiables. No se aplicó `audit fix --force`, que propone cambiar la versión del ORM. Revisa este aviso al actualizar Prisma.

Las pruebas de navegador de `tests/browser` verifican navegación, ausencia de enlaces administrativos en la portada, búsqueda, ordenamiento, protección de rutas, persistencia del carrito y enlace de WhatsApp. Se ejecutan en móvil y escritorio. Para repetirlas, deja libre el puerto 3200:

```sh
npx playwright install chromium
npm run build -- --webpack
npm run test:e2e
```

La configuración de pruebas inicia el servidor sin base de datos y con un número de WhatsApp ficticio. Los datos de carrito son locales de prueba y nunca se envían a WhatsApp.

## Diseño de la tienda

La interfaz pública está orientada exclusivamente a clientes: colección, guía de compra y pedido. El administrador entra directamente en `/admin/login`; no hay enlaces administrativos en la cabecera ni el pie.

Se utiliza [Motion para React](https://motion.dev/docs/react-installation) para las entradas de secciones y el contador del carrito, con soporte de movimiento reducido. Los iconos son Lucide. La búsqueda, las categorías y el ordenamiento se procesan en el servidor mediante parámetros de URL.

`public/images/editorial-hats.webp` es una imagen editorial generada, optimizada a unos 152 KB: no representa un producto disponible ni se usa como foto de producto. Las tarjetas muestran únicamente productos activos de la base de datos y sus imágenes reales. Si falla la conexión, la portada sigue disponible y presenta un mensaje al cliente sin detalles técnicos.
