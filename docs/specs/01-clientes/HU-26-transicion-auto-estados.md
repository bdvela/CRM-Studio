# Especificación: HU-26 — Transición Automática de Estados de Clienta

## Historia de usuario
> **Como** administradora del studio de belleza, **quiero** que el estado de las clientas se actualice automáticamente según su actividad de citas, **para** no tener que cambiar manualmente entre prospecto, activa e inactiva y así enfocarme en atender en lugar de administrar estados.

## Descripción
Sistema de transición automática de estados de clienta basado en su actividad de citas. Al completar una cita, una clienta `prospecto` pasa a `activa` y una `inactiva` se reactiva a `activa`. Las clientas `activa` o `vip` que lleven más de 60 días sin completar una cita pasan automáticamente a `inactiva`. VIP solo se asigna manualmente y se pierde si la clienta se vuelve inactiva y regresa. Los cambios de estado son silenciosos (sin notificaciones ni toasts) y se reflejan en la UI al recargar los datos.

## Actores
- **Sistema**: Ejecuta las transiciones automáticamente en background
- **Administradora / Staff**: Ve los estados actualizados en la UI sin intervenir

## Reglas de negocio

### Triggers de transición
| Trigger | De | A | Condición |
|---------|----|----|-----------|
| Cita completada | `prospecto` | `activa` | Primera cita `completada` de la clienta |
| Cita completada | `inactiva` | `activa` | La clienta estaba `inactiva` y completa una cita |
| 60+ días sin completar | `activa` | `inactiva` | Última cita `completada` fue hace más de 60 días corridos |
| 60+ días sin completar | `vip` | `inactiva` | Última cita `completada` fue hace más de 60 días corridos |
| Cita completada (era VIP) | `inactiva` | `activa` | La clienta era VIP antes de volverse inactiva; al regresar vuelve como `activa`, no como `vip` |

### Reglas
- Solo cuentan las citas en estado `completada`. `cancelada`, `no_show` y `en_curso` no activan ninguna transición ni reinician el contador de inactividad.
- El threshold de inactividad es **60 días corridos** desde la última cita `completada`.
- VIP **nunca** se asigna automáticamente. Es estrictamente manual.
- VIP **sí** se degrada a `inactiva` si no completa citas en 60 días.
- Al reactivarse desde `inactiva` (completando una cita), una ex-VIP vuelve como `activa`. Recuperar el estatus VIP requiere reasignación manual.
- Las transiciones son **silenciosas**: no generan toasts, notificaciones ni alertas.
- El widget de "Reactivación" del Dashboard se beneficia automáticamente al listar clientas `inactiva`.

### No son reglas
- Una clienta `prospecto` **no** se vuelve `inactiva` aunque tenga más de 60 días sin completar citas. Se mantiene como `prospecto` hasta su primera cita completada.
- Las citas `cancelada` y `no_show` no afectan el estado.

## Flujo principal

### 1. Al completar una cita (promoción / reactivación)
1. El staff completa una cita (estado cambia a `completada`)
2. El sistema verifica el estado actual de la clienta:
   - Si es `prospecto` → actualiza a `activa`
   - Si es `inactiva` → actualiza a `activa`
   - Si es `activa` o `vip` → no cambia
3. La UI se refresca y muestra el nuevo estado

### 2. Al cargar la lista de clientas (detección de inactividad)
1. Se cargan todas las clientas desde la base de datos
2. Para cada clienta `activa` o `vip`, se verifica la fecha de su última cita `completada`
3. Si la fecha es mayor a 60 días, se actualiza a `inactiva`
4. La UI muestra los estados actualizados

### 3. Al cargar el Dashboard (detección de inactividad)
1. Mismo proceso que el punto 2
2. El widget de "Reactivación" muestra las clientas `inactiva` incluyendo las recién reclasificadas

### 4. Asignación manual de VIP
1. El staff edita una clienta y cambia su estado a `vip` manualmente
2. No hay trigger automático que asigne VIP

## Flujos alternativos / casos borde

- **Clienta `prospecto` con citas `cancelada` previas**: Si tuvo 3 citas canceladas y luego completa una, pasa a `activa` en esa primera completada. Las canceladas no la promovieron antes.
- **Clienta `prospecto` con más de 60 días**: Se mantiene como `prospecto`. No se degrada a `inactiva` porque nunca fue `activa`.
- **Clienta `inactiva` agenda cita pero no asiste (`no_show`)**: Sigue `inactiva`. No se reactiva porque la cita no se completó.
- **Clienta completa una cita, se vuelve `activa`, y en la misma recarga también califica para `inactiva`**: No debería ocurrir porque la cita recién completada reinicia el contador. Si por algún bug ocurre, prevalece `activa`.
- **Múltiples clientas cruzan el threshold al mismo tiempo**: Se procesan en lote al cargar la lista o dashboard. No hay riesgo de race condition porque cada cliente se evalúa individualmente.
- **Edición manual de estado**: Si el staff cambia manualmente el estado, ese cambio persiste hasta que ocurra una nueva transición automática que aplique.
- **Clienta eliminada**: No aplican transiciones. Las clientas eliminadas no se procesan.

## Criterios de aceptación

- [ ] Al completar la primera cita de una clienta `prospecto`, su estado cambia automáticamente a `activa`
- [ ] Al completar una cita de una clienta `inactiva`, su estado cambia automáticamente a `activa`
- [ ] Al cargar la lista de clientas, las clientas `activa` con más de 60 días sin completar citas se muestran como `inactiva`
- [ ] Al cargar la lista de clientas, las clientas `vip` con más de 60 días sin completar citas se muestran como `inactiva`
- [ ] Una clienta que era VIP y vuelve tras inactividad se reactiva como `activa` (no como `vip`)
- [ ] Las citas `cancelada` y `no_show` no activan ninguna transición ni reinician el contador de inactividad
- [ ] Las clientas `prospecto` nunca se degradan automáticamente a `inactiva`
- [ ] Los cambios de estado no generan toasts ni notificaciones
- [ ] El widget de Reactivación del Dashboard muestra las clientas reclasificadas como `inactiva`
- [ ] El staff puede seguir cambiando manualmente cualquier estado en cualquier momento

## Fuera de alcance
- Asignación automática de VIP
- Notificaciones push o email sobre cambios de estado
- Threshold de inactividad configurable por UI (es 60 días fijo)
- Historial de transiciones (no se registra qué trigger causó cada cambio)
- Degradación de `prospecto` a `inactiva` (nunca fueron activas)
