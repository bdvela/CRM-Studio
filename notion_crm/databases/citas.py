from helpers.properties import sel, relation_dual, rollup, formula
from helpers.notion_api import create_db


def create_citas(parent_id, clientes_id, servicios_id, staff_id):
    print("  → Citas...")
    return create_db(parent_id, "📅 Citas", "📅", {
        "Título": {"title": {}},
        "Cliente": relation_dual(clientes_id, "Historial citas"),
        "Servicios": relation_dual(servicios_id, "Citas con este servicio"),
        "Artista": relation_dual(staff_id, "Mis citas"),
        "Fecha y hora": {"date": {}},
        "Estado": sel([
            ("Programada", "blue"),
            ("En curso", "yellow"),
            ("Completada", "green"),
            ("Cancelada", "red"),
            ("No-show", "orange"),
        ]),
        "Notas": {"rich_text": {}},
    })["id"]


def add_rollups_citas(citas_id, pagos_id):
    print("  → Rollups en Citas...")
    from helpers.notion_api import update_db

    update_db(citas_id, {
        "Duración total": rollup("Servicios", "Duración", "sum"),
        "Precio total": rollup("Servicios", "Precio", "sum"),
        "Total pagado": rollup("Pagos registrados", "Monto", "sum"),
        "Saldo pendiente": formula(
            'max(0, prop("Precio total") - prop("Total pagado"))'
        ),
        "Pagado completo": formula(
            'prop("Saldo pendiente") <= 0'
        ),
    })
