# Especificación: HU-34 — Registro de Nuevo Negocio (Signup)

## Historia de usuario
Como emprendedor dueño de un negocio de belleza, quiero registrarme en la plataforma y crear mi negocio para empezar a gestionar mis operaciones desde mi propio espacio.

## Descripción
Flujo self-service completo de registro. Cualquier persona puede crear un negocio sin aprobación manual. El proceso crea la cuenta de auth, el negocio, el registro de staff del dueño y su membresía como owner en una sola operación atómica. Al finalizar, el usuario es redirigido a su subdominio propio.

## Actores
- **Emprendedor / Nuevo usuario**: persona que aún no tiene cuenta

## Precondiciones
- El usuario accede desde el dominio raíz (`crm.example.com`), no desde un subdominio
- No tiene cuenta previa en la plataforma

## Flujo principal

1. Usuario navega a `crm.example.com/signup`
2. Ve formulario con:
   - **Email** (campo de texto, requerido)
   - **Contraseña** (mínimo 8 caracteres, con toggle mostrar/ocultar)
   - **Nombre del negocio** (ej: "Bella Studio", requerido)
   - **Subdominio / slug** (ej: `bella-studio`, autogenerado desde el nombre pero editable, requerido)
3. El slug se genera automáticamente al escribir el nombre (lowercased, espacios → guiones, máx 30 chars) con un indicador de disponibilidad en tiempo real
4. Usuario presiona "Crear mi negocio"
5. Sistema llama a `supabase.auth.signUp()` → crea cuenta de auth
6. Sistema llama a RPC `create_business_with_owner(slug, name)` → crea business + staff row + business_members como owner
7. Sistema redirige a `https://<slug>.crm.example.com/onboarding`

## Flujos alternativos / casos borde

- **Slug ya tomado**: indicador en tiempo real muestra "ya está en uso" mientras escribe; botón disabled hasta que el slug sea único
- **Slug inválido**: solo permite `a-z`, `0-9`, guiones. Muestra mensaje de formato
- **Slug reservado** (`www`, `app`, `api`, `admin`, `auth`, `static`, `assets`, `mail`, `billing`, `support`): muestra "este nombre no está disponible"
- **Email ya registrado**: Supabase devuelve error → mostrar "este email ya tiene una cuenta. ¿Querés iniciar sesión?"
- **Contraseña débil**: mostrar validación inline (mínimo 8 chars)
- **Verificación de email**: si Supabase tiene email confirmation habilitado → mostrar pantalla "Revisá tu email para confirmar tu cuenta" antes de redirigir
- **Error de red**: mostrar toast de error, el formulario no se limpia

## Reglas de negocio

- El signup es self-service — ningún admin externo aprueba el registro
- Slug se normaliza automáticamente (lowercase, sin espacios ni caracteres especiales)
- Un usuario puede pertenecer a múltiples negocios (mismo email, distinto slug)
- El primer miembro de un negocio siempre es `owner` y no puede ser degradado
- El slug no puede modificarse después de la creación (es el identificador permanente del subdominio)

## Criterios de aceptación

- [ ] Formulario accesible desde `crm.example.com/signup`
- [ ] Slug se autogenera al tipear el nombre del negocio
- [ ] Disponibilidad de slug se verifica en tiempo real (debounced 500ms)
- [ ] Slugs reservados son rechazados con mensaje claro
- [ ] Registro exitoso crea: auth user + business + staff row + business_member (owner)
- [ ] Redirect post-signup va a `https://<slug>.crm.example.com/onboarding`
- [ ] Errores de email duplicado o contraseña débil se muestran inline
- [ ] Sin verificación de email: redirect inmediato. Con verificación: pantalla de confirmación pendiente

## Fuera de alcance
- Planes de pago / billing (post-MVP)
- Social auth (Google, Apple)
- Migración de datos desde otra plataforma
- Subdominios personalizados (ej: `mipropiodominio.com`)
