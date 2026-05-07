from helpers.properties import sel
from helpers.notion_api import create_db


def create_servicios(parent_id):
    print("  → Servicios...")
    return create_db(parent_id, "💅 Servicios", "💅", {
        "Servicio": {"title": {}},
        "Categoría": sel([
            ("Sistema de uñas", "purple"),
            ("Pedicura", "blue"),
            ("Makeup", "pink"),
            ("Pestañas", "orange"),
            ("Cejas", "yellow"),
        ]),
        "Duración": {"number": {"format": "number"}},
        "Precio": {"number": {"format": "number"}},
        "Descripción": {"rich_text": {}},
        "Imagen referencia": {"files": {}},
        "Activo": {"checkbox": {}},
    })["id"]
