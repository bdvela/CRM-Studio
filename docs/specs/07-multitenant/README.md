# Módulo 07 — Multi-Tenant SaaS

Specs para la conversión de single-tenant a multi-tenant SaaS. Las HUs de DB (migraciones HU-34 a HU-38) están en `supabase/migrations/`.

## Estado

| HU | Descripción | Estado |
|----|-------------|--------|
| HU-34 | Registro de nuevo negocio (Signup) | ⏳ Pendiente |
| HU-35 | Onboarding de configuración inicial | ⏳ Pendiente |
| HU-36 | Routing por subdominio propio | ⏳ Pendiente |
| HU-37 | Invitaciones de equipo | ⏳ Pendiente |
| HU-38 | Vista limitada para staff | ⏳ Pendiente |
| HU-39 | Branding dinámico | ⏳ Pendiente |
| HU-40 | Identificación de owner por membresía | ⏳ Pendiente |

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
