from helpers.properties import sel, rollup, formula
from helpers.notion_api import create_db


def create_clientes(parent_id):
    print("  → Clientes...")
    return create_db(parent_id, "👩‍💼 Clientes", "👩‍💼", {
        "Nombre": {"title": {}},
        "Teléfono": {"phone_number": {}},
        "Email": {"email": {}},
        "Instagram": {"url": {}},
        "Estado": sel([
            ("Prospecto", "yellow"),
            ("Activa", "green"),
            ("Inactiva", "gray"),
            ("VIP", "purple"),
        ]),
        "Notas": {"rich_text": {}},
        "Foto": {"files": {}},
    })["id"]


def add_rollups_clientes(clientes_id):
    print("  → Rollups en Clientes...")
    from helpers.notion_api import update_db
    from helpers.properties import rollup, formula

    update_db(clientes_id, {
        "Nº citas": rollup("Historial citas", "Título", "count"),
        "Total gastado": rollup("Historial citas", "Precio total", "sum"),
        "Última visita": rollup("Historial citas", "Fecha y hora", "latest_date"),
        "Servicios frecuentes": rollup("Historial citas", "Servicios", "show_unique"),
        "Días sin visita": formula(
            'if(prop("Última cita"), dateBetween(now(), prop("Última cita"), "days"), "Sin visitas")'
        ),
    })
