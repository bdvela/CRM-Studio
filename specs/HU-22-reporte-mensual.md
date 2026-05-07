# Especificación: HU-22 — Reporte de métricas mensuales

## Historia de usuario
**Como** owner del salón, **quiero** ver un reporte mensual con las métricas del negocio, **para** tomar decisiones informadas.

## Descripción
El owner puede ver un resumen mensual que incluye: citas completadas, ingresos, egresos, ganancia neta, servicios más solicitados, artistas con mayor facturación, nuevas clientas, y clientas que no volvieron.

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner accede al Dashboard o vista de reporte mensual
2. Ve todas las métricas del mes actual (o mes seleccionado)
3. Usa la información para tomar decisiones

## Criterios de aceptación
- [ ] Total de citas completadas en el mes
- [ ] Ingresos totales del mes
- [ ] Egresos totales del mes
- [ ] Ganancia neta del mes
- [ ] Top servicios más solicitados
- [ ] Top artistas por facturación
- [ ] Nuevas clientas del mes
- [ ] Clientas que no volvieron (inactivas)

## Fuera de alcance
- Comparación con meses anteriores
- Gráficos y visualizaciones
- Exportación a PDF
- Envío automático por email

---

# System Design Document: HU-22

## Implementación: Linked views en Dashboard

### Métricas del reporte

| Métrica | Fuente | Método |
|---------|--------|--------|
| Citas completadas | Citas | Linked view: Estado = Completada, Fecha = This month, count en footer |
| Ingresos totales | Pagos | Linked view: Tipo = Ingreso, Fecha = This month, sum en footer |
| Egresos totales | Pagos | Linked view: Tipo = Egreso, Fecha = This month, sum en footer |
| Ganancia neta | Pagos | Manual: Ingresos - Egresos (o fórmula en DB auxiliar) |
| Top servicios | Citas | Linked view group by Servicios, sort by count |
| Top artistas | Staff | Linked view de Citas group by Artista, sort by sum Precio |
| Nuevas clientas | Clientes | Linked view: Fecha primer contacto = This month, count |
| No volvieron | Clientes | Linked view: Estado = Activa, Última visita > 60 días |

### Estructura en Dashboard

```
📊 Reporte Mensual

├── Resumen
│   ├── Citas completadas: [count]
│   ├── Ingresos: [sum]
│   ├── Egresos: [sum]
│   └── Ganancia neta: [manual o fórmula]
│
├── Top Servicios (Board view de Citas grouped by Servicios)
├── Top Artistas (Table view grouped by Artista)
├── Nuevas Clientas (Table view de Clientes, This month)
└── Clientas por reactivar (Table view de Clientes, >60 días)
```

### Limitaciones de Notion
- No hay ganancia neta automática (requiere cálculo manual o n8n)
- Los linked views con filtros de fecha usan "This month" relativo
- Para reportes de meses pasados, se necesita cambiar el filtro manualmente
- No hay comparación automática con período anterior

### Dependencias
- HU-21 (Dashboard)
- Todas las DBs del sistema
