from helpers.properties import sel, multisel, rollup, formula
from helpers.notion_api import create_db


def create_staff(parent_id):
    print("  → Staff/Artists...")
    return create_db(parent_id, "👩‍🎨 Staff/Artists", "👩‍🎨", {
        "Nombre": {"title": {}},
        "Teléfono": {"phone_number": {}},
        "Rol": sel([
            ("Nail Artist", "purple"),
            ("Lashista", "pink"),
            ("Pedicurista", "blue"),
            ("Maquillista", "red"),
            ("Otro", "gray"),
        ]),
        "Especialidades": multisel([
            ("Sistema de uñas", "purple"),
            ("Pedicura", "blue"),
            ("Makeup", "pink"),
            ("Pestañas", "orange"),
            ("Cejas", "yellow"),
        ]),
        "Comisión (%)": {"number": {"format": "number"}},
        "Horario": {"rich_text": {}},
        "Foto": {"files": {}},
        "Activo": {"checkbox": {}},
    })["id"]


def add_rollups_staff(staff_id):
    print("  → Rollups en Staff/Artists...")
    from helpers.notion_api import update_db

    update_db(staff_id, {
        "Total citas": rollup("Mis citas", "Título", "count"),
        "Facturación total": rollup("Mis citas", "Precio total", "sum"),
        "Última cita": rollup("Mis citas", "Fecha y hora", "latest_date"),
        "Servicios realizados": rollup("Mis citas", "Servicios", "show_unique"),
        "Comisión a pagar": formula(
            'prop("Facturación total") * prop("Comisión (%)") / 100'
        ),
    })
