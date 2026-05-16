# Especificación: HU-27 — Simplificar formulario de clienta: remover selector de estado, agregar toggle VIP

## Historia de usuario
Como dueña del studio, quiero que al crear una clienta nueva se asigne automáticamente como Prospecto y poder marcarla como VIP mediante un toggle, sin tener que seleccionar manualmente el estado desde un dropdown. El toggle debe estar disponible también al editar una clienta existente.

## Descripción
Se elimina el selector de estado (`<Select>`) del formulario de creación y edición de clientas (`ClientFormModal`). Al crear una clienta nueva, el estado se asigna automáticamente: `prospecto` por defecto, o `vip` si el toggle "Clienta VIP" está activado. En modo edición, el toggle refleja el estado actual de la clienta y permite activar o desactivar el estado VIP. El toggle se renderiza como un switch con label "Clienta VIP", ubicado después del campo de notas y antes de los botones de acción. Los demás cambios de estado (activa, inactiva) siguen ocurriendo automáticamente mediante las funciones de HU-26 (`promoteClientOnCompletion` y `eval_client_inactivity`).

## Actores
- Dueña / Admin del studio

## Flujo principal — Creación

1. Usuario hace clic en "Nueva clienta" para abrir el modal `ClientFormModal`.
2. El formulario se muestra sin el selector de estado.
3. El toggle "Clienta VIP" aparece apagado por defecto.
4. Usuario llena los campos (nombre, teléfono, email, instagram, notas).
5. Si desea marcarla como VIP, activa el toggle.
6. Usuario hace clic en "Crear".
7. El sistema guarda la clienta con estado `prospecto` (si toggle apagado) o `vip` (si toggle prendido).
8. El modal se cierra y la lista se actualiza.

## Flujo principal — Edición

1. Usuario abre el detalle de una clienta y hace clic en "Editar".
2. El formulario se muestra sin el selector de estado.
3. El toggle "Clienta VIP" refleja el estado actual:
   - **Prendido**: si la clienta tiene estado `vip`.
   - **Apagado**: si la clienta tiene cualquier otro estado (`prospecto`, `activa`, `inactiva`).
4. Usuario puede activar o desactivar el toggle.
5. Usuario hace clic en "Guardar".
6. El sistema actualiza la clienta:
   - Si toggle se **prendió**, cambia el estado a `vip`.
   - Si toggle se **apagó** (y antes era `vip`), cambia el estado a `activa`.
   - Si toggle no cambió, el estado se mantiene igual.
7. El modal de edición se cierra, el modal de detalle se refresca con los nuevos datos.

## Flujos alternativos / casos borde

- **Crear clienta con solo nombre (sin toggle VIP)**: se guarda como `prospecto`. El resto de campos vacíos son aceptados.
- **Editar clienta `activa` y prender toggle VIP**: cambia a `vip`. El campo `activa` sigue en true.
- **Editar clienta `vip` y apagar toggle**: cambia a `activa`. Si la clienta nunca tuvo una cita completada, igual cambia a `activa` (HU-26 la degradará si corresponde).
- **Editar clienta `inactiva` y prender toggle VIP**: cambia a `vip` y `active` se mantiene en true.
- **Editar clienta `prospecto` y prender toggle VIP**: cambia a `vip`.
- **Toggle no modificado en edición**: el estado original se preserva, sin importar cuál sea.
- **Clienta VIP completa una cita**: `promoteClientOnCompletion` (HU-26) **no** modifica el estado `vip` — VIP se mantiene VIP.
- **Clienta VIP sin citas por >60 días**: `eval_client_inactivity` (HU-26) **sí** la degrada a `inactiva` (VIP no es inmune a inactividad).

## Reglas de negocio

1. **Estado inicial**: al crear, siempre es `prospecto` (default) o `vip` (si toggle prendido).
2. **Transición VIP → no-VIP**: al desactivar el toggle en edición, el estado cambia a `activa`.
3. **VIP inmutable por promoción**: `promoteClientOnCompletion` no modifica clientas con estado `vip`.
4. **VIP mutable por inactividad**: `eval_client_inactivity` sí puede degradar VIP a `inactiva` tras >60 días sin cita completada.
5. **Toggle binario**: solo dos posiciones — VIP (prendido) o no-VIP (apagado). No hay estados intermedios.
6. **Sin selector de estado manual**: el usuario no puede elegir manualmente entre prospecto/activa/inactiva/vip. Solo controla VIP/no-VIP mediante el toggle.

## Criterios de aceptación

- [ ] El formulario `ClientFormModal` no muestra el selector de estado en ningún modo (creación ni edición).
- [ ] Al crear una clienta nueva, se muestra el toggle "Clienta VIP" apagado y el estado guardado es `prospecto`.
- [ ] Al crear una clienta nueva con el toggle VIP prendido, el estado guardado es `vip`.
- [ ] Al editar una clienta con estado `vip`, el toggle aparece prendido.
- [ ] Al editar una clienta con estado `prospecto`, `activa` o `inactiva`, el toggle aparece apagado.
- [ ] Al prender el toggle en una clienta existente y guardar, el estado cambia a `vip`.
- [ ] Al apagar el toggle en una clienta `vip` y guardar, el estado cambia a `activa`.
- [ ] El toggle no modifica el campo `active` (se mantiene el valor existente o `true` en creación).
- [ ] `promoteClientOnCompletion` (HU-26) no modifica clientas con estado `vip`.

## Fuera de alcance

- No se modifica el comportamiento de `eval_client_inactivity` (HU-26) — VIP sigue siendo degradable a inactiva por inactividad.
- No se agregan nuevos estados de clienta.
- No se modifica el modal de detalle (`ClientDetailModal`) ni la vista de lista.
- No se modifica el badge de estado en las cards — sigue mostrando el estado real (prospecto, activa, inactiva, vip).
