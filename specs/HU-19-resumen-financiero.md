# Especificación: HU-19 — Ver resumen financiero del período

## Historia de usuario
**Como** owner del salón, **quiero** ver un resumen de ingresos vs egresos de la semana/mes, **para** conocer la salud financiera del negocio.

## Descripción
El owner puede ver un resumen financiero filtrando por período (semana, mes o rango personalizado). Se muestran totales de ingresos, egresos y ganancia neta, con desglose por método de pago y categoría de egreso.

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner accede a la base de datos Pagos/Finanzas
2. Selecciona la vista del período deseado (semana, mes, personalizado)
3. Ve el resumen con: total ingresos, total egresos, ganancia neta
4. Puede ver desglose por método de pago (ingresos) y categoría (egresos)

## Flujos alternativos / casos borde
- **Período sin movimientos**: Se muestran totales en 0
- **Filtro personalizado**: El owner usa el filtro de fecha de Notion para rango específico

## Reglas de negocio
- RB-01: Ganancia neta = Total ingresos - Total egresos
- RB-02: Solo se cuentan pagos con "Pagado = checked"
- RB-03: Los ingresos son Tipo = Ingreso; egresos son Tipo = Egreso
- RB-04: El desglose por método de pago solo aplica a ingresos

## Criterios de aceptación
- [ ] Veo total de ingresos del período
- [ ] Veo total de egresos del período
- [ ] Veo ganancia neta (ingresos - egresos)
- [ ] Puedo filtrar por semana, mes o rango
- [ ] Veo desglose por método de pago
- [ ] Veo desglose de egresos por categoría

## Fuera de alcance
- Gráficos de tendencias
- Comparación con períodos anteriores
- Proyecciones financieras
- Exportación a hoja de cálculo

---

# System Design Document: HU-19

## Base de datos: Pagos/Finanzas

### Vistas Notion configuradas

| Vista | Tipo | Filtros | Group By | Calculations |
|-------|------|---------|----------|--------------|
| Resumen semanal | Table | Fecha = This week AND Pagado = checked | Tipo | Sum Monto (footer) |
| Resumen mensual | Table | Fecha = This month AND Pagado = checked | Tipo | Sum Monto (footer) |
| Ingresos por método | Board | Tipo = Ingreso AND Fecha = This month AND Pagado = checked | Método pago | Sum Monto |
| Egresos por categoría | Board | Tipo = Egreso AND Fecha = This month | Categoría | Sum Monto |
| Todos los pagos | Table | Pagado = checked | — | — |

### Fórmula: Ganancia neta
Se calcula en el Dashboard principal (HU-21) usando rollups o linked views con filtros. Notion no tiene fórmula nativa que sume condicionalmente, por lo que se usa:
- Vista filtrada de Ingresos → Sum Monto (calculate en footer)
- Vista filtrada de Egresos → Sum Monto (calculate en footer)
- Ganancia = diferencia manual (o fórmula en DB Dashboard si se crea una)

### Rollups en Dashboard (si se implementa como DB separada)

| Propiedad | Tipo | Origen | Función |
|-----------|------|--------|---------|
| Total ingresos mes | Rollup | Pagos (Tipo = Ingreso, Este mes) | Sum |
| Total egresos mes | Rollup | Pagos (Tipo = Egreso, Este mes) | Sum |
| Ganancia neta mes | Fórmula | Total ingresos - Total egresos | Formula |

### Dependencias
- HU-17 (DB Pagos/Finanzas)

### Limitaciones de Notion
- Notion no permite fórmulas que sumen condicionalmente sobre otra DB
- Workaround: usar linked views con filtros y mostrar el cálculo en el footer
- Para ganancia neta automática, se necesitaría una fórmula manual o automatización externa (n8n)
