# ZEROCLIPS

Aplicación en español para administrar flota iOS/Android y operaciones de clipping. Next.js 16 + TypeScript, Supabase PostgreSQL/Auth y despliegue en Vercel. Se eligió este stack porque el repositorio estaba vacío y el propietario dispone de Supabase, GitHub y Vercel.

## Inicio local

Requiere Node.js 22 y npm. Usa `.nvmrc` si tienes nvm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Abre http://localhost:3000. Sin variables Supabase verás la pantalla de configuración, sin datos inventados. El paquete de Node 22 en desarrollo facilita comprobaciones en entornos cuyo Node global es anterior; en producción configura Node 22.

## Supabase: base y autenticación

1. Crea un proyecto separado para producción. Guarda URL y clave **publicable** en `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dentro de `.env.local`.
2. Aplica `supabase/migrations/202609220001_core.sql` con SQL Editor a una base nueva. Alternativa: Supabase CLI (`supabase login`, `supabase link --project-ref TU_REFERENCIA`, `supabase db push`). No aplicar de nuevo manualmente una migración ya ejecutada.
3. En Authentication desactiva el registro público, conserva acceso por invitación y configura SMTP para correos reales. Supabase gestiona hashing, sesiones y límites de autenticación. Activa políticas de contraseña adecuadas en el proyecto.
4. Configura Site URL y URL permitidas de redirección para el dominio real y `http://localhost:3000/auth/confirm` en desarrollo.
5. En la plantilla de correo **Invite user**, utiliza este enlace para verificar el token en servidor:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite">Activar mi acceso</a>
```

6. Temporalmente configura `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` (nunca `NEXT_PUBLIC_`). Ejecuta:

```bash
npm run user:create -- propietario@empresa.com "Nombre del dueño" administrador
npm run user:create -- operador@empresa.com "Nombre operador" operador
```

El script envía una invitación; no escribe contraseñas predeterminadas. La clave privilegiada solo se usa para aprovisionamiento, no para consultas operativas. Puedes quitarla después: la aplicación funciona con la clave publicable y las sesiones individuales.

7. Abre el correo, establece contraseña y accede. Los siguientes roles se modifican desde Equipo por un administrador. Una desactivación requiere devolver equipos, revoca sesiones de refresco y RLS bloquea tokens anteriores.

**Alternativa inicial sin correo**: desde Supabase Authentication crea manualmente un usuario con contraseña segura; su perfil se crea automáticamente como operador. En SQL Editor promueve únicamente el UUID correcto:

```sql
update public.members set role = 'administrador' where id = 'UUID-DEL-DUEÑO';
```

No habilites acceso público ni uses una cuenta compartida. Para recuperación, el administrador puede enviar un correo desde Supabase; usa la plantilla equivalente con `type=recovery` y el mismo endpoint.

## Despliegue en Vercel

Importa `FudyInc/ZEROCLIPS` desde GitHub. Framework: Next.js; directorio raíz: raíz del repositorio; Node: 22.x. Instalar: `npm ci`; compilar: `npm run build`. Configura en Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL=https://tu-dominio` (usado para los QR)

No necesitas service_role en Vercel para la aplicación. Aplica la migración antes de usar el despliegue. Actualiza Site URL, invitaciones y redirecciones en Supabase. Vercel proporciona HTTPS. Cada Preview debe usar un proyecto Supabase de pruebas separado si se van a escribir datos. Las migraciones de producción no se ejecutan automáticamente en cada build.

## Recorrido de aceptación

1. Invita a un operador. Crea un proyecto y autorízalo como miembro.
2. Crea una compra con cantidad, presupuesto y moneda. Cada registro de compra representa una línea/modelo; usa registros separados para distintos modelos.
3. En «Recibir dispositivos», registra una línea por unidad con código único, costo real y fecha. Se admite recepción parcial; la recepción completa se revierte si falla una unidad.
4. En Asignaciones entrega un equipo disponible al operador y proyecto. Registra devolución desde la misma pantalla antes de reasignar, enviar a mantenimiento o dar de baja.
5. Crea un perfil autorizado ligado al proyecto y responsable; si seleccionas dispositivo, debe estar asignado a ambos.
6. Crea una tarea con vencimiento en la zona configurada. Crea un clip con material; al publicarlo registra URL y fecha efectiva. Las métricas son observaciones manuales con fuente y fecha.
7. Registra una incidencia. Supervisor o administrador la resuelve con descripción y costo opcional; el gasto se registra una sola vez. Consulta ficha de equipo para asignaciones, perfiles, incidencias, costos y bitácora.
8. Reinicia el servidor: los datos siguen en Supabase. Ingresa con otro operador: RLS impide acceder a recursos ajenos incluso mediante API directa.

## Seguridad y modelo

- `members`, `projects`, `project_members`, `devices`, `assignments`, `purchases`, `receipts`, `accounts`, `tasks`, `clips`, `metrics`, `incidents`, `expenses`, `audit`, `settings`.
- Todas las tablas públicas tienen RLS. Usuarios autenticados reciben lectura filtrada; no escritura directa. `operate` y `receive_purchase` validan rol y relaciones, y ejecutan cada operación en una transacción. Campos monetarios separados de inventario para no enviarlos a operadores.
- Administrador: todo. Supervisor: operación y costos sin roles/configuración. Operador: recursos asignados/autorizados, cambios de estado de tareas y clips propios, métricas propias y reporte de incidencias. Perfiles: autorización explícita por responsable.
- Roles proceden de `members`, nunca de metadatos editables. Cada solicitud valida usuario con Supabase Auth y consulta perfil activo. Server Actions aplican las verificaciones de origen de Next.js; no hay rutas mutables GET (salvo callback de verificación de token de invitación).
- Código, serie e IMEI únicos; una entrega activa por equipo mediante índice parcial y bloqueo de fila. Recepciones identificadas por UUID y carga idéntica para reintentos. Costos exactos `numeric`, CLP sin fracciones, USD/EUR con dos decimales. Sin conversión automática.
- Instantes en UTC; fechas civiles SQL `date`; vistas y formularios en zona IANA configurable. Horas ambiguas/inexistentes se rechazan. La bitácora registra cambios en servidor sin credenciales.
- Importación: máximo 1 MB y 500 filas, prevalidación y errores por fila; confirmación revalida y cada fila válida es atómica. Si una fila falla por concurrencia se informa sin perder las ya guardadas. Exportación con escape de fórmulas y permisos.
- Notas de inventario son **operativas y visibles al operador asignado**. No escribir información confidencial allí. No existen campos para contraseñas de redes sociales.
- Lista de inventario filtra y pagina todos los registros autorizados descargados; el servidor lee en bloques de 1.000 para no truncar por el límite de PostgREST. Para flotas grandes, migrar búsqueda y agregación a consultas SQL paginadas.

## Verificaciones

```bash
npm run typecheck
npm test
npm run test:db
npm run build
npm run test:ui
```

Las pruebas de base usan PGlite, motor PostgreSQL local, aplicando la migración real con esquemas y roles Auth de prueba. Prueban reglas de acceso, duplicados, recepciones, gastos, estados e historial, y cierran/reabren una base en disco. **No sustituyen una prueba del servicio Supabase Auth ni de concurrencia con conexiones PostgreSQL independientes.**

Las pruebas de navegador usan un servicio Supabase simulado **exclusivo de tests**, sin credenciales ni datos reales. Verifican navegación, formularios, vistas y cierre de sesión. Instala Chromium con `npx playwright install chromium` o define `PLAYWRIGHT_CHROMIUM_EXECUTABLE` apuntando a un Chromium compatible. No conectes este fixture a despliegues.

Antes de producción, completa en un proyecto Supabase de pruebas: invitación real, SMTP, inicio/cierre de sesión y expiración, dos recepciones/asignaciones concurrentes desde conexiones independientes, y revisión de redirecciones y dominios. No se reportan esos servicios como verificados sin credenciales.

## Datos de demostración opcionales

Utiliza **otro proyecto Supabase**, aplica la migración, configura su `.env.local` y ejecuta:

```bash
ZEROCLIPS_DEMO_DATABASE=YES_ISOLATED_DEMO npm run demo
```

Inserta dos equipos rotulados DEMO únicamente si el inventario está vacío. Nunca se ejecuta automáticamente. Los fixtures de pruebas no se cargan en producción.

## Gestión de teléfonos

No hay MDM conectado. No se simulan instalación de apps, control remoto, telemetría ni publicación social. Batería y almacenamiento libre se introducen manualmente y conservan fuente y fecha. Contrato y requisitos oficiales en [docs/MDM.md](docs/MDM.md).
