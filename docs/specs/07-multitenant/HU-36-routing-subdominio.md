# Especificación: HU-36 — Routing por Subdominio Propio

## Historia de usuario
Como dueño de un negocio, quiero que mi instancia de la app tenga su propio subdominio (ej: `minegocio.crm.com`) para que el acceso sea exclusivo a mi negocio y los datos estén aislados.

## Descripción
El sistema identifica el negocio a partir del subdominio en el `host` del request. Cada subdominio mapea 1:1 con un slug en la tabla `businesses`. El middleware resuelve el negocio, verifica que el usuario tenga membresía, e inyecta el contexto del tenant en el request. Si el subdominio no existe o está inactivo, se muestra una página de error amigable.

## Actores
- **Cualquier usuario** que accede a un subdominio
- **Sistema / Middleware**: resuelve el tenant y gestiona el acceso

## Precondiciones
- DNS wildcard configurado: `*.crm.example.com` apunta al servidor
- El negocio existe y está activo (`businesses.active = true`)

## Flujo principal

1. Usuario navega a `https://minegocio.crm.example.com/citas`
2. Middleware extrae el slug `minegocio` del `host` header
3. Middleware consulta `businesses` por `slug = 'minegocio'`
4. Si el negocio existe y está activo:
   a. Si el usuario NO está autenticado → redirect a `/login`
   b. Si el usuario está autenticado pero NO tiene membresía en este negocio → redirect a `/login?error=no_access`
   c. Si el usuario está autenticado y tiene membresía → request pasa con headers `x-business-id`, `x-member-role`, `x-business-slug` inyectados
5. Las páginas del negocio cargan correctamente con los datos del tenant

## Flujos alternativos / casos borde

- **Subdominio inexistente**: muestra `/tenant-not-found` — página con mensaje "Este negocio no existe" y link a `crm.example.com` (registro)
- **Negocio inactivo** (`businesses.active = false`): misma pantalla de tenant-not-found
- **Root domain sin subdominio** (`crm.example.com`): solo muestra páginas públicas: `/`, `/signup`, `/login`. Rutas protegidas redirigen a `/signup`
- **Subdominios reservados** (`www.crm.example.com`, `api.crm.example.com`, etc.): redirigen al root domain
- **Usuario con múltiples negocios**: puede estar en `negocio-a.crm.com` y `negocio-b.crm.com` simultáneamente en distintas pestañas. La sesión de auth es compartida (cookie con dominio `.crm.example.com`) pero el contexto de negocio es por pestaña (subdominio del host)
- **Dev local**: subdominio `ara.localhost:3000` funciona nativamente en browsers modernos. Fallback: variable de entorno `NEXT_PUBLIC_DEV_TENANT_SLUG=ara`

## Reglas de negocio

- Un subdominio = un negocio. No hay negocio sin subdominio.
- La cookie de sesión tiene dominio `.crm.example.com` para ser válida en todos los subdominios
- El middleware NO permite acceso a datos de negocio A desde el subdominio de negocio B, incluso si el usuario es miembro de ambos
- Slugs reservados bloqueados: `www`, `app`, `api`, `admin`, `auth`, `static`, `assets`, `mail`, `billing`, `support`
- El negocio es identificado por slug en la URL, no por el usuario logueado

## Criterios de aceptación

- [ ] Acceder a `<slug>.crm.example.com` con slug existente carga la app del negocio correcto
- [ ] Usuario no autenticado en subdominio → redirect a `/login` (en ese subdominio)
- [ ] Usuario autenticado sin membresía → redirect con mensaje de error
- [ ] Subdominio inexistente → página `/tenant-not-found` con CTA a signup
- [ ] Headers `x-business-id` y `x-member-role` disponibles en server components
- [ ] Cookie de sesión válida en todos los subdominios (`domain=.crm.example.com`)
- [ ] Dev local con `ara.localhost:3000` funciona sin config adicional
- [ ] Variable `NEXT_PUBLIC_DEV_TENANT_SLUG` como fallback para dev

## Fuera de alcance
- Dominios personalizados por negocio (`minegocio.com` apuntando a la plataforma)
- Múltiples subdominios por negocio
- CDN por tenant
