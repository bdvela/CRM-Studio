from helpers.properties import sel, relation_dual
from helpers.notion_api import create_db


def create_pagos(parent_id, citas_id, clientes_id):
    print("  → Pagos/Finanzas...")
    return create_db(parent_id, "💰 Pagos/Finanzas", "💰", {
        "Concepto": {"title": {}},
        "Fecha": {"date": {}},
        "Monto": {"number": {"format": "number"}},
        "Tipo": sel([
            ("Ingreso", "green"),
            ("Egreso", "red"),
        ]),
        "Categoría": sel([
            ("Servicio", "purple"),
            ("Insumo", "blue"),
            ("Alquiler", "orange"),
            ("Marketing", "pink"),
            ("Comisiones", "yellow"),
            ("Otro", "gray"),
        ]),
        "Tipo pago": sel([
            ("Reserva", "blue"),
            ("Pago completo", "green"),
            ("Pago final", "purple"),
        ]),
        "Método pago": sel([
            ("Efectivo", "green"),
            ("Tarjeta", "blue"),
            ("Transferencia", "gray"),
            ("Yape/Plin", "purple"),
        ]),
        "Cita": relation_dual(citas_id, "Pagos registrados"),
        "Cliente": relation_dual(clientes_id, "Mis ingresos"),
        "Comprobante": {"files": {}},
        "Pagado": {"checkbox": {}},
    })["id"]
