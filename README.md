# Arias · Catálogo mayorista

Nombre comercial: **Arias**. Empresa: **Coorporacion Global Arias G&L**.

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

Reinicia el servidor de desarrollo después de cambiar `.env`. El seed requiere un hash bcrypt válido. El catálogo se llena creando productos desde `/login`; el seed no inserta productos de muestra.

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

El seed lee `.env` y crea/actualiza un solo administrador con ID fijo (`owner`); no carga productos ficticios. Vuelve a ejecutarlo para cambiar usuario o contraseña. Entra en `/login` y crea los productos reales. Si no existe `DATABASE_URL`, la portada muestra un estado de preparación; no se sustituye una conexión fallida por datos de muestra.

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
  schema.prisma                  # Producto, ImagenProducto, Admin y Cliente
  migrations/                    # Migración inicial SQL
app/
  (tienda)/layout.tsx             # Cabecera y pie del ecommerce
  (tienda)/page.tsx               # Catálogo y categorías
  (tienda)/producto/[id]/page.tsx  # Detalle
  (tienda)/carrito/page.tsx        # Carrito persistido en el navegador
  admin/layout.tsx               # Panel independiente protegido
  admin/page.tsx                  # Resumen del catálogo
  admin/login/page.tsx
  admin/productos/page.tsx
  admin/productos/nuevo/page.tsx
  admin/productos/[id]/editar/page.tsx
  admin/actions.ts               # Mutaciones protegidas de productos
  login/actions.ts               # Acceso, registro y cierre de sesión
  api/upload/route.ts             # Autorización de subida a Blob
components/                      # Galería, carrito, formularios e imágenes
lib/                             # Prisma, sesión, validaciones y cálculos
proxy.ts                         # Protección previa de /admin/*
scripts/                         # Seed de administrador y hash de contraseña
tests/                           # Sesiones, validaciones y WhatsApp
```

Next.js 16 renombró `middleware.ts` a `proxy.ts`. El proxy verifica la cookie firmada y las consultas/mutaciones administrativas comprueban además que el administrador exista en la base. La cookie es HttpOnly, SameSite=Lax, Secure en producción y caduca a las 8 horas. Las Server Actions tienen la comprobación de origen de Next.js; la autorización de subida comprueba origen y sesión. Configura una regla de rate limiting en el firewall de Vercel para `POST /login` y `POST /registro` antes de exponer el acceso públicamente. Cambiar `SESSION_SECRET` invalida todas las sesiones existentes.

## Precios y pedidos

- Los tres precios corresponden al **paquete completo**, no a una unidad. Cada tarjeta del catálogo muestra el precio y las unidades de media docena, docena y caja. “Elegir y agregar” abre el detalle para seleccionar la presentación y agregarla al carrito.
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

TypeScript, ESLint, las 5 pruebas unitarias y las 6 pruebas de navegador (móvil y escritorio) pasan. La compilación de producción se verificó con `npm run build` (Turbopack) y anteriormente con `npm run build -- --webpack`. Webpack sigue disponible como alternativa si otro entorno restringe los sockets de Turbopack. Se aplicó la migración de clientes a la base configurada y se verificaron login de administrador, registro/login de cliente y bloqueo del panel para clientes. La cuenta temporal de prueba fue eliminada. Las subidas de imágenes no se verificaron en esta revisión.

`npm audit` reporta un aviso alto de agotamiento de pila en `deepmerge-ts <8`, transitivo del CLI de Prisma 6 (`@prisma/config`). El proyecto no acepta configuración de Prisma de usuarios; evita cargar configuraciones externas no confiables. No se aplicó `audit fix --force`, que propone cambiar la versión del ORM. Revisa este aviso al actualizar Prisma.

Las pruebas de navegador de `tests/browser` verifican navegación, ausencia de enlaces administrativos en la portada, búsqueda, ordenamiento, protección de rutas, persistencia del carrito y formulario de pedido. Se ejecutan en móvil y escritorio. Para repetirlas, deja libre el puerto 3200:

```sh
npx playwright install chromium
npm run build -- --webpack
npm run test:e2e
```

La configuración de pruebas inicia el servidor sin base de datos y con un número de WhatsApp ficticio. Los datos de carrito son locales de prueba y nunca se envían a WhatsApp.

## Diseño de la tienda

La interfaz pública está orientada exclusivamente a clientes: colección, guía de compra y pedido. El administrador entra directamente en `/login`; no hay enlaces administrativos en la cabecera ni el pie.

Se utiliza [Motion para React](https://motion.dev/docs/react-installation) para las entradas de secciones y el contador del carrito, con soporte de movimiento reducido. Los iconos son Lucide. La búsqueda, las categorías y el ordenamiento se procesan en el servidor mediante parámetros de URL.

`public/images/editorial-hats.webp` es una imagen editorial generada, optimizada a unos 152 KB: no representa un producto disponible ni se usa como foto de producto. Las tarjetas muestran únicamente productos activos de la base de datos y sus imágenes reales. Si falla la conexión, la portada sigue disponible y presenta un mensaje al cliente sin detalles técnicos.

## Cuentas y acceso

La entrada común es `/login`. El servidor identifica la cuenta: los administradores entran en `/admin` y los clientes en `/cuenta`. `/admin/login` redirige al nuevo acceso. El registro opcional `/registro` crea exclusivamente clientes. El catálogo y el carrito siguen disponibles sin registrarse; el carrito se conserva en el navegador y los pedidos se coordinan por WhatsApp, sin historial en la cuenta.

Aplica `npm run db:deploy` antes de desplegar esta versión para crear la tabla `Cliente`. No cambia productos ni administradores existentes. El usuario del administrador se obtiene de `ADMIN_USER`; `ADMIN_PASSWORD_HASH` se sincroniza con la base al ejecutar el seed. El login comprueba la contraseña contra la base, no contra `.env`. En Vercel verifica `DATABASE_URL` y un `SESSION_SECRET` de al menos 32 caracteres en el entorno del despliegue.

## Panel administrativo

`/admin` muestra un resumen del catálogo con enlaces a productos publicados y ocultos, un aviso de fotografías pendientes y los últimos productos actualizados. La navegación administrativa es independiente: no incluye cabecera, carrito ni pie de la tienda. En escritorio usa menú lateral; en móvil, navegación superior compacta. `Ver tienda` permite regresar al ecommerce.

Las operaciones siguen verificando la cuenta administrativa en el servidor. Guardar o modificar un producto actualiza también el resumen. Los pedidos registrados conectan ventas, inventario, contabilidad operativa y logística; WhatsApp continúa como canal de coordinación.

`npm run test:admin` comprueba navegación, ausencia de elementos de tienda, adaptación a 320/768/1280 px, cierre de sesión y bloqueo de clientes. Requiere `.env`, un administrador existente identificado por `ADMIN_USER` y el puerto 3202 libre. Usa sesiones de prueba firmadas y consultas de solo lectura: no modifica productos ni cuentas. Ejecutar después de `npm run build`.


### Gestión comercial

El panel incluye Productos, Inventario, Pedidos, Contabilidad, Logística y Configuración, separado de la navegación de la tienda.

- Variantes opcionales por color/talla (hasta 30 por producto), con precios por presentación compartidos. Eliminar una variante del formulario la desactiva y conserva los pedidos históricos.
- Inventario en unidades por producto o variante. Stock vacío significa sin control; cero significa agotado. El umbral permite filtrar existencias bajas. Los ajustes rechazan sobrescribir un stock que cambió mientras el formulario estaba abierto.
- El carrito registra un pedido pendiente y proporciona su código y mensaje para WhatsApp. El servidor verifica productos, variantes, precios y cantidades. Reintentar la misma solicitud no crea otro pedido.
- Confirmar descuenta stock en una transacción; cancelar un confirmado lo devuelve una sola vez. Entregar cierra el pedido. Los pedidos pendientes no reservan unidades. No hay cobro en línea ni verificación automática de pagos.
- Configuración permite cambiar nombre, WhatsApp, contacto y condiciones de envío. Si no hay configuración guardada, se usa `WHATSAPP_NUMBER` del entorno.

Aplica `npm run db:deploy` antes de desplegar: la migración `20260927000000_gestion_comercial` agrega tablas y columnas sin alterar el catálogo existente. Para migraciones en Neon, usa la conexión directa si el pooler falla.

`npm run test:orders` prueba concurrencia, idempotencia, precios, variantes y stock dentro de un esquema temporal aislado; necesita permisos para crear y eliminar dicho esquema. También recorre el formulario de producto, la compra, confirmación/cancelación y configuración en Chromium, contra ese esquema aislado (puerto 3204 libre y compilación previa). No envía mensajes de WhatsApp ni modifica el catálogo o los pedidos reales. `npm run test:admin` comprueba las secciones a 320, 768 y 1280 px con un administrador existente, sin modificar datos.

### Contabilidad operativa y logística integradas

El panel conecta `/admin/contabilidad` y `/admin/logistica` con los pedidos, el inventario y el inicio administrativo. Aplica la migración aditiva `20261003000000_contabilidad_logistica` con `npm run db:deploy` antes de iniciar esta versión. Los pedidos históricos entregados/cancelados conservan el estado equivalente en logística; no se inventan cobros ni fechas de entrega anteriores.

- **Contabilidad:** ventas confirmadas o entregadas vigentes, cobros, gastos, devoluciones, flujo neto de caja y saldos por pedido. Los importes se calculan con decimales. Los indicadores acumulan todo el historial registrado; caja parte de cero, sin saldo inicial importado. No constituye contabilidad fiscal, facturación electrónica, cálculo de impuestos, costo de ventas ni libro de partida doble.
- **Cobros:** abre un pedido confirmado o entregado para registrar un cobro parcial o total con medio, concepto y referencia. El servidor impide superar el saldo, incluso con solicitudes concurrentes. Una clave única evita duplicar el mismo envío; después de guardar, usa “Nuevo formulario” para otro movimiento.
- **Devoluciones:** se registran al realizar la devolución real, hasta el importe cobrado neto. Cancelar devuelve el stock y excluye la venta de los saldos por cobrar, pero no crea un reembolso ficticio: el importe cobrado queda pendiente de devolver y aparece en el inicio y en contabilidad. Los movimientos conservan fecha, usuario y pedido relacionado; no se editan ni eliminan desde el panel.
- **Gastos:** se registran desde contabilidad como salidas de caja, sin crear pedidos ni modificar stock. No representan compras de inventario.
- **Logística:** confirmar un pedido descuenta existencias y lo incorpora a preparación. Para pasarlo a “En camino” se exige dirección y transportista; la guía es opcional. “Marcar como entregado” sincroniza pedido y despacho. Un envío en camino debe regresar a preparación tras verificar su retorno físico antes de cancelarlo y devolver stock. El seguimiento se registra manualmente, sin integración con transportistas externos.
- **Seguridad:** todas las pantallas y acciones exigen administrador. Los movimientos y cambios de estado se validan en el servidor, con transacciones serializables y reintentos ante conflictos.

`npm run test:orders` incluye pruebas de cobros y devoluciones concurrentes, idempotencia, límites de importes, saldos, despacho y entrega. Recorre también los nuevos formularios en Chromium y comprueba contabilidad/logística a 320, 768 y 1280 px. Usa un esquema temporal aislado y lo elimina al terminar; no registra operaciones en los datos reales. `npm run test:admin` incluye la navegación a ambos módulos.
