# Especificación: HU-37 — Invitaciones de Equipo

## Historia de usuario
Como dueño o admin de un negocio, quiero invitar a los miembros de mi staff a la plataforma para que puedan acceder con sus propias cuentas y ver su información.

## Descripción
El owner o admin puede invitar a un miembro del equipo vinculándolo a un registro de staff existente, asignándole un rol (admin o staff) y enviando un link de invitación por email. El invitado puede crear una cuenta nueva o vincular una cuenta existente. Al aceptar, queda como miembro del negocio con el rol asignado. Un mismo email puede pertenecer a múltiples negocios (artista que trabaja en dos salones).

## Actores
- **Owner / Admin**: quien envía la invitación
- **Invitado (nuevo o existente)**: quien la recibe y acepta

## Precondiciones
- El registro de staff del miembro existe previamente en la tabla `staff` del negocio (el owner lo crea primero desde el módulo de Staff)
- El owner/admin está autenticado en el subdominio del negocio

## Flujo principal — Enviar invitación

1. Owner/admin va a `/equipo` → sección "Invitar miembro"
2. Completa:
   - **Staff**: selector que muestra solo los staff del negocio sin cuenta de usuario vinculada
   - **Email** de la persona (pre-llenado si el staff tiene email, editable)
   - **Rol**: Admin o Staff (radio buttons; default: Staff)
3. Presiona "Enviar invitación"
4. Sistema inserta en tabla `invitations`, llama a Supabase `auth.admin.inviteUserByEmail` vía route handler
5. Se muestra confirmación: "Invitación enviada a [email]"
6. El registro aparece en la lista de invitaciones pendientes con estado "Pendiente" y fecha de expiración

## Flujo principal — Aceptar invitación

1. Invitado recibe email con link `https://<slug>.crm.example.com/invite/<token>`
2. Si NO tiene cuenta: ve formulario de contraseña (email pre-llenado, readonly), crea cuenta
3. Si YA tiene cuenta: se le pide que inicie sesión (el link lo reconoce automáticamente si ya está logueado)
4. Sistema llama a RPC `accept_invitation(token)`:
   - Verifica token válido y no expirado
   - Inserta `business_members` con el rol de la invitación
   - Marca la invitación como aceptada
5. Redirect al dashboard del negocio: `https://<slug>.crm.example.com/`

## Flujos alternativos / casos borde

- **Token expirado** (>7 días): muestra "Esta invitación expiró. Pedile al dueño que te envíe una nueva."
- **Token ya usado**: muestra "Esta invitación ya fue aceptada."
- **Email ya es miembro del negocio**: `accept_invitation` hace `ON CONFLICT DO NOTHING`, se muestra mensaje "Ya sos miembro de este negocio"
- **Invitación reenviada**: owner puede reenviar email desde la lista de pendientes (regenera token, extiende expiración 7 días más)
- **Invitación cancelada**: owner puede revocar una invitación pendiente (soft-delete o elimina el registro)
- **Staff ya tiene cuenta vinculada**: el selector de staff en el formulario de invitación oculta a quienes ya tienen `business_members` row

## Reglas de negocio

- Solo owner puede gestionar el equipo (ver `/equipo`, invitar, revocar, cambiar roles)
- Admin puede invitar con rol `staff` solamente — no puede crear otros admins
- Los links de invitación expiran a los 7 días
- Un mismo email puede aceptar invitaciones de múltiples negocios (membresías múltiples)
- El staff debe existir como registro en la tabla `staff` antes de poder ser invitado (no se crea desde el flow de invitación)
- Al aceptar, si el invitado ya tenía cuenta Supabase, se vincula su `auth.uid()` existente (no se crea cuenta duplicada)

## Criterios de aceptación

- [ ] Formulario de invitación disponible en `/equipo` solo para owner
- [ ] Selector de staff muestra solo miembros sin cuenta vinculada
- [ ] Email de invitación enviado correctamente con el link
- [ ] Token funciona una sola vez y expira a los 7 días
- [ ] Invitado sin cuenta puede crear su contraseña desde el link
- [ ] Invitado con cuenta existente es redirigido al login y luego acepta automáticamente
- [ ] Post-aceptación: member row creado con rol correcto, redirect al dashboard
- [ ] Token expirado o usado muestra mensaje claro con CTA
- [ ] Lista de invitaciones pendientes visible en `/equipo` con opción de reenviar/revocar
- [ ] Admin solo puede invitar con rol `staff`, no `admin`

## Fuera de alcance
- Notificaciones in-app de invitación (solo email)
- Invitar a alguien que todavía no tiene registro de staff (debe crearse el staff primero)
- Cambio de rol de un miembro después de aceptada la invitación (post-MVP)
- Eliminación de miembro del equipo (post-MVP)
