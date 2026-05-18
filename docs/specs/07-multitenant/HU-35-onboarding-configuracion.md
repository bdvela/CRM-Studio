# Especificación: HU-35 — Onboarding de Configuración Inicial

## Historia de usuario
Como dueño recién registrado, quiero configurar los datos básicos de mi negocio antes de empezar a usarlo para que la app refleje mi marca y mi contexto local.

## Descripción
Wizard de configuración que aparece una única vez, inmediatamente después del signup. Es opcional — si el usuario lo omite, la app funciona con valores default. La información configurada aquí se almacena en la tabla `businesses` y se usa para el branding dinámico, formato de moneda y formato de fechas/teléfonos en toda la app.

## Actores
- **Owner**: único rol que completa el onboarding de su negocio

## Precondiciones
- Usuario recién creó su negocio (viene del redirect post-signup)
- O usuario accede a `/onboarding` con una cuenta owner que nunca completó la configuración

## Flujo principal

1. Usuario llega a `https://<slug>.crm.example.com/onboarding`
2. Ve wizard de 2 pasos:

   **Paso 1 — Identidad del negocio**
   - Nombre completo del negocio (pre-llenado con el nombre del signup, editable)
   - Nombre corto / apodo (para header mobile y PWA `short_name`, ej: "AZ Studio")
   - Emoji o ícono del negocio (picker de emojis, default: 🌸)
   - Color de tema (color picker, default: #db2777 — salon pink)

   **Paso 2 — Configuración regional**
   - Moneda (select: PEN – Soles, USD – Dólares, ARS – Pesos AR, COP – Pesos CO, MXN – Pesos MX)
   - Símbolo de moneda (pre-llenado al elegir moneda, editable para casos custom)
   - Código de país para teléfonos (select con banderas, default: +51 Perú)
   - Locale/idioma (select: es-PE, es-MX, es-AR, es-CO, es-ES, en-US)

3. Usuario presiona "Finalizar configuración" → UPDATE en tabla `businesses` → redirect a `/` (dashboard)
4. O presiona "Omitir por ahora" → redirect a `/` sin cambios (defaults activos)

## Flujos alternativos / casos borde

- **Usuario ya completó onboarding**: acceder a `/onboarding` redirige a `/` (o muestra el wizard en modo edición si así se decide, ver fuera de alcance)
- **Emoji inválido**: campo acepta cualquier emoji Unicode; si el browser no soporta el emoji, se muestra el default
- **Moneda custom**: símbolo de moneda es texto libre para negocios con monedas no listadas
- **Error al guardar**: toast de error, el wizard no avanza; el usuario puede reintentar

## Reglas de negocio

- El onboarding es opcional — omitirlo no bloquea el uso de la app
- Los defaults son: nombre ya ingresado, short_name = nombre, emoji = 🌸, color = #db2777, moneda = PEN, símbolo = S/, país = +51, locale = es-PE
- El nombre corto tiene máximo 20 caracteres (para caber en headers mobile)
- Los cambios se aplican inmediatamente en toda la UI al guardar

## Criterios de aceptación

- [ ] Wizard aparece automáticamente al llegar por primera vez post-signup
- [ ] Paso 1: nombre, nombre corto, emoji, color de tema editables
- [ ] Paso 2: moneda, símbolo, código de país, locale configurables
- [ ] Seleccionar moneda pre-llena símbolo (editable)
- [ ] Botón "Omitir por ahora" disponible en ambos pasos
- [ ] Guardar actualiza tabla `businesses` y redirige al dashboard
- [ ] Cambios se reflejan inmediatamente en sidebar, login y PWA manifest
- [ ] Si el usuario ya configuró el negocio, `/onboarding` redirige a `/`

## Fuera de alcance
- Editar la configuración después del onboarding (queda como ajustes de negocio, post-MVP)
- Logo personalizado (imagen subida a Storage, post-MVP)
- Zona horaria (post-MVP)
- Múltiples idiomas de interfaz (la UI siempre es en español para el MVP)
