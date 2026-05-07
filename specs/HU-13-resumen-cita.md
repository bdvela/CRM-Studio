# Especificación: HU-13 — Ver resumen de cita

## Historia de usuario
**Como** owner del salón, **quiero** ver toda la información de una cita en un solo lugar, **para** tener contexto antes de atender a la clienta.

## Descripción
Al abrir una cita, el owner ve toda la información relevante: clienta, servicios, artista, fecha/hora, estado, precio total, estado de pago, notas, e historial previo de la clienta (nº visitas, última cita).

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner abre una cita desde la lista o el calendario
2. Ve toda la información de la cita en la página
3. Puede ver el historial de la clienta en un linked view embebido

## Criterios de aceptación
- [ ] Veo clienta, servicios, artista, fecha/hora y estado
- [ ] Veo el precio total calculado
- [ ] Veo si el pago está registrado o pendiente
- [ ] Veo notas de la cita
- [ ] Veo historial previo de la clienta (nº visitas, última cita)

## Fuera de alcance
- Vista de impresión de cita
- Envío de resumen a la clienta

---

# System Design Document: HU-13

## Página de Cita (dentro del registro)

### Contenido de la página
```
📋 [Título de la cita]

├── Detalles principales (propiedades)
│   ├── Cliente: [nombre, teléfono]
│   ├── Servicios: [lista]
│   ├── Artista: [nombre, rol]
│   ├── Fecha y hora: [fecha + hora]
│   ├── Duración total: [minutos]
│   ├── Precio total: [monto]
│   ├── Estado: [estado]
│   └── Notas: [texto]
│
├── Estado de pago (linked view)
│   └── Pagos relacionados a esta cita (Tabla: tipo, monto, método, fecha)
│
└── Historial de la clienta (linked view)
    └── Todas las citas de esta clienta (Tabla: fecha, servicios, estado)
```

### Linked views en página de Cita

| Sección | DB | Filtro | Tipo |
|---------|----|--------|------|
| Pagos de esta cita | Pagos/Finanzas | Cita = [Esta página] | Table |
| Historial de clienta | Citas | Cliente = [prop("Cliente")] | Table |

### Propiedades visibles en página
| Propiedad | Visible |
|-----------|---------|
| Título | ✅ |
| Cliente | ✅ |
| Servicios | ✅ |
| Artista | ✅ |
| Fecha y hora | ✅ |
| Duración total | ✅ |
| Precio total | ✅ |
| Estado | ✅ |
| Notas | ✅ |

### Dependencias
- HU-09 (DB Citas)
- HU-17 (DB Pagos/Finanzas)
- HU-04 (historial de clienta)
