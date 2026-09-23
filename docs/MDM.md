# Fase 3: gestión técnica real

Consulta de documentación oficial: 22 de septiembre de 2026. Esta fase NO está conectada. ZEROCLIPS administra registros y operación; no toma control de teléfonos.

## Contrato y comportamiento actual

`src/lib/mdm.ts` define `DeviceProvider`, capacidades por plataforma y ejecución asíncrona. `UnconfiguredProvider` informa «pendiente de configuración» y rechaza ejecuciones. `POST /api/mdm` exige sesión y devuelve 409. Nunca interpreta ausencia de conexión como incompatibilidad de iOS o Android.

Una futura implementación debe persistir proveedor, ID externo, inscripción, capacidades verificadas por equipo, última sincronización, errores y solicitudes de comando. «Disponible» requiere credenciales, inscripción y capacidad confirmada. «No compatible» requiere evidencia del proveedor y la modalidad de administración. Agregar colas, webhooks autenticados, reintentos idempotentes y auditoría antes de habilitar comandos.

## Apple

[Apple Deployment: introducción a la gestión de dispositivos](https://support.apple.com/guide/deployment/intro-to-device-management-depc0aadd3fe/web) describe configuración mediante administración de dispositivos. Las capacidades dependen de inscripción, propiedad y supervisión. No equivalen a manejar libremente la pantalla de cualquier iPhone.

[Apple Business: soporte](https://business.apple.com/support) indica que comenzar es gratuito e incluye gestión integrada de dispositivos. Verificar disponibilidad regional y condiciones vigentes antes de contratar; los complementos y la integración con un proveedor distinto no quedan cubiertos automáticamente. No usar como premisa que toda capacidad de Apple Business está disponible mediante una API pública para esta aplicación.

[Enlace de un servicio externo en Apple Business Manager](https://support.apple.com/guide/apple-business-manager/link-a-party-device-management-service-axm1c1be359d/web) y [Automated Device Enrollment](https://developer.apple.com/documentation/automateddeviceenrollment) sirven como referencias para las inscripciones. Confirmar el flujo actual del servicio Apple Business y la elegibilidad de la organización. Gestionar renovaciones de certificados/tokens con el proveedor.

## Android

[Android Management API](https://developers.google.com/android/management/introduction) ofrece gestión mediante políticas y Android Device Policy. [Inscripción y aprovisionamiento](https://developers.google.com/android/management/provision-device) distingue perfiles de trabajo, dispositivos corporativos y dispositivos dedicados; la propiedad y modalidad determinan alcance.

[Uso permitido](https://developers.google.com/android/management/permissible-usage) restringe el servicio a categorías de proveedores elegibles. ZEROCLIPS no debe asumir que una empresa que administra su propia flota puede usar directamente la API de producción. Contratar un EMM elegible o verificar aprobación y cuotas antes de desarrollar ese adaptador.

## Matriz de investigación y requisitos pendientes

| Capacidad | Apple | Android | Requisito antes de habilitar |
| --- | --- | --- | --- |
| Inventario técnico | Depende de consultas soportadas e inscripción | Depende del reporte y modalidad | Confirmar campos y frecuencia; no prometer tiempo real |
| Batería y almacenamiento | Verificar campo concreto con proveedor | Verificar datos de reporte autorizados | Persistir fecha y fuente; ausentes como «Sin datos» |
| Instalar aplicaciones | Gestión de apps y condiciones de supervisión/licencias | Políticas y catálogo administrado | Perfil empresarial, licencias y prueba en equipo real |
| Borrado | Comando sujeto a inscripción y restricciones | Sujeto a modalidad y comando admitido | Confirmación explícita, alcance y auditoría |
| Control remoto interactivo | No se garantiza mediante MDM genérico | Depende del EMM, fabricante y consentimiento | Evaluación específica; no implementado |

Costos: ZEROCLIPS no tiene proveedor contratado ni precio por dispositivo verificado. Cotizar licencias EMM/MDM para la flota mixta, planes mínimos, soporte, impuestos, aplicaciones pagadas y conectividad. Presupuestar además infraestructura, implementación y mantenimiento del adaptador. No afirmar que Android Management API elimina costos de EMM o que una cuota autorizada equivale a un servicio sin costo.

La aplicación administrativa puede desplegarse sin ninguno de estos requisitos técnicos.
