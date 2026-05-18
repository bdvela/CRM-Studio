# Especificación: HU-38 — Vista Limitada para Staff

## Historia de usuario
Como miembro del staff de un negocio, quiero acceder a la plataforma con mi propia cuenta para ver mi agenda y mis comisiones, sin tener acceso a información sensible de otros miembros o del negocio.

## Descripción
Los usuarios con rol `staff` ven una versión reducida de la app. Pueden ver su propia agenda de citas y sus propias comisiones. No tienen acceso a reportes financieros globales, pagos de otros, configuración del negocio ni gestión del equipo. Owner y admin tienen acceso completo a todos los módulos. Las restricciones son aplicadas tanto en el routing como en la UI.

## Actores
- **Staff**: miembro del equipo con rol `staff`
- **Admin**: acceso completo excepto gestión de equipo avanzada
- **Owner**: acceso total sin restricciones

## Precondiciones
- El usuario aceptó una invitación y tiene `business_members.role = 'staff'`
- Tiene un `staff_id` vinculado en `business_members`

## Módulos y acceso por rol

| Módulo | Owner | Admin | Staff |
|--------|-------|-------|-------|
| Dashboard (KPIs completos) | ✅ | ✅ | ❌ redirige a /mis-citas |
| Citas (todas) | ✅ | ✅ | Solo las propias (donde es artista) |
| Crear/editar citas | ✅ | ✅ | ❌ |
| Clientes | ✅ | ✅ | ❌ |
| Servicios | ✅ | ✅ | Solo lectura |
| Staff (listado y edición) | ✅ | ✅ | ❌ |
| Pagos (todos) | ✅ | ✅ | ❌ |
| Comisiones (reporte global) | ✅ | ✅ | Solo propias |
| Equipo (/equipo) | ✅ Solo owner | ❌ | ❌ |
| Avanzar estado de cita propia | ✅ | ✅ | ✅ |

## Flujo principal — Staff entra a la app

1. Staff navega a `https://<slug>.crm.example.com`
2. Middleware verifica membresía → rol `staff`
3. Redirect automático a `/mis-citas` (no al Dashboard completo)
4. Sidebar muestra solo: Mis Citas, Mis Comisiones
5. Staff ve su agenda personal: citas donde `artist_id = su staff_id`
6. Staff puede marcar una cita como en_curso o completada
7. En "Mis Comisiones": ve solo las filas de comisión correspondientes a su `staff_id`

## Flujos alternativos / casos borde

- **Staff intenta acceder a `/clientes` directamente**: redirect a `/mis-citas` con toast "No tenés acceso a este módulo"
- **Staff sin `staff_id` vinculado**: muestra página de error "Tu cuenta no está vinculada a un perfil de staff. Contactá al administrador."
- **Staff con citas en varios estados**: ve todas sus citas (programadas, en_curso, completadas, canceladas) pero no puede crear ni eliminar
- **Admin accede a todo excepto /equipo**: ve todos los módulos; la opción "Equipo" no aparece en el sidebar para admin
- **Owner accede a /equipo**: ve lista completa de miembros, estado de invitaciones, y puede gestionar roles

## Reglas de negocio

- `staff` solo ve datos donde `artist_id = su staff_id` (filtro en queries + RLS como respaldo)
- `staff` puede cambiar el estado de una cita propia (en_curso ↔ completada) pero no puede crear ni eliminar
- `admin` tiene acceso de lectura/escritura a todos los módulos de negocio excepto gestión de equipo (`/equipo`)
- `owner` no puede ser eliminado ni degradado de rol por ningún miembro
- El sidebar se adapta dinámicamente según el rol — no hay links visibles a módulos inaccesibles
- RLS en la base de datos actúa como segunda capa de seguridad (staff no puede hacer bypass vía API directa)

## Criterios de aceptación

- [ ] Staff logueado es redirigido a `/mis-citas`, no al dashboard completo
- [ ] Sidebar de staff muestra solo "Mis Citas" y "Mis Comisiones"
- [ ] `/mis-citas` muestra solo citas donde el staff es el artista asignado
- [ ] Staff puede marcar su cita como en_curso o completada
- [ ] Staff no puede crear, editar ni eliminar citas
- [ ] Acceso directo a rutas protegidas redirige con mensaje de error
- [ ] "Mis Comisiones" muestra solo comisiones del staff logueado
- [ ] Staff sin `staff_id` vinculado ve pantalla de error con instrucciones
- [ ] Admin ve todos los módulos excepto `/equipo` en el sidebar
- [ ] Owner ve todos los módulos incluyendo `/equipo`
- [ ] RLS bloquea queries directas de staff a datos de otros

## Fuera de alcance
- Staff puede ver el perfil de otros compañeros (post-MVP)
- Notificaciones push para staff de nuevas citas asignadas (post-MVP)
- App mobile nativa para staff (PWA es suficiente para MVP)
- Staff puede editar sus propios datos de perfil (post-MVP)
