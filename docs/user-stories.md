# Historias de Usuario — CRM Salón de Uñas & Belleza

> **Producto:** CRM en Notion para negocio de uñas y servicios de belleza
> **Usuario principal:** Owner/Manager (dueña del salón)
> **Bases de datos:** Clientes, Servicios, Citas/Agenda, Staff/Nail Artists, Pagos/Finanzas

---

## ÉPICO 1: Gestión de Clientes

### HU-01: Registrar nueva clienta
**Como** owner del salón,
**quiero** registrar una nueva clienta con sus datos de contacto y redes sociales,
**para** tener su información disponible al agendar citas.

**Criterios de aceptación:**
- Puedo ingresar: nombre, teléfono, email, Instagram
- Se registra automáticamente la fecha de primer contacto
- Puedo asignar un estado inicial: Prospecto
- Puedo agregar notas y subir una foto de referencia
- El registro se guarda en la base de datos Clientes

**Prioridad:** 🔴 Alta
**DB:** Clientes

---

### HU-02: Ver y buscar clientas
**Como** owner del salón,
**quiero** buscar y filtrar clientas por nombre, teléfono o estado,
**para** encontrar rápidamente la información que necesito.

**Criterios de aceptación:**
- Puedo buscar por nombre, teléfono o Instagram
- Puedo filtrar por estado: Prospecto, Activa, Inactiva, VIP
- Veo una lista con nombre, teléfono y estado de cada clienta
- Puedo ordenar por fecha de primer contacto o nombre

**Prioridad:** 🔴 Alta
**DB:** Clientes

---

### HU-03: Actualizar estado de clienta
**Como** owner del salón,
**quiero** cambiar el estado de una clienta según su actividad,
**para** segmentar mi base de datos y aplicar estrategias diferentes.

**Criterios de aceptación:**
- Puedo cambiar el estado entre: Prospecto → Activa → Inactiva → VIP
- Una clienta pasa a "Activa" automáticamente tras su primera cita completada
- Una clienta pasa a "Inactiva" si no tiene citas en 60+ días
- Puedo marcar manualmente una clienta como VIP

**Prioridad:** 🟡 Media
**DB:** Clientes

---

### HU-04: Ver historial completo de clienta
**Como** owner del salón,
**quiero** ver todas las citas, servicios consumidos y pagos de una clienta,
**para** conocer su historial y ofrecerle un servicio personalizado.

**Criterios de aceptación:**
- Desde la ficha de una clienta puedo ver todas sus citas (pasadas y futuras)
- Veo el total gastado por la clienta en el salón
- Veo la fecha de su última visita
- Veo sus servicios más frecuentes
- Puedo ver notas y alergias/contraindicaciones

**Prioridad:** 🔴 Alta
**DB:** Clientes (relación con Citas y Pagos)

---

### HU-05: Identificar clientas para reactivar
**Como** owner del salón,
**quiero** identificar clientas inactivas que no han venido en un tiempo,
**para** enviarles mensajes de reactivación con ofertas.

**Criterios de aceptación:**
- Puedo ver una lista de clientas cuya última cita fue hace más de 30/60/90 días
- Puedo filtrar clientas inactivas que eran frecuentes
- Veo el teléfono/email/Instagram para contactarlas

**Prioridad:** 🟢 Baja
**DB:** Clientes (relación con Citas)

---

## ÉPICO 2: Catálogo de Servicios

### HU-06: Crear y gestionar servicios
**Como** owner del salón,
**quiero** crear servicios con su categoría, precio y duración,
**para** tener mi catálogo actualizado al momento de agendar citas.

**Criterios de aceptación:**
- Puedo crear un servicio con: nombre, categoría, duración (minutos), precio, descripción
- Las categorías son: Manicure, Pedicure, Nail Art, Tratamientos, Depilación
- Puedo subir una imagen de referencia del servicio
- Puedo marcar servicios como activos/inactivos

**Prioridad:** 🔴 Alta
**DB:** Servicios

---

### HU-07: Ver catálogo por categoría
**Como** owner del salón,
**quiero** ver los servicios organizados por categoría,
**para** consultar rápidamente precios y duraciones disponibles.

**Criterios de aceptación:**
- Puedo ver servicios agrupados por categoría
- Veo nombre, precio y duración de cada servicio
- Puedo filtrar servicios activos vs inactivos
- Puedo buscar servicios por nombre

**Prioridad:** 🟡 Media
**DB:** Servicios

---

### HU-08: Actualizar precios y duración
**Como** owner del salón,
**quiero** modificar el precio o duración de un servicio,
**para** mantener mi catálogo actualizado sin afectar citas ya agendadas.

**Criterios de aceptación:**
- Puedo editar precio y duración de cualquier servicio
- Los cambios NO afectan citas ya programadas (mantienen precio original)
- Puedo ver historial de cambios de precio (notas)

**Prioridad:** 🟡 Media
**DB:** Servicios

---

## ÉPICO 3: Agenda y Citas

### HU-09: Agendar nueva cita
**Como** owner del salón,
**quiero** crear una cita seleccionando clienta, servicios, nail artist y horario,
**para** organizar la agenda del salón.

**Criterios de aceptación:**
- Selecciono una clienta existente (o creo una nueva)
- Puedo seleccionar uno o más servicios para la cita
- Se calcula automáticamente el precio total (suma de servicios)
- Se calcula automáticamente la duración total (suma de servicios)
- Asigno una nail artist disponible
- Selecciono fecha y hora de inicio
- La cita se crea con estado "Programada"
- Puedo agregar notas especiales

**Prioridad:** 🔴 Alta
**DB:** Citas (relación con Clientes, Servicios, Staff)

---

### HU-10: Ver agenda del día/semana
**Como** owner del salón,
**quiero** ver las citas del día o de la semana en vista calendario,
**para** tener control de la agenda y evitar solapamientos.

**Criterios de aceptación:**
- Veo las citas en vista calendario (día/semana)
- Cada cita muestra: clienta, servicios, hora de inicio, nail artist
- Puedo filtrar por nail artist
- Veo visualmente las citas canceladas/no-show
- Puedo hacer clic en una cita para ver detalles

**Prioridad:** 🔴 Alta
**DB:** Citas

---

### HU-11: Actualizar estado de cita
**Como** owner del salón,
**quiero** actualizar el estado de una cita según lo que ocurra,
**para** llevar un registro preciso del día.

**Criterios de aceptación:**
- Puedo cambiar el estado: Programada → En curso → Completada
- Puedo marcar como Cancelada (con motivo opcional)
- Puedo marcar como No-show (clienta no llegó)
- Al marcar "Completada", puedo registrar el pago

**Prioridad:** 🔴 Alta
**DB:** Citas

---

### HU-12: Detectar solapamientos de agenda
**Como** owner del salón,
**quiero** que el sistema me alerte si hay un solapamiento de horarios,
**para** evitar agendar dos citas al mismo tiempo con la misma nail artist.

**Criterios de aceptación:**
- Al crear/editar una cita, se valida que la nail artist esté libre en ese horario
- Recibo una alerta si hay conflicto de horarios
- Se muestra qué cita genera el conflicto
- Puedo forzar la cita aún así (con nota)

**Prioridad:** 🟡 Media
**DB:** Citas (validación con Staff)

---

### HU-13: Ver resumen de cita
**Como** owner del salón,
**quiero** ver toda la información de una cita en un solo lugar,
**para** tener contexto antes de atender a la clienta.

**Criterios de aceptación:**
- Veo: clienta, servicios, nail artist, fecha/hora, estado
- Veo el precio total calculado
- Veo si el pago está registrado
- Veo notas de la cita
- Veo historial previo de esa clienta

**Prioridad:** 🟡 Media
**DB:** Citas

---

## ÉPICO 4: Staff / Nail Artists

### HU-14: Registrar nail artist
**Como** owner del salón,
**quiero** registrar a cada nail artist con sus datos, especialidades y comisión,
**para** tener toda la información del equipo centralizada.

**Criterios de aceptación:**
- Puedo ingresar: nombre, teléfono, especialidades
- Registro el % de comisión de cada nail artist
- Puedo subir una foto
- Puedo registrar su horario de trabajo
- Puedo marcar si está activa o no

**Prioridad:** 🔴 Alta
**DB:** Staff/Nail Artists

---

### HU-15: Ver rendimiento por nail artist
**Como** owner del salón,
**quiero** ver cuántas citas ha atendido cada nail artist y cuánto ha generado,
**para** evaluar su rendimiento y calcular comisiones.

**Criterios de aceptación:**
- Veo total de citas completadas por nail artist
- Veo facturación total generada por nail artist
- Veo servicios que más realiza
- Puedo ver el período (semana/mes)

**Prioridad:** 🟡 Media
**DB:** Staff (relación con Citas)

---

### HU-16: Calcular comisiones
**Como** owner del salón,
**quiero** calcular automáticamente la comisión de cada nail artist,
**para** saber cuánto pagarles al final de cada período.

**Criterios de aceptación:**
- La comisión se calcula como: % comisión × total citas completadas del período
- Puedo filtrar por semana o mes
- Puedo ver el desglose por cita
- Puedo marcar comisiones como pagadas

**Prioridad:** 🟡 Media
**DB:** Staff (relación con Citas y Pagos)

---

## ÉPICO 5: Pagos y Finanzas

### HU-17: Registrar pago de cita
**Como** owner del salón,
**quiero** registrar el pago de una cita completada,
**para** llevar el control de ingresos del salón.

**Criterios de aceptación:**
- Al completar una cita, puedo registrar un pago
- Registro: monto, método de pago (efectivo/tarjeta/transferencia), fecha
- El pago se vincula automáticamente a la cita
- Puedo ver si una cita está pagada, parcialmente pagada o sin pagar
- Puedo subir comprobante de pago (foto)

**Prioridad:** 🔴 Alta
**DB:** Pagos/Finanzas (relación con Citas)

---

### HU-18: Registrar egresos
**Como** owner del salón,
**quiero** registrar gastos del salón (insumos, alquiler, etc.),
**para** tener control total de las finanzas.

**Criterios de aceptación:**
- Puedo registrar un egreso con: concepto, fecha, monto, categoría
- Categorías de egreso: Insumos, Alquiler, Servicios, Marketing, Otros
- Puedo vincular el egreso a una cita si aplica
- Puedo subir foto del comprobante

**Prioridad:** 🟡 Media
**DB:** Pagos/Finanzas

---

### HU-19: Ver resumen financiero del período
**Como** owner del salón,
**quiero** ver un resumen de ingresos vs egresos de la semana/mes,
**para** conocer la salud financiera del negocio.

**Criterios de aceptación:**
- Veo total de ingresos del período
- Veo total de egresos del período
- Veo la ganancia neta (ingresos - egresos)
- Puedo filtrar por semana, mes o rango personalizado
- Veo desglose por método de pago
- Veo desglose de egresos por categoría

**Prioridad:** 🔴 Alta
**DB:** Pagos/Finanzas (rollups/agregaciones)

---

### HU-20: Ver pagos pendientes
**Como** owner del salón,
**quiero** ver las citas que no han sido pagadas o están parcialmente pagadas,
**para** hacer seguimiento y cobrar lo pendiente.

**Criterios de aceptación:**
- Veo lista de citas sin pago registrado
- Veo citas con pago parcial y monto restante
- Puedo ver datos de contacto de la clienta
- Puedo marcar como pagado al recibir el pago

**Prioridad:** 🟡 Media
**DB:** Pagos/Finanzas (relación con Citas)

---

## ÉPICO 6: Dashboard y Reportes

### HU-21: Dashboard principal
**Como** owner del salón,
**quiero** un dashboard con métricas clave del negocio,
**para** tener una vista rápida del estado del salón.

**Criterios de aceptación:**
- Veo citas de hoy (programadas y en curso)
- Veo total de clientas activas
- Veo ingresos del mes actual
- Veo próximos 7 días de agenda
- Veo alertas: pagos pendientes, clientas por reactivar

**Prioridad:** 🔴 Alta
**DB:** Todas (agregaciones y vistas)

---

### HU-22: Reporte de métricas mensuales
**Como** owner del salón,
**quiero** ver un reporte mensual con las métricas del negocio,
**para** tomar decisiones informadas.

**Criterios de aceptación:**
- Total de citas completadas en el mes
- Ingresos totales del mes
- Egresos totales del mes
- Ganancia neta del mes
- Top servicios más solicitados
- Top nail artists por facturación
- Nuevas clientas del mes
- Clientas que no volvieron (inactivas)

**Prioridad:** 🟢 Baja
**DB:** Todas (agregaciones)

---

## Resumen de Prioridades

| Prioridad | Historias | Descripción |
|-----------|-----------|-------------|
| 🔴 Alta | HU-01, HU-02, HU-04, HU-06, HU-09, HU-10, HU-11, HU-14, HU-17, HU-19, HU-21 | Core del negocio — sin esto el CRM no funciona |
| 🟡 Media | HU-03, HU-07, HU-08, HU-12, HU-13, HU-15, HU-16, HU-18, HU-20 | Mejora operativa — importantes pero no bloqueantes |
| 🟢 Baja | HU-05, HU-22 | Nice to have — se pueden agregar después |

---

## Mapa de Relaciones entre DBs

```
Clientes ────< Citas >──── Staff/Nail Artists
                  │
                  ├──> Servicios (multi-select)
                  │
                  └──> Pagos/Finanzas
                          │
                          └──> Egresos (mismo DB, tipo diferente)
```

- **Clientes** tiene muchas **Citas** (1:N)
- **Staff** tiene muchas **Citas** (1:N)
- **Citas** tiene muchos **Servicios** (N:M)
- **Citas** tiene un **Pago** (1:1 o 1:N si pagos parciales)
- **Pagos** puede ser Ingreso o Egreso (tipo)
