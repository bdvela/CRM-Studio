# Especificación: HU-28 — Sección de Comisiones por Artista

## Historia de usuario
> Como dueña del negocio, quiero poder ver las comisiones calculadas por cada artista y cuánto le corresponde al studio, y poder filtrarlas por rango de fechas, para saber cuánto pagarles a cada una y cuánto queda para el studio.

## Descripción
La dueña accede a la pestaña **Comisiones** dentro de Pagos. Ve un resumen con 4 tarjetas de estadísticas (ingreso total, comisión de artistas, share del studio, servicios realizados). Debajo, un panel de filtros con búsqueda por nombre de artista, un rango de fechas con dos selectores de calendario (Desde / Hasta) y botones de rango rápido (7, 30, 90 días). La lista de artistas se muestra en cards clickeables con avatar, nombre, servicios realizados, ingreso generado, comisión del artista, share del studio y una barra visual de distribución. Al hacer clic en una card, navega al detalle del artista. Si no hay datos para el rango, se muestra un estado vacío. Los datos se refrescan automáticamente cada 60 segundos.

## Actores
- **Dueña / Founder**: ve el reporte completo de comisiones y el share del studio.
- **Artista**: no accede directamente a esta vista, pero sus datos se reflejan en las cards.

## Flujo principal
1. La dueña navega a **Pagos** → pestaña **Comisiones**.
2. Al entrar, se muestra el rango por defecto: **desde inicio del mes actual** hasta **hoy**.
3. Se cargan los datos con un indicador de carga (skeleton de 3 barras).
4. Se muestran 4 tarjetas de resumen (stats): Ingreso Total, Comisión Artistas, Share Studio, Servicios Realizados.
5. Se muestra el panel de filtros con:
   - Buscador de artista (campo de texto con ícono de lupa)
   - Selector de fecha **Desde** (calendario popover)
   - Texto conector "al"
   - Selector de fecha **Hasta** (calendario popover)
   - Botones de rango rápido: 7 días, 30 días, 90 días
6. Debajo, la lista de artistas en cards (grid de 1 o 2 columnas según pantalla).
7. Al hacer clic en una card de artista, navega a `/staff/[id]`.
8. Si no hay datos para el rango, se muestra estado vacío.

## Flujos alternativos / casos borde

- **Fecha Desde mayor que Hasta**: el sistema muestra un mensaje de advertencia ("La fecha Desde no puede ser mayor que la fecha Hasta") y no ejecuta la consulta hasta que se corrija.

- **Rango rápido presionado**: los botones 7/30/90 días fijan **Hasta = hoy** y **Desde = hoy - N días**. Reemplazan cualquier selección manual previa.

- **Búsqueda sin resultados**: se muestra el estado vacío con texto "No hay artistas que coincidan".

- **Rango sin datos**: se muestra el estado vacío con texto "No hay datos de comisiones para este período".

- **Una sola fecha cambiada**: al cambiar solo Desde (o solo Hasta), los datos se recargan inmediatamente. No se requiere confirmación ni botón "Aplicar".

- **Selector de fecha abierto en modal**: el calendario popover debe renderizarse vía portal (`createPortal`) para no quedar recortado por el `overflow-y-auto` del modal contenedor.

- **Carga inicial lenta**: se muestra skeleton de 3 barras animadas mientras se espera la respuesta.

- **Error de conexión**: si la consulta falla, se muestra el estado vacío (el error se maneja silenciosamente para no interrumpir la experiencia).

## Reglas de negocio

- **Rango por defecto**: `Desde = primer día del mes actual`, `Hasta = hoy`.
- **Validación de rango**: `Desde ≤ Hasta`. Si no se cumple, no se ejecuta consulta.
- **Recarga automática**: al cambiar Desde o Hasta individualmente, se dispara la consulta. También cada 60s con stale-while-revalidate.
- **Búsqueda**: client-side, sin distinción de mayúsculas/minúsculas, coincidencia parcial sobre `artist_name`.
- **Fundadora**: Araceli Zevallos (rol "Dueña") se muestra con badge "Studio" y avatar en gradiente ámbar. El resto de artistas usan gradiente rosado (salon).
- **Distribución**: barra de progreso visual con porcentaje artista vs studio. Si `total_service_revenue = 0`, no se muestra la barra.
- **Navegación**: cards clickeables → `/staff/[id]`. Si `artist_id` es nulo, la card no es clickeable.

## Criterios de aceptación

- [ ] Al cargar la pestaña, el rango de fechas por defecto es desde el inicio del mes actual hasta hoy, y los datos se muestran correctamente.
- [ ] Al cambiar la fecha **Desde** en el calendario, los datos se recargan inmediatamente con el nuevo rango.
- [ ] Al cambiar la fecha **Hasta** en el calendario, los datos se recargan inmediatamente con el nuevo rango.
- [x] Si **Desde > Hasta**, se muestra un mensaje de advertencia y no se ejecuta la consulta.
- [ ] Al presionar "7 días", Desde = hoy - 7 y Hasta = hoy, y los datos se recargan.
- [ ] Al presionar "30 días", Desde = hoy - 30 y Hasta = hoy, y los datos se recargan.
- [ ] Al presionar "90 días", Desde = hoy - 90 y Hasta = hoy, y los datos se recargan.
- [ ] El buscador filtra artistas por nombre en tiempo real, sin distinción de mayúsculas/minúsculas.
- [ ] Las 4 tarjetas de resumen reflejan los totales correctos del rango activo.
- [ ] Las cards de artista muestran: servicios, ingreso, comisión, share y barra de distribución.
- [ ] La fundadora se identifica con badge "Studio" y avatar ámbar.
- [ ] Al hacer clic en una card de artista, navega a `/staff/[id]`.
- [ ] Si no hay datos, se muestra estado vacío con texto descriptivo.
- [ ] Las tarjetas y cards tienen animación de entrada staggered.
- [ ] El calendario popover no se recorta dentro del modal (usa portal).
- [ ] Los datos se refrescan automáticamente cada 60 segundos.

## Fuera de alcance
- Exportar el reporte de comisiones a PDF/Excel.
- Enviar las comisiones por correo a las artistas.
- Filtrar por categoría de servicio en esta vista.
- Comparar comisiones entre dos períodos.
- Editar comisiones desde esta vista.
- Acceso de artistas a esta sección (solo dueña).
