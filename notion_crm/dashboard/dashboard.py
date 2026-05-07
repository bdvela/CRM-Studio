from helpers.blocks import (
    h2, h3, callout, bullet, numbered, toggle, divider, quote, columns
)
from helpers.notion_api import append_blocks


def create_dashboard_shell(parent_id):
    print("  → Dashboard...")
    from helpers.notion_api import create_page
    result = create_page(parent_id, "💆‍♀️ CRM Salón de Belleza", "💆‍♀️", [
        callout(
            "✨ Sistema CRM para salón de belleza. "
            "Clientes → Citas → Pagos: todo interconectado.",
            "💆‍♀️", "blue_background"
        ),
        divider(),
        callout(
            "⏳ Inicializando bases de datos... Refresca la página para ver el dashboard completo.",
            "⏳", "yellow_background"
        ),
    ])
    return result["id"]


def nav_card(emoji, name, db_id):
    """Single navigation callout card."""
    return callout(
        name,
        emoji, "default_background"
    )


def action_card(emoji, title, desc):
    """Quick action callout card."""
    return callout(
        title,
        emoji, "default_background"
    )


def populate_dashboard(dashboard_id, ids):
    print("  → Contenido del Dashboard...")

    blocks = [
        # ── HERO ──────────────────────────────────────────────────────────────
        callout(
            "✨ CRM Salón de Belleza — Clientes, Citas, Staff, Servicios y Pagos. "
            "Todo interconectado con relaciones bidireccionales, rollups y fórmulas.",
            "💆‍♀️", "blue_background"
        ),
        divider(),

        # ── NAVEGACIÓN RÁPIDA (cards en columnas) ─────────────────────────────
        h2("🗺️ Módulos"),

        columns(
            [callout("👩‍💼 Clientes", "👩‍💼", "default_background")],
            [callout("💅 Servicios", "💅", "default_background")],
            [callout("👩‍🎨 Staff/Artists", "👩‍🎨", "default_background")],
            [callout("📅 Citas/Agenda", "📅", "default_background")],
            [callout("💰 Pagos/Finanzas", "💰", "default_background")],
        ),
        divider(),

        # ── FLUJO DE TRABAJO ─────────────────────────────────────────────────
        h2("🚀 Cómo empezar"),
        numbered("💅 Servicios → agrega catálogo con precios y duración"),
        numbered("👩‍🎨 Staff/Artists → registra tu equipo, roles y comisiones"),
        numbered("👩‍💼 Clientes → agrega clientas con datos de contacto"),
        numbered("📅 Citas → crea citas vinculando clienta + servicios + artista + horario"),
        numbered("💰 Pagos → registra reserva (S/10) al agendar y pago final al completar"),
        divider(),

        # ── PROPIEDADES AUTOMÁTICAS (todo colapsable) ─────────────────────────
        h2("⚡ Propiedades automáticas"),

        toggle("👩‍💼 Clientes — calculado automáticamente", [
            bullet("Nº citas → cuenta todas las citas de la clienta"),
            bullet("Total gastado → suma de precios totales de sus citas"),
            bullet("Última visita → fecha de su cita más reciente"),
            bullet("Servicios frecuentes → servicios que más consume"),
            bullet("Días sin visita → fórmula automática"),
        ]),

        toggle("👩‍🎨 Staff/Artists — calculado automáticamente", [
            bullet("Total citas → número total de citas atendidas"),
            bullet("Facturación total → suma de lo que ha generado"),
            bullet("Última cita → su cita más reciente"),
            bullet("Servicios realizados → lista de servicios que ha hecho"),
            bullet("Comisión a pagar → Facturación × % comisión"),
        ]),

        toggle("📅 Citas — calculado automáticamente", [
            bullet("Duración total → suma de duración de servicios seleccionados"),
            bullet("Precio total → suma de precios de servicios seleccionados"),
            bullet("Total pagado → suma de pagos registrados"),
            bullet("Saldo pendiente → Precio total − Total pagado"),
            bullet("Pagado completo → true si saldo <= 0"),
        ]),

        divider(),

        # ── VISTAS RECOMENDADAS (todo colapsable por DB) ─────────────────────
        h2("📊 Vistas a configurar en Notion"),
        callout(
            "La API de Notion no permite crear vistas personalizadas. "
            "Créalas en 2 clics: abre la DB → + Add view → elige tipo.",
            "ℹ️", "gray_background"
        ),

        toggle("📅 Citas — vistas recomendadas", [
            bullet("🗓️ Calendario diario → Calendar, filtro: Fecha y hora = Today"),
            bullet("🗓️ Calendario semanal → Calendar, filtro: Fecha y hora = This week"),
            bullet("🗓️ Calendario mensual → Calendar"),
            bullet("🗂️ Tablero por Estado → Board, agrupar por: Estado"),
            bullet("👩‍🎨 Tablero por Artista → Board, agrupar por: Artista"),
            bullet("📋 Citas de hoy → Table, filtro: Fecha y hora = Today"),
            bullet("⚠️ No-shows → filtro: Estado = No-show"),
            bullet("📆 Próximos 7 días → filtro: Fecha y hora = Next 7 days"),
            bullet("💰 Pendientes de pago → filtro: Completada AND Saldo pendiente > 0"),
        ]),

        toggle("👩‍💼 Clientes — vistas recomendadas", [
            bullet("🖼️ Todas las clientas → Table, orden: Nombre A-Z"),
            bullet("📋 Prospectos → filtro: Estado = Prospecto"),
            bullet("⭐ VIPs → filtro: Estado = VIP"),
            bullet("🔄 Por reactivar (60d) → filtro: Activa AND Última visita > 60 días"),
        ]),

        toggle("💅 Servicios — vistas recomendadas", [
            bullet("📋 Catálogo activo → Table, filtro: Activo = checked"),
            bullet("🗂️ Por categoría → Board, agrupar por: Categoría"),
            bullet("🖼️ Galería → Gallery, mostrar imagen"),
        ]),

        toggle("👩‍🎨 Staff/Artists — vistas recomendadas", [
            bullet("👥 Equipo activo → Table, filtro: Activo = checked"),
            bullet("🗂️ Por rol → Board, agrupar por: Rol"),
        ]),

        toggle("💰 Pagos/Finanzas — vistas recomendadas", [
            bullet("📅 Ingresos este mes → filtro: Ingreso AND This month"),
            bullet("📅 Egresos este mes → filtro: Egreso AND This month"),
            bullet("💳 Por método de pago → Board, agrupar por: Método pago"),
            bullet("📊 Egresos por categoría → Board, agrupar por: Categoría"),
            bullet("⚠️ Reservas pendientes → filtro: Tipo pago = Reserva"),
        ]),

        divider(),

        # ── RELACIONES ───────────────────────────────────────────────────────
        h2("🔗 Relaciones entre bases de datos"),
        bullet("Citas ↔ Clientes (bidireccional)"),
        bullet("Citas ↔ Servicios (bidireccional, multi-select)"),
        bullet("Citas ↔ Staff/Artists (bidireccional)"),
        bullet("Citas ↔ Pagos/Finanzas (bidireccional)"),
        bullet("Pagos/Finanzas ↔ Clientes (bidireccional)"),
        divider(),

        # ── IDs TÉCNICOS ─────────────────────────────────────────────────────
        h2("🔧 IDs de bases de datos (para n8n/automatizaciones)"),
        quote(f"Clientes:       {ids['clientes']}"),
        quote(f"Servicios:      {ids['servicios']}"),
        quote(f"Staff/Artists:  {ids['staff']}"),
        quote(f"Citas:          {ids['citas']}"),
        quote(f"Pagos/Finanzas: {ids['pagos']}"),
    ]

    append_blocks(dashboard_id, blocks)
