# Google y administrador designado

La entrada al panel permanece pública en modo demostración. El enlace «Acceso opcional · correo o Google» abre `/login`. El botón de Google está debajo del formulario de correo y se habilita cuando Supabase confirma que el proveedor está activo. No se presenta una integración deshabilitada como funcional.

## Configuración pendiente

1. En Google Cloud crea un cliente OAuth de tipo aplicación web. Origen autorizado: `https://zeroclips.vercel.app`.
2. Añade como URI de redirección el callback de Supabase indicado en Authentication → Sign In / Providers → Google (formato `https://PROJECT_REF.supabase.co/auth/v1/callback`).
3. Guarda el Client ID y Client Secret en ese proveedor de Supabase y habilítalo. El secreto de Google no va al repositorio ni al navegador.
4. En Supabase configura Site URL `https://zeroclips.vercel.app` y permite `https://zeroclips.vercel.app/auth/callback` y `http://localhost:3000/auth/callback` para desarrollo.
5. Si el cliente de Google está en pruebas, autoriza las cuentas de prueba en su pantalla de consentimiento.
6. Aplica las migraciones de ZEROCLIPS. El trigger de Auth crea el perfil de miembro al crear el usuario.

Fuente oficial consultada el 23 de septiembre de 2026: [Supabase: Sign in with Google](https://supabase.com/docs/guides/auth/social-login/auth-google). La aplicación inicia OAuth mediante PKCE y cambia el código por una sesión desde `/auth/callback`; el destino final es fijo, sin redirecciones externas proporcionadas por el usuario.

## Asignación de administrador

`ZEROCLIPS_ADMIN_EMAIL` contiene el correo exacto autorizado por el propietario. Es una variable de servidor y no se publica en el código. Para la asignación automática, configura también `SUPABASE_SERVICE_ROLE_KEY` como secreto de servidor en Vercel.

Después de iniciar sesión por correo o Google, el servidor llama `auth.getUser()`. Solo si su correo verificado coincide exactamente con el configurado, el perfil existe y está activo, se actualiza su rol a administrador. No se usan campos del formulario ni `user_metadata` para conceder privilegios. No se reactivan usuarios deshabilitados. Las consultas y escrituras operativas siguen utilizando el cliente individual con RLS; la clave privilegiada se limita a esa asignación de rol.

Si falta la base, el perfil o la credencial de servidor, se informa de la configuración pendiente sin afirmar que la cuenta ya sea administradora. También se puede asignar el rol manualmente desde SQL Editor a un UUID comprobado, como explica README, sin configurar service_role en Vercel.

La vista previa permanece aislada aunque alguien inicie sesión opcionalmente. Para operar sobre Supabase hay que desactivar `ZEROCLIPS_PREVIEW_MODE` y volver a desplegar después de configurar base, roles y proveedor.
