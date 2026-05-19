# Módulo 07 — Multi-Tenant SaaS

Specs para la conversión de single-tenant a multi-tenant SaaS. Las HUs de DB (migraciones HU-34 a HU-38) están en `supabase/migrations/`.

## Estado

| HU | Descripción | Estado |
|----|-------------|--------|
| HU-34 | Registro de nuevo negocio (Signup) | ✅ Implementado DB |
| HU-35 | Onboarding de configuración inicial | ⏳ Pendiente |
| HU-36 | Routing por subdominio propio | ⏳ Pendiente |
| HU-37 | Invitaciones de equipo | ✅ Implementado DB |
| HU-38 | Vista limitada para staff | ⏳ Pendiente |
| HU-39 | Branding dinámico | ✅ Implementado DB (RPC) |
| HU-40 | Identificación de owner por membresía | ✅ Implementado DB |

## Implementación de Base de Datos

Las siguientes migraciones ya han sido aplicadas, estableciendo la base de datos para la funcionalidad multi-tenant:

*   **HU-34-add-businesses-and-members.sql**: Establece la fundación multi-tenant. Crea las tablas `businesses`, `business_members` (para vincular negocios con usuarios y staff), `invitations` (para invitaciones a negocios), y el `member_role` ENUM. Incluye funciones de ayuda RLS (`current_business_id`, `is_member_of`, `member_role_in`) y funciones RPC para `create_business_with_owner` (signup), `accept_invitation` y `get_business_branding` (para branding público antes de autenticación).
*   **HU-35-add-business-id-columns.sql**: Añade la columna `business_id` (nullable inicialmente) a todas las tablas de datos de negocio (`clients`, `staff`, `appointments`, `appointment_services`, `services`, `payments`, `staff_specialties`, `staff_services`, `staff_commission_overrides`). Se han añadido índices de rendimiento compuestos.
*   **HU-36-tenant-aware-commission-view.sql**: Reemplaza la vista `commission_details` para ser consciente del tenant, identificando al propietario por `business_members.role = 'owner'` y añadiendo la columna `artist_is_owner`.
*   **HU-38-migrate-ara-to-tenant.sql**: Migra los datos existentes de "Araceli Zevallos" al primer tenant. Crea el negocio "Ara Zevallos Studio", rellena `business_id` en todas las tablas con el ID de este negocio y vincula el registro de staff de Ara y su usuario de autenticación como `owner` del nuevo negocio.
*   **HU-37-tenant-rls-cutover.sql**: Realiza el "cutover" de RLS para el tenant. Primero, valida que no haya filas sin `business_id`. Luego, aplica `NOT NULL` a la columna `business_id` en todas las tablas de datos de negocio. Elimina las políticas RLS globales anteriores (`auth_*`) y aplica nuevas políticas RLS aisladas por tenant para todas las tablas de datos de negocio, permitiendo `SELECT` a cualquier miembro del negocio, y `INSERT`/`UPDATE`/`DELETE` solo al `owner`/`admin` (con una excepción para staff en `appointments`). También configura políticas para las tablas `businesses`, `business_members` e `invitations`, y actualiza la función `eval_client_inactivity()` para que sea de ámbito tenant.

## Dependencias de implementación

```
DB Migraciones (ya commiteadas en feat/multitenant):
  HU-34-sql → HU-35-sql → HU-36-sql → HU-38-sql → HU-37-sql (cutover)

Frontend (orden sugerido):
  HU-40 → HU-39 → HU-36 → HU-34 → HU-35 → HU-37 → HU-38
  (owner logic)  (branding) (routing) (signup) (onboarding) (invites) (staff view)
```

## Decisiones arquitectónicas

- `roles` y `categories` son **globales** — sin `business_id`. Son enums del sistema.
- Cookie de sesión con `domain=.crm.example.com` para funcionar en todos los subdominios.
- Staff como auth users desde día 1 (no post-MVP).
- MVP sin billing/Stripe — solo aislamiento de datos.
- Subdominio por tenant (no path-based routing).
