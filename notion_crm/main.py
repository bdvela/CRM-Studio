"""
CRM Salón de Belleza — Notion API
5 bases de datos + relaciones bidireccionales + rollups + fórmulas + dashboard

Uso:
  cp .env.example .env   # edita con tus credenciales
  source .env
  python main.py
"""

import sys
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

sys.path.insert(0, os.path.dirname(__file__))

from helpers.notion_api import PARENT_ID
from databases.clientes import create_clientes, add_rollups_clientes
from databases.servicios import create_servicios
from databases.staff import create_staff, add_rollups_staff
from databases.citas import create_citas, add_rollups_citas
from databases.pagos import create_pagos
from dashboard.dashboard import create_dashboard_shell, populate_dashboard


def main():
    print("\n🚀 CRM Salón de Belleza — Notion API\n")

    print("🏠 Creando Dashboard...")
    dashboard_id = create_dashboard_shell(PARENT_ID)

    print("\n📁 Creando bases de datos...")

    # Fase 1: DBs independientes
    clientes_id = create_clientes(dashboard_id)
    servicios_id = create_servicios(dashboard_id)
    staff_id = create_staff(dashboard_id)

    # Fase 2: DBs con relaciones
    citas_id = create_citas(dashboard_id, clientes_id, servicios_id, staff_id)
    pagos_id = create_pagos(dashboard_id, citas_id, clientes_id)

    print("\n📊 Añadiendo rollups y fórmulas...")

    # Fase 3: Rollups (dependen de que las relaciones ya existen)
    add_rollups_clientes(clientes_id)
    add_rollups_staff(staff_id)
    add_rollups_citas(citas_id, pagos_id)

    ids = {
        "clientes": clientes_id,
        "servicios": servicios_id,
        "staff": staff_id,
        "citas": citas_id,
        "pagos": pagos_id,
    }

    print("\n🏠 Completando Dashboard...")
    populate_dashboard(dashboard_id, ids)

    print("\n✅ CRM creado con éxito!\n")
    print(f"🌐 Abre en Notion: https://notion.so/{dashboard_id.replace('-', '')}\n")
    print("📋 Siguiente:")
    print("   1. Abre el Dashboard → verás los 5 módulos como subpáginas")
    print("   2. En Citas → + Add view → Calendar → selecciona 'Fecha y hora'")
    print("   3. En Citas → + Add view → Board → agrupa por 'Estado'")
    print("   4. En Servicios → agrega tu catálogo de servicios")
    print("   5. En Staff/Artists → registra tu equipo")
    print("   6. ¡Empieza a gestionar tu salón!\n")


if __name__ == "__main__":
    main()
