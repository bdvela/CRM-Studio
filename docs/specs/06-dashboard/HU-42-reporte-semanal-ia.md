# Especificación: HU-42 — Reporte ejecutivo semanal con IA (Push + WhatsApp)

> **Estado:** 📝 Propuesta
> **Prioridad:** Alta
> **Estimación:** 5 días (Fase 1: 3 días · Fase 2: 2 días)
> **Dependencias:** ninguna (queries existentes + nuevo canal WhatsApp Cloud API)

---

## 1. Historia de usuario

**Como** owner del salón,
**quiero** recibir cada lunes a las 8:00 am un resumen automático e inteligente de la semana anterior,
**para** tomar decisiones rápidas sin tener que abrir la app ni armar reportes manualmente.

---

## 2. Contexto y motivación

Hoy Araceli no tiene una vista consolidada de la semana. Para saber cómo le fue tiene que:
- Abrir `/pagos` y revisar ingresos
- Abrir `/citas` y contar
- Cruzar mentalmente con la semana previa
- Recordar qué clientas no han vuelto

Esto consume ~30 min cada lunes y no se hace consistentemente. Sin medición no hay decisión.

**Hipótesis de valor:**
1. Una narrativa generada por IA (no solo números) le hace ver patrones que ella no ve.
2. Recibirlo en WhatsApp aprovecha el canal que ya abre 50+ veces al día.
3. Una notificación push asegura que lo vea aunque el WhatsApp falle.

---

## 3. Actores

- **Owner/Manager** (Araceli) — receptora del reporte, navega al detalle.
- **Sistema** (cron + edge function) — genera, redacta y envía.

---

## 4. Flujo principal

### 4.1 Generación (lunes 8:00 am Lima)

1. `pg_cron` dispara edge function `weekly-report` los lunes 8:00 am `America/Lima`.
2. Edge function recolecta métricas de la semana anterior (lun 00:00 → dom 23:59).
3. Detecta alertas (clientes inactivos, stock crítico, días saturados).
4. Llama a Claude API con datos estructurados → genera narrativa en español.
5. Guarda el reporte en tabla `weekly_reports` con narrativa, métricas raw y `short_code` (slug corto para link).
6. Envía notificación push PWA + mensaje WhatsApp template (Fase 2).

### 4.2 Recepción

**Push PWA:**
- Notificación con título `📊 Tu resumen semanal está listo` y preview de ingresos.
- Tap → abre `/reportes/semanal/[short_code]`.

**WhatsApp template (Fase 2):**
- Mensaje corto pre-aprobado con métricas clave y link.
- Tap link → abre PWA en `/reportes/semanal/[short_code]`.

### 4.3 Consumo

1. Araceli abre la página `/reportes/semanal/[short_code]`.
2. Lee narrativa con insights generados por IA.
3. Ve gráficos de tendencias (ingresos, citas, top servicios).
4. Revisa lista de alertas accionables.
5. Puede navegar a `/reportes/semanal` (índice histórico) para comparar con semanas anteriores.

---

## 5. Criterios de aceptación

### 5.1 Generación
- [ ] Cron dispara los lunes 8:00 am hora de Lima (`America/Lima`), tolerante a horario de verano.
- [ ] Si la generación falla, reintenta automáticamente hasta 3 veces con backoff.
- [ ] Cada reporte queda persistido en `weekly_reports` con timestamp y `short_code` único.
- [ ] El reporte cubre exactamente lunes 00:00 → domingo 23:59 de la semana previa.

### 5.2 Métricas obligatorias
- [ ] Ingresos totales y % vs semana anterior.
- [ ] Egresos totales y ganancia neta.
- [ ] Citas: completadas, no-show, canceladas.
- [ ] Top 3 artistas por facturación (con S/ y N° de servicios).
- [ ] Top 3 servicios por demanda.
- [ ] Día con más ingresos y día con menos.
- [ ] Nuevas clientes registradas.

### 5.3 Alertas inteligentes
- [ ] Lista de clientes activas/VIP que pasaron 1.5x su frecuencia habitual sin volver.
- [ ] Artistas con agenda al 90%+ por 3 días consecutivos (señal de capacidad).
- [ ] Días con baja ocupación que podrían beneficiarse de campañas.
- [ ] Servicios cuyo margen real bajó vs promedio mensual.

### 5.4 Narrativa IA
- [ ] Texto generado por Claude API, máx 200 palabras, tono cálido y directo.
- [ ] Incluye al menos 1 insight no obvio (no solo recitar números).
- [ ] En español peruano natural (no "vosotros", no "asegúrate de").
- [ ] Si las métricas son malas, lo dice con respeto, no minimiza.

### 5.5 Canal Push
- [ ] La notificación se envía si Araceli tiene la PWA instalada y permisos otorgados.
- [ ] Funciona en iOS Safari (PWA standalone) y Android Chrome.
- [ ] Tap abre la app directamente en el reporte de esa semana.

### 5.6 Canal WhatsApp (Fase 2)
- [ ] Template aprobado por Meta y registrado en el sistema.
- [ ] Mensaje llega al número personal de Araceli desde un número dedicado del negocio.
- [ ] Variables se rellenan correctamente (ingresos, delta, citas, alertas, link).
- [ ] Si Meta rechaza o falla envío, queda log en `weekly_report_deliveries` con el error.
- [ ] Push se envía igual aunque WhatsApp falle (canales independientes).

### 5.7 Página `/reportes/semanal/[short_code]`
- [ ] Mobile-first, responsive en iPad y desktop.
- [ ] Sigue el design system existente (no nuevos colores/tipografía).
- [ ] Carga en menos de 1.5s desde 3G simulado.
- [ ] Si el reporte no existe, muestra `not-found` con link al último disponible.

### 5.8 Índice `/reportes/semanal`
- [ ] Lista de reportes históricos ordenados por fecha descendente.
- [ ] Cada item muestra preview: rango de fechas, ingreso, delta.
- [ ] Paginación 10 por página.

---

## 6. Fuera de alcance

- Reportes diarios o mensuales (esta HU es semanal).
- Exportación a PDF o Excel.
- Mensaje de WhatsApp bidireccional (responder "más detalle"). Va en HU-43.
- Reportes por artista individuales (cada uno solo ve sus propias métricas).
- Comparación interanual o tendencias > 8 semanas.

---

# System Design Document: HU-42

## 7. Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                       pg_cron (Supabase)                        │
│           Trigger: lunes 8:00 am America/Lima                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP POST
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│        Edge Function: weekly-report                             │
│                                                                 │
│  1. collectMetrics(weekStart, weekEnd) ──▶ PostgreSQL queries  │
│  2. detectAlerts(metrics) ──▶ reglas + thresholds              │
│  3. generateNarrative(metrics, alerts) ──▶ Claude API          │
│  4. persistReport() ──▶ INSERT weekly_reports                  │
│  5. dispatch(['push', 'whatsapp'])                             │
│                                                                 │
└───────────┬─────────────────────────────────────┬───────────────┘
            │                                     │
            ▼                                     ▼
   ┌────────────────┐                  ┌──────────────────────┐
   │ Web Push API   │                  │ WhatsApp Cloud API   │
   │ (VAPID)        │                  │ (Meta Graph API)     │
   └────────┬───────┘                  └──────────┬───────────┘
            │                                     │
            ▼                                     ▼
   ┌────────────────┐                  ┌──────────────────────┐
   │ Service Worker │                  │ WhatsApp de Araceli  │
   │ (Serwist)      │                  │ (recibe template)    │
   └────────┬───────┘                  └──────────────────────┘
            │
            ▼
   ┌────────────────┐
   │  PWA notif     │
   │  Tap → /reportes/semanal/[code]
   └────────────────┘
```

---

## 8. Base de datos

### 8.1 Nuevas tablas

```sql
-- Reportes semanales generados
CREATE TABLE weekly_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  week_start      DATE NOT NULL,
  week_end        DATE NOT NULL,
  short_code      TEXT NOT NULL UNIQUE,
  metrics         JSONB NOT NULL,
  alerts          JSONB NOT NULL,
  narrative       TEXT NOT NULL,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generation_ms   INTEGER,
  llm_model       TEXT,
  llm_input_tokens  INTEGER,
  llm_output_tokens INTEGER,
  UNIQUE (business_id, week_start)
);

CREATE INDEX idx_weekly_reports_business_date
  ON weekly_reports (business_id, week_start DESC);

-- Bitácora de envíos (push + whatsapp)
CREATE TABLE weekly_report_deliveries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id       UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
  channel         TEXT NOT NULL CHECK (channel IN ('push', 'whatsapp', 'email')),
  recipient       TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
  provider_msg_id TEXT,
  error           TEXT,
  sent_at         TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deliveries_report ON weekly_report_deliveries (report_id);

-- Suscripciones push por usuario (PWA)
CREATE TABLE push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX idx_push_subs_user ON push_subscriptions (user_id);

-- Configuración WhatsApp por negocio (Fase 2)
CREATE TABLE whatsapp_config (
  business_id      UUID PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
  phone_number_id  TEXT NOT NULL,
  template_name    TEXT NOT NULL,
  template_lang    TEXT NOT NULL DEFAULT 'es',
  recipient_phone  TEXT NOT NULL,
  active           BOOLEAN NOT NULL DEFAULT true,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.2 Migración

`HU-42-weekly-reports.sql` en `supabase/migrations/`.

### 8.3 RLS

```sql
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_report_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Solo authenticated del negocio puede leer sus reportes
CREATE POLICY "members_read_reports" ON weekly_reports
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid()));

-- Solo el usuario dueño de la suscripción accede
CREATE POLICY "user_own_push_subs" ON push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Service role escribe todo (edge function)
-- (no se crea política, service role bypasses RLS)
```

---

## 9. Edge Function: `weekly-report`

### 9.1 Estructura

```
supabase/functions/weekly-report/
├── index.ts                    # entry point HTTP
├── lib/
│   ├── metrics.ts              # collectMetrics()
│   ├── alerts.ts               # detectAlerts()
│   ├── narrative.ts            # generateNarrative() — Claude API
│   ├── push.ts                 # sendPushNotification()
│   ├── whatsapp.ts             # sendWhatsAppTemplate()
│   └── shortcode.ts            # generateShortCode()
└── deno.json
```

### 9.2 Métricas a calcular

```typescript
interface WeeklyMetrics {
  range: { start: string; end: string };
  revenue: {
    total: number;
    prevWeek: number;
    deltaPct: number;
    byDay: Array<{ date: string; amount: number }>;
    byMethod: Record<PaymentMethod, number>;
  };
  expenses: { total: number; byCategory: Record<PaymentCategory, number> };
  netProfit: number;
  appointments: {
    completed: number;
    noShow: number;
    cancelled: number;
    avgTicket: number;
  };
  topArtists: Array<{ id: string; name: string; revenue: number; count: number }>;
  topServices: Array<{ id: string; name: string; count: number; revenue: number }>;
  bestDay: { date: string; amount: number };
  worstDay: { date: string; amount: number };
  newClients: number;
  occupancyByArtist: Array<{ id: string; name: string; ratio: number }>;
}
```

### 9.3 Alertas

```typescript
interface Alert {
  severity: 'info' | 'warning' | 'critical';
  type: string;
  title: string;
  description: string;
  actionUrl?: string;
}

// Reglas
// 1. Cliente VIP/activa con (días sin volver) > frecuencia_promedio * 1.5
// 2. Artista con ocupación ≥ 90% por 3+ días → capacidad
// 3. Días con < 30% ocupación → oportunidad campaña
// 4. Servicio cuyo margen cayó ≥ 20% vs mes
// 5. Stock de insumo crítico (si HU futura lo registra)
```

### 9.4 Narrativa con Claude

```typescript
const SYSTEM_PROMPT = `
Eres asesor de negocio para un salón de belleza en Lima, Perú.
Hablas con la dueña directamente. Tono cálido, directo, sin tecnicismos.
Español peruano natural. Sin "vosotros" ni "asegúrate de".
Máximo 180 palabras.

Estructura:
1. Apertura honesta (cómo fue la semana)
2. Un dato destacado (lo mejor o lo más sorprendente)
3. Una alerta accionable (lo más urgente que debe atender)
4. Cierre con una pregunta o sugerencia concreta

No saludos genéricos. Empieza directo con el dato.
Si la semana fue mala, dilo con respeto. No minimices.
`;

const userPrompt = `
Métricas: ${JSON.stringify(metrics)}
Alertas: ${JSON.stringify(alerts)}
`;

// Modelo: claude-haiku-4-5-20251001 (rápido y barato para esta tarea)
// Caching: cache el system prompt
```

### 9.5 Triggers (pg_cron)

```sql
SELECT cron.schedule(
  'weekly-report-trigger',
  '0 13 * * 1',  -- 13:00 UTC = 8:00 am Lima
  $$
  SELECT net.http_post(
    url := current_setting('app.edge_function_url') || '/weekly-report',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

---

## 10. Frontend

### 10.1 Rutas nuevas

| Ruta | Tipo | Propósito |
|------|------|-----------|
| `/reportes/semanal` | Server + Client | Índice histórico de reportes |
| `/reportes/semanal/[code]` | Server + Client | Detalle de un reporte específico |

### 10.2 Estructura archivos

```
app/src/app/reportes/semanal/
├── page.tsx                          # Server: lista reportes
├── page-client.tsx                   # Client: filtros, navegación
├── layout.tsx
├── loading.tsx
└── [code]/
    ├── page.tsx                      # Server: fetch reporte por short_code
    └── page-client.tsx               # Client: gráficos, narrativa

app/src/components/reportes/
├── WeeklyReportNarrative.tsx         # Narrativa con tipografía editorial
├── WeeklyReportMetrics.tsx           # Stat cards + delta vs prev
├── WeeklyReportChart.tsx             # Ingresos por día (sparkline simple)
├── WeeklyReportAlerts.tsx            # Lista de alertas con iconos por severidad
├── WeeklyReportArtistsTable.tsx
└── WeeklyReportServicesTable.tsx
```

### 10.3 Push notification setup

```
app/src/lib/push/
├── subscribe.ts                      # registerServiceWorker + subscribe
├── unsubscribe.ts
└── vapid.ts                          # public key handling
```

Flujo:
1. Al hacer login por primera vez, banner sutil "¿Recibir resumen semanal?".
2. Si acepta → `Notification.requestPermission()` → suscribe → POST `/api/push/subscribe`.
3. Server guarda en `push_subscriptions`.

### 10.4 Service Worker

Extender `sw.ts` (Serwist) para escuchar `push` events:

```typescript
self.addEventListener('push', (event) => {
  const data = event.data?.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: { url: data.url },
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

---

## 11. WhatsApp Cloud API (Fase 2)

### 11.1 Setup Meta Business

1. Crear cuenta en `business.facebook.com`.
2. Crear app tipo "Business" en `developers.facebook.com`.
3. Agregar producto "WhatsApp".
4. Conectar número del chip prepago comprado (debe estar libre de WhatsApp previo o desinstalado).
5. Verificar número por SMS o llamada.
6. Generar token de acceso permanente del System User.

### 11.2 Template a registrar

**Nombre:** `weekly_report_v1`
**Categoría:** UTILITY
**Idioma:** Spanish (es)

**Body:**
```
Hola Ara ✨ Tu resumen semanal está listo.

💰 S/ {{1}} esta semana ({{2}})
👥 {{3}} citas completadas
⚠️ {{4}} alertas requieren tu atención

Ver detalle completo: {{5}}
```

Variables:
- `{{1}}` — ingresos formateados (ej: `3,240`)
- `{{2}}` — delta vs prev (ej: `+12% vs sem anterior`)
- `{{3}}` — N° de citas (ej: `47`)
- `{{4}}` — N° de alertas (ej: `3`)
- `{{5}}` — URL con short_code

### 11.3 Envío

```typescript
async function sendWhatsAppTemplate(report: WeeklyReport, config: WhatsAppConfig) {
  const body = {
    messaging_product: 'whatsapp',
    to: config.recipient_phone,
    type: 'template',
    template: {
      name: config.template_name,
      language: { code: config.template_lang },
      components: [{
        type: 'body',
        parameters: [
          { type: 'text', text: formatCurrency(report.metrics.revenue.total) },
          { type: 'text', text: formatDelta(report.metrics.revenue.deltaPct) },
          { type: 'text', text: String(report.metrics.appointments.completed) },
          { type: 'text', text: String(report.alerts.length) },
          { type: 'text', text: `${APP_URL}/reportes/semanal/${report.short_code}` },
        ],
      }],
    },
  };

  const res = await fetch(
    `https://graph.facebook.com/v18.0/${config.phone_number_id}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('WHATSAPP_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  // Persistir delivery con resultado
}
```

### 11.4 Secrets requeridos

```
WHATSAPP_TOKEN=EAAxxx...           # System User access token
WHATSAPP_PHONE_NUMBER_ID=123...    # ID del número del bot
VAPID_PUBLIC_KEY=B...              # generado con web-push
VAPID_PRIVATE_KEY=...
APP_URL=https://crm-studio.app
```

---

## 12. Plan de implementación

### Fase 1 — Push PWA + Reporte base (3 días)

**Día 1 — Backend**
- Migración SQL: `weekly_reports`, `weekly_report_deliveries`, `push_subscriptions` + RLS.
- Edge function skeleton + `collectMetrics()` con queries.
- Tests unitarios de métricas con datos seed.

**Día 2 — IA + Push**
- `detectAlerts()` con reglas.
- `generateNarrative()` con Claude API + caching del system prompt.
- Setup VAPID keys + `sendPushNotification()`.
- API route `/api/push/subscribe`.

**Día 3 — Frontend**
- Páginas `/reportes/semanal` y `/reportes/semanal/[code]`.
- Componentes (narrativa, métricas, alertas, gráficos).
- Banner de opt-in para push.
- Trigger `pg_cron` configurado.
- Test E2E manual: trigger manual de edge function, verificar push llega.

### Fase 2 — WhatsApp Cloud API (2 días)

**Día 4 — Setup Meta + template**
- Bryan compra chip prepago, recibe el número.
- Crear Meta Business Account + app.
- Conectar número, verificar.
- Crear template `weekly_report_v1`, enviar a aprobación.
- Mientras Meta aprueba (24-48h): implementar `sendWhatsAppTemplate()` + tabla `whatsapp_config`.

**Día 5 — Integración + QA**
- Una vez aprobado el template: envío de prueba a Araceli.
- Integrar canal WhatsApp en edge function (después de push).
- Manejo de errores: si WA falla, push sigue.
- Página admin para configurar número receptor (opcional, puede ser hardcoded en config primero).

---

## 13. Métricas de éxito

- [ ] Araceli abre el reporte ≥ 3 de 4 lunes en el primer mes.
- [ ] Tiempo de generación < 15 segundos.
- [ ] Tasa de entrega push ≥ 95%.
- [ ] Tasa de entrega WhatsApp ≥ 98% (template approved + número válido).
- [ ] Araceli reporta cualitativamente que el reporte le sirvió ≥ 3 de 4 semanas.

---

## 14. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Meta rechaza el template | Alto | Tener 2 variantes redactadas para reenviar; mientras tanto, push funciona solo |
| Token WhatsApp expira | Medio | Usar System User token (no caduca) en lugar de user token |
| Claude genera narrativa con datos inventados | Alto | Prompt estricto + validación de entidades; logs para revisar primer mes |
| Costo Claude crece | Bajo | Haiku barato (~$0.001/reporte); cache prompt; máx 1 reporte/semana/negocio |
| Push iOS Safari no funciona | Medio | iOS 16.4+ requerido; documentar; WhatsApp como backup |
| pg_cron no dispara | Alto | Healthcheck domingo 8pm que verifica que el último reporte sea ≤ 8 días; alerta a Bryan |

---

## 15. Trabajo futuro (no en HU-42)

- **HU-43:** Reporte bidireccional. Araceli responde "más detalle" o "ingresos del mes" → bot abre ventana 24h y responde con datos.
- **HU-44:** Reporte diario opcional (resumen del día previo a las 9pm).
- **HU-45:** Reporte mensual ejecutivo con comparativa vs meses anteriores.
- **HU-46:** Reportes por artista (cada uno ve los suyos).
- **HU-47:** Sugerencias accionables que se conviertan en items de TODO en la app.

---

## 16. Decisiones técnicas

### ¿Por qué Claude Haiku y no Sonnet/Opus?
La tarea es bien definida (resumir datos numéricos a narrativa corta). Haiku es 10x más barato y suficientemente bueno. Costo por reporte: ~$0.001.

### ¿Por qué Web Push y no Firebase Cloud Messaging?
Ya tienes Serwist y service worker. Web Push estándar funciona sin dependencia extra de Google. iOS Safari 16.4+ lo soporta.

### ¿Por qué template y no mensaje libre?
Mensaje libre requiere que el usuario inicie conversación dentro de 24h. Para reportes programados eso no funciona. Template está siempre disponible.

### ¿Por qué chip prepago propio y no Twilio?
Costo: Twilio cobra ~$1.50/mes por número virtual + por mensaje. Chip propio: ~S/5/mes (mantener línea activa). A largo plazo, chip propio escala mejor si se suman más clientes del CRM (multi-tenant).

### ¿Por qué `short_code` y no UUID en la URL?
UUIDs son largos (36 chars) y feos en WhatsApp. Short codes (6-8 chars alfanuméricos) caben mejor en el template y se ven profesionales.
