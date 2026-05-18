# Especificación: HU-39 — Branding Dinámico

## Historia de usuario
Como usuario de cualquier negocio, quiero ver el nombre y la identidad visual de mi negocio en toda la interfaz, sin que aparezca "Ara Zevallos Studio" ni ningún nombre hardcodeado de otro negocio.

## Descripción
Todos los lugares donde actualmente aparece "Ara Zevallos Studio" / "AZ Studio" deben leer el nombre del negocio desde la base de datos. Esto incluye: sidebar, header mobile, login, page titles, PWA manifest, metadata HTML. El branding (nombre, emoji, color de tema) se lee desde la tabla `businesses` según el subdominio activo. La página de login debe mostrar el branding incluso antes de que el usuario se autentique (usando el RPC público `get_business_branding`).

## Actores
- **Cualquier usuario** (autenticado o no) de cualquier subdominio

## Precondiciones
- La tabla `businesses` tiene el registro del negocio con nombre, short_name, logo_emoji, theme_color
- El usuario accede desde el subdominio del negocio

## Lugares a deshardecodear

| Ubicación actual | Hardcoded | Reemplazar con |
|---|---|---|
| `app/src/app/layout.tsx` | `'AZ Studio'` en metadata | `business.name` / `business.short_name` vía `generateMetadata` |
| `app/src/app/login/page-client.tsx` | `'Ara Zevallos Studio'` | `get_business_branding(slug)` — llamada pública |
| `app/src/app/login/page.tsx` | metadata title | `generateMetadata` con business name |
| `app/src/components/layout/shell.tsx` | sidebar header | `business.name` y `business.short_name` desde auth context |
| `app/src/app/staff/[id]/page.tsx` | título de página | `generateMetadata` |
| `app/src/app/citas/[id]/page.tsx` | título de página | `generateMetadata` |
| `app/src/app/clientes/[id]/page.tsx` | título de página | `generateMetadata` |
| `app/public/manifest.json` | nombre estático PWA | Route handler `/manifest` dinámico |

## Flujo principal

1. Usuario navega a `https://bella.crm.example.com/login`
2. Middleware detecta slug `bella`, pasa `x-business-slug` al request
3. Login page llama a `get_business_branding('bella')` (RPC público, sin auth)
4. Muestra: emoji del negocio + nombre del negocio en el formulario de login
5. Usuario hace login → auth context carga `business` con todos los datos del negocio
6. Sidebar muestra: `[emoji] [nombre del negocio]` en el header
7. Page titles en el browser tab: `Citas | Bella Studio`
8. Al instalar como PWA: muestra `Bella Studio` (short_name) en la pantalla de inicio del teléfono

## Flujo alternativo — Color de tema

- El color `theme_color` del negocio se aplica como `--rdp-accent-color` en el CalendarInput y como `theme-color` en el manifest PWA
- Para el MVP: el color afecta el manifest PWA, `theme-color` del HTML meta tag y el color del CalendarInput
- La paleta de Tailwind (salon-*) no cambia dinámicamente en MVP — es fija en el design system

## Flujos alternativos / casos borde

- **Subdominio desconocido** en login: muestra branding genérico "CRM Studio" con ícono default
- **Business sin short_name**: usar `name` completo como fallback
- **Business sin emoji**: usar '🏪' como fallback
- **PWA manifest cacheado**: route handler sirve `Cache-Control: private, max-age=0` para que el manifest se refresque en cada visita

## Reglas de negocio

- El branding es por negocio (subdominio), no por usuario
- La página de login muestra branding sin autenticación (RPC `get_business_branding` es accesible por `anon`)
- El manifest dinámico reemplaza el archivo estático `public/manifest.json` (que debe eliminarse)
- `generateMetadata` en `layout.tsx` es una función async que llama a `getCurrentBusiness()` server-side

## Criterios de aceptación

- [ ] Sidebar muestra `[emoji] [business.name]` correctamente para cualquier negocio
- [ ] Login muestra nombre del negocio antes de autenticarse
- [ ] Page titles del browser muestran: `[Módulo] | [business.name]`
- [ ] PWA manifest sirve nombre y short_name del negocio actual
- [ ] `theme_color` del manifest es el color configurado en el negocio
- [ ] Instalación como PWA muestra el nombre del negocio en pantalla de inicio
- [ ] `public/manifest.json` eliminado; reemplazado por `/manifest` route handler
- [ ] Fallbacks para emoji/short_name vacíos no rompen la UI
- [ ] Ninguna cadena "Ara Zevallos Studio" o "AZ Studio" aparece hardcodeada en código TypeScript o TSX

## Fuera de alcance
- Cambio dinámico de la paleta de colores de Tailwind según el negocio (requiere CSS variables + purge — post-MVP)
- Logo de imagen subido (solo emoji para MVP)
- Fuente tipográfica personalizada por negocio
