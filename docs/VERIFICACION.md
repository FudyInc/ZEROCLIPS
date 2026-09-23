# Verificación de la entrega

Fecha: 22 de septiembre de 2026. No se utilizaron credenciales del proyecto Supabase del propietario.

- TypeScript: `npm run typecheck`, aprobado.
- Pruebas unitarias: 8 casos en `tests/core.test.ts`, aprobados. CSV, inyección de fórmulas, importes exactos, validación, zonas horarias y rechazo de acciones MDM sin proveedor.
- PostgreSQL local: 17 comprobaciones en `scripts/test-db.ts`, aprobadas sobre PGlite y la migración real. Incluyen acceso anónimo denegado; metadatos sin elevación de rol; duplicados; recepción parcial e idempotente; rollback completo; entrega incompatible; permisos por registro; flujo tarea/clip/incidencia; costos separados; reparación única; historial; desactivación; eliminación de sesiones y persistencia tras reabrir la base.
- Compilación de producción: `npm run build`, aprobada.
- Navegador: 2 recorridos Playwright, escritorio y móvil, aprobados sobre compilación de producción y servicio Supabase simulado aislado. Incluyen redirección de sesión, formulario de acceso, panel, filtros, ficha y QR, navegación por secciones, ausencia de desbordamiento en configuración y cierre de sesión. Capturas locales en `test-results/`, excluidas de Git.

Los tests iniciales en modo desarrollo detectaron un error de medición de rendimiento del entorno React/Chromium y un timeout de primera compilación. El recorrido se verificó luego contra la compilación de producción, sin excepciones del navegador.

## Pendiente en servicios reales

- Crear/conectar el proyecto Supabase, aplicar migración y probar Auth, SMTP/invitaciones y recuperación con cuentas reales.
- Ejecutar recepción y asignación simultáneas desde conexiones PostgreSQL independientes. La implementación utiliza bloqueos de fila, transacciones e índice único; la prueba local verificó conflictos secuenciales y restricciones, no concurrencia multiconexión.
- Importar el repositorio en Vercel, configurar variables, dominios y HTTPS, y verificar los QR desde teléfonos reales.
- Elegir y contratar MDM/EMM, verificar elegibilidad, inscripción y capacidades antes de desarrollar un proveedor real.

No se afirma que la aplicación esté desplegada ni conectada a Supabase por el hecho de pasar las pruebas locales.
