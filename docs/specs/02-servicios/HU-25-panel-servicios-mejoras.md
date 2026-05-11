# Historias de Usuario: Mejoras al Panel de Servicios

## Contexto
El panel de servicios actual tiene:
- Precio fijo obligatorio
- Relación indirecta con staff a través de categorías
- Servicios agrupados por categoría pero sin filtro explícito

## Necesidades a cubrir
1. Filtro por categoría + vista general
2. Precio: fijo o variable (desde/hasta)
3. Selección opcional de staff que brinda el servicio

---

## HU-25.1: Filtro por Categoría y Vista General

**Como** Administrador(a) del salón  
**Quiero** filtrar los servicios por categoría o ver todos juntos  
**Para** navegar rápidamente por el catálogo de servicios

### Criterios de Aceptación

#### UI/UX
- [ ] Encima del listado de servicios, hay un dropdown de filtro
- [ ] Opción por defecto: "Vista General" (muestra todos los servicios, agrupados por categoría como actualmente)
- [ ] Al seleccionar una categoría específica:
  - [ ] Solo se muestran servicios de esa categoría
  - [ ] Los servicios ya NO están agrupados (son todos de la misma categoría)
  - [ ] Se muestra un encabezado con el nombre de la categoría y el conteo de servicios
- [ ] El filtro debe ser persistente mientras el usuario esté en la página (no al navegar fuera)

#### Datos
- [ ] El dropdown muestra solo categorías ACTIVAS
- [ ] Cada opción de categoría muestra: `[icono] Nombre de Categoría (X servicios)`
- [ ] "Vista General" muestra: `📋 Vista General (X servicios)`

#### Responsividad
- [ ] En mobile, el dropdown ocupa todo el ancho
- [ ] El filtro va encima del buscador o junto a él

---

## HU-25.2: Precio Fijo o Variable en Servicios

**Como** Administrador(a) del salón  
**Quiero** configurar servicios con precio fijo o precio variable (desde/hasta)  
**Para** reflejar correctamente servicios como "Manicure desde S/ 40" o "Depilación precio según zona"

### Contexto Actual
- Tabla `services` tiene un solo campo `price NUMERIC(10,2)` NOT NULL
- Todos los servicios son de precio fijo

### Necesidades Funcionales

#### Tipos de Precio
1. **Precio Fijo**: El servicio cuesta exactamente X soles (comportamiento actual)
2. **Precio Variable**: El servicio cuesta "desde X hasta Y" soles

#### Casos de Uso Reales
- ✅ Corte de cabello: S/ 80 (fijo)
- ✅ Manicure: desde S/ 40 hasta S/ 80 (variable, depende de esmalte, diseño)
- ✅ Depilación: desde S/ 30 hasta S/ 120 (variable, depende de zona)
- ✅ Tinte: S/ 150 (fijo) o variable según largo de cabello

---

### Criterios de Aceptación

#### Schema de Base de Datos (Cambios Necesarios)

```sql
-- Agregar campos a la tabla services
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_type TEXT NOT NULL DEFAULT 'fixed';
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_from NUMERIC(10,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_to NUMERIC(10,2);

-- Actualizar constraint: price puede ser NULL si price_type es 'variable'
-- (requiere migración cuidadosa)
```

**Nota**: Considerar usar enum o mantener como texto con validación en aplicación.

#### Formulario de Creación/Edición

##### Paso 1: Tipo de Precio
- [ ] Radio buttons o Toggle para seleccionar:
  - [ ] "Precio Fijo" (seleccionado por defecto)
  - [ ] "Precio Variable"

##### Paso 2: Campos según selección

**Si "Precio Fijo":**
- [ ] Muestra campo `Precio (S/)` como actualmente
- [ ] Campo es REQUERIDO (> 0)
- [ ] Los campos `Desde` y `Hasta` están ocultos o deshabilitados

**Si "Precio Variable":**
- [ ] Muestra dos campos:
  - [ ] `Precio Mínimo (Desde S/)`
  - [ ] `Precio Máximo (Hasta S/)`
- [ ] El campo `Precio Fijo` está oculto o deshabilitado
- [ ] Validaciones:
  - [ ] `Desde` es REQUERIDO (> 0)
  - [ ] `Hasta` es OPCIONAL (puede quedar vacío para "desde X sin límite superior")
  - [ ] Si `Hasta` tiene valor: debe ser >= `Desde`
  - [ ] Si `Hasta` está vacío: mostrar "Desde S/ X"

##### Ejemplos Visuales
| Caso | Se muestra como |
|------|-----------------|
| Fijo: S/ 80 | `S/ 80` |
| Variable: Desde 40, Hasta 80 | `S/ 40 - S/ 80` |
| Variable: Desde 30, Hasta vacío | `Desde S/ 30` |

#### Visualización en Cards de Servicios
- [ ] Si precio fijo: mostrar `S/ X` como actualmente
- [ ] Si precio variable:
  - [ ] Mostrar `Desde S/ X` o `S/ X - S/ Y`
  - [ ] Usar un color o estilo ligeramente diferente para indicar que es variable
  - [ ] Agregar un icono pequeño `↔` o badge `Variable`

#### Visualización en Citas
- [ ] Al seleccionar un servicio con precio variable en el formulario de citas:
  - [ ] Mostrar el rango de precios como referencia
  - [ ] PERMITIR ingresar el precio REAL para esa cita específica
  - [ ] El valor por defecto puede ser el `price_from` o el promedio

#### Backward Compatibility
- [ ] Servicios existentes deben seguir funcionando como precio fijo
- [ ] `price_type` default es `'fixed'`
- [ ] Migración: todos los servicios existentes quedan como `price_type = 'fixed'`

---

## HU-25.3: Relación Staff-Servicios (Selección Opcional)

**Como** Administrador(a) del salón  
**Quiero** definir opcionalmente qué miembros del staff pueden brindar cada servicio  
**Para** que al crear citas solo aparezcan los artistas disponibles para ese servicio específico

### Contexto Actual
- **Relación INDIRECTA actual**: `staff → staff_specialties → categories ← services`
- Un miembro del staff tiene especialidades (categorías)
- Un servicio pertenece a una categoría
- Lógica implícita: todo staff con la categoría X puede hacer todos los servicios de categoría X

### Problema a Resolver
Esta relación indirecta es DEMASIADO GENEROSA. Ejemplo:
- Categoría: "Uñas"
- Staff: María (especialidad Uñas), Ana (especialidad Uñas)
- Servicios: Manicure Básico (S/ 40), Uñas Esculpidas (S/ 150)
- **Problema**: María sabe hacer Manicure Básico pero NO Uñas Esculpidas. Ana sabe hacer ambas.
- Con la relación actual: AMBAS aparecen disponibles para AMBOS servicios.

### Solución Propuesta
Mantener la relación indirecta POR DEFECTO, pero PERMITIR selección EXPLÍCITA y OPCIONAL por servicio.

#### Niveles de Especificidad
1. **Nivel Categoría (Default)**: Todo staff con la categoría → puede hacer todos los servicios de esa categoría (comportamiento actual, no requiere configuración)
2. **Nivel Servicio (Opcional)**: Especificar QUÉ staff específicamente puede hacer CADA servicio (sobrescribe el comportamiento por categoría)

---

### Criterios de Aceptación

#### Schema de Base de Datos (Nueva Tabla)

```sql
-- Tabla puente N:M para relación explícita staff-servicios
CREATE TABLE IF NOT EXISTS staff_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, service_id)
);
```

#### Lógica de Negocio

##### ¿Qué staff puede hacer un servicio?
```
SI existe al menos 1 registro en staff_services para este servicio:
  → Solo los staff explícitamente relacionados pueden hacerlo
  → (staff_services tiene prioridad sobre staff_specialties)
SINO:
  → Usar comportamiento por defecto (staff con la categoría via staff_specialties)
```

##### Ejemplos Prácticos

| Servicio | staff_services | staff_specialties (categoría) | ¿Quién puede hacerlo? |
|----------|----------------|-------------------------------|----------------------|
| Manicure Básico | (vacío) | María: Uñas, Ana: Uñas | María + Ana (por categoría) |
| Uñas Esculpidas | Ana + Uñas Esculpidas | María: Uñas, Ana: Uñas | SOLO Ana (explícito) |

#### Formulario de Servicios (Nueva Pestaña)

##### Pestaña 1: Datos Básicos (existente)
- Nombre, Categoría, Duración, Precio (fijo/variable), Descripción

##### Pestaña 2: Staff que Brinda este Servicio (NUEVA)

Contenido de la pestaña:

1. **Explicación clara** (texto de ayuda pequeño):
   > Por defecto, todo miembro del staff con la categoría seleccionada puede brindar este servicio. Si quieres restringirlo a artistas específicos, selecciónalos a continuación.

2. **Toggle/Switch principal**:
   - [ ] "Usar selección por categoría (por defecto)" (ON por defecto)
   - [ ] "Seleccionar artistas específicos para este servicio"

3. **Si Toggle = "Seleccionar artistas específicos"**:
   - [ ] Mostrar lista de CHECKBOXES con TODOS los miembros del staff ACTIVOS
   - [ ] Cada checkbox muestra:
     - `[X] Nombre del Staff (Rol) - Especialidades: Uñas, Cabello`
   - [ ] Preseleccionar automáticamente aquellos staff que tienen la CATEGORÍA del servicio (como sugerencia inteligente)
   - [ ] Usuario puede desmarcar o marcar según necesidad
   - [ ] Validación: al menos UN staff debe estar seleccionado

4. **Si Toggle = "Usar selección por categoría"**:
   - [ ] Mostrar lista DE SOLO LECTURA de staff con la categoría
   - [ ] Mostrar texto: "Estos artistas pueden brindar este servicio porque tienen la categoría [Nombre Categoría]"
   - [ ] Checkboxes deshabilitados o no mostrados

#### Visualización en Panel de Servicios (Cards)
- [ ] Si un servicio tiene selección explícita de staff:
  - [ ] Mostrar un badge pequeño: `[3 artistas]` o similar
  - [ ] Al hacer hover o click, puede expandir para ver quiénes
- [ ] Si usa selección por categoría:
  - [ ] No mostrar badge adicional (comportamiento actual)

#### Integración con Citas
- [ ] Al crear/editar una cita y seleccionar un servicio:
  - [ ] El dropdown de "Artista" debe filtrarse según la lógica de staff_services
  - [ ] Si el servicio tiene staff explícito → solo esos artistas
  - [ ] Si el servicio usa categoría → staff con esa categoría
  - [ ] Esto afecta tanto al artista PRINCIPAL de la cita como a los artistas de CADA servicio en `appointment_services`

#### Integración con Comisiones
- [ ] La tabla `staff_commission_overrides` ya relaciona staff ↔ servicio para excepciones de comisión
- [ ] Esta es COMPLEMENTARIA a `staff_services`:
  - `staff_services`: ¿PUEDE hacer este servicio? (disponibilidad)
  - `staff_commission_overrides`: ¿Cuánto cobra SI lo hace? (comisión)

---

## HU-25.4: Sugerencias Inteligentes en Selección de Staff

**Como** Administrador(a) del salón  
**Quiero** que el sistema me sugiera automáticamente qué staff puede hacer cada servicio  
**Para** no tener que seleccionar manualmente cada vez

### Criterios de Aceptación

#### Al Crear un Servicio Nuevo
- [ ] Usuario selecciona una CATEGORÍA en la Pestaña 1
- [ ] Al pasar a la Pestaña 2 (Staff):
  - [ ] Si el toggle está en "Por categoría": mostrar staff con esa categoría
  - [ ] Si el usuario cambia a "Selección específica":
    - [ ] **PRESELECCIONAR** automáticamente todos los staff que tienen esa categoría
    - [ ] Usuario puede ajustar (desmarcar los que no correspondan)

#### Al Cambiar la Categoría de un Servicio Existente
- [ ] Si el servicio usaba "selección por categoría":
  - [ ] Actualizar automáticamente la lista de staff sugeridos
- [ ] Si el servicio usaba "selección específica":
  - [ ] Mostrar un toast o mensaje de aviso:
    > "Cambiaste la categoría. ¿Quieres actualizar la lista de artistas sugeridos?"
  - [ ] Opciones: [Actualizar sugerencias] [Mantener selección actual]

---

## Resumen de Cambios Necesarios

### Base de Datos
1. **Migración**: Agregar campos a `services`
   - `price_type TEXT NOT NULL DEFAULT 'fixed'`
   - `price_from NUMERIC(10,2)`
   - `price_to NUMERIC(10,2)`

2. **Nueva tabla**: `staff_services` (N:M staff ↔ services)

### Código
1. **Panel de Servicios**:
   - Agregar filtro por categoría en el listado
   - Modificar formulario: toggle precio fijo/variable + campos correspondientes
   - Agregar pestaña "Staff que Brinda este Servicio"
   - Modificar visualización de cards para mostrar precio variable

2. **Panel de Citas**:
   - Al seleccionar servicio, filtrar artistas según `staff_services` o `staff_specialties`

3. **Queries**:
   - `getStaffForService(serviceId)`: lógica de prioridad (staff_services > staff_specialties)
   - Actualizar CRUD de services para incluir nuevos campos
   - CRUD para staff_services

4. **Tipos TypeScript**:
   - Actualizar `Service`, `ServiceInsert` en `types/database.ts`
   - Agregar `StaffService`, `StaffServiceInsert`

### Orden de Implementación
1. ✅ Crear migración de BD (campos precio + tabla staff_services)
2. ✅ Actualizar tipos TypeScript
3. ✅ Filtro por categoría en listado (HU-25.1)
4. ✅ Precio fijo/variable en formulario y visualización (HU-25.2)
5. ✅ Nueva pestaña de Staff en formulario (HU-25.3)
6. ✅ Integración con citas (filtrado de artistas)
7. ✅ Sugerencias inteligentes (HU-25.4)
