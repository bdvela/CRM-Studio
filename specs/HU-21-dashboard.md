# Especificación: HU-21 — Dashboard principal

## Historia de usuario
**Como** owner del salón, **quiero** un dashboard con métricas clave del negocio, **para** tener una vista rápida del estado del salón.

## Descripción
El dashboard es una página central en Notion que contiene vistas embebidas de todas las bases de datos, mostrando: citas de hoy, agenda de los próximos 7 días, clientas activas, ingresos del mes, citas con saldo pendiente, y clientas por reactivar. Es la página principal del CRM.

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner abre la página Dashboard del CRM
2. Ve de un vistazo:
   - Citas de hoy (programadas y en curso)
   - Agenda próximos 7 días
   - KPIs: clientas activas, ingresos del mes
   - Citas con saldo pendiente
   - Clientas por reactivar (60+ días sin visita)
3. Puede hacer clic en cualquier elemento para ver detalles

## Flujos alternativos / casos borde
- **Día sin citas**: La sección de hoy muestra "No hay citas"
- **Sin pendientes**: La sección de pendientes está vacía
- **Primer uso**: Todas las métricas en 0 o vacío

## Reglas de negocio
- RB-01: Citas de hoy = citas con Fecha y hora = Today y Estado en (Programada, En curso)
- RB-02: Clientas activas = Clientes con Estado = Activa
- RB-03: Ingresos del mes = suma de Pagos Tipo = Ingreso, Fecha = This month, Pagado = checked
- RB-04: Saldo pendiente = citas completadas sin pago final registrado
- RB-05: Reactivar = clientas con Estado = Activa y Última visita > 60 días

## Criterios de aceptación
- [ ] Veo citas de hoy en una sección del dashboard
- [ ] Veo agenda de próximos 7 días
- [ ] Veo total de clientas activas
- [ ] Veo ingresos del mes
- [ ] Veo citas con saldo pendiente
- [ ] Veo clientas por reactivar

## Fuera de alcance
- Gráficos visuales (barras, líneas)
- KPIs comparativos con período anterior
- Dashboard en tiempo real fuera de Notion
- Alertas push o notificaciones

---

# System Design Document: HU-21

## Página: Dashboard

### Estructura del Dashboard

```
💆‍♀️ CRM Salón de Belleza (página principal)
│
├── 📊 Hoy
│   └── Linked view: Citas (Filtro: Today + Estado = Programada/En curso)
│
├── 📅 Próximos 7 días
│   └── Linked view: Citas (Calendar, Filtro: Next 7 days)
│
├── 📈 KPIs
│   ├── Clientas activas: [count de Clientes donde Estado = Activa]
│   ├── Ingresos este mes: [sum de Pagos donde Tipo = Ingreso, This month]
│   └── Citas completadas este mes: [count de Citas donde Estado = Completada, This month]
│
├── ⚠️ Pendientes de pago
│   └── Linked view: Citas (Filtro: Completada + sin Pago final)
│
├── 🔄 Clientas por reactivar
│   └── Linked view: Clientes (Filtro: Activa + Última visita > 60 días)
│
└── 🔗 Navegación rápida
    ├── Clientes
    ├── Servicios
    ├── Citas
    ├── Staff/Artists
    └── Pagos/Finanzas
```

### Linked views requeridas

| Sección | DB | Vista | Filtros | Tipo |
|---------|----|-------|---------|------|
| Hoy | Citas | — | Fecha y hora = Today, Estado = Programada OR En curso | Table |
| Próximos 7 días | Citas | — | Fecha y hora = Next 7 days | Calendar |
| Pendientes | Pagos/Finanzas | — | Tipo pago = Reserva (sin Pago final asociado) | Table |
| Reactivar | Clientes | — | Estado = Activa, Última visita < 60 días atrás | Table |

### KPIs (valores calculados)

| KPI | Fuente | Cálculo | Visualización |
|-----|--------|---------|---------------|
| Clientas activas | Clientes | Count donde Estado = Activa | Número en callout |
| Ingresos mes | Pagos | Sum donde Tipo = Ingreso, This month, Pagado = checked | Número en callout |
| Citas completadas mes | Citas | Count donde Estado = Completada, This month | Número en callout |

### Nota sobre KPIs en Notion
Notion no tiene widgets de KPI nativos. Se usan estas aproximaciones:
1. **Callout con número manual**: Se actualiza periódicamente
2. **Linked view con count en footer**: Se muestra la vista inline con la calculación visible
3. **Fórmula en DB auxiliar**: Si se crea una DB "Métricas mensuales"

### Dependencias
- HU-01 (DB Clientes)
- HU-06 (DB Servicios — para navegación)
- HU-09 (DB Citas)
- HU-14 (DB Staff/Artists — para navegación)
- HU-17 (DB Pagos/Finanzas)
- Todas las DBs deben existir antes de crear el dashboard

### Limitaciones de Notion
- No hay KPIs nativos tipo "card con número grande"
- Las linked views inline son la forma principal de mostrar datos en el dashboard
- Los cálculos de suma/count se ven en el footer de cada vista
- No hay actualización en tiempo real; se refresca al abrir la página
