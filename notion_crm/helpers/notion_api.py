import os
from notion_client import Client

NOTION_TOKEN = os.environ.get("NOTION_TOKEN")
PARENT_ID = os.environ.get("NOTION_PARENT_PAGE_ID")

if not NOTION_TOKEN or not PARENT_ID:
    print("ERROR: Faltan variables de entorno.")
    print("  export NOTION_TOKEN=secret_xxx")
    print("  export NOTION_PARENT_PAGE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
    raise SystemExit(1)

notion = Client(auth=NOTION_TOKEN)


def create_page(parent_id, title, icon, children=None):
    if parent_id == "workspace":
        parent = {"type": "workspace", "workspace": True}
    else:
        parent = {"type": "page_id", "page_id": parent_id}
    params = {
        "parent": parent,
        "icon": {"type": "emoji", "emoji": icon},
        "properties": {"title": {"title": [{"text": {"content": title}}]}},
    }
    if children:
        params["children"] = children
    return notion.pages.create(**params)


def create_db(parent_id, title, icon, props):
    return notion.databases.create(
        parent={"type": "page_id", "page_id": parent_id},
        icon={"type": "emoji", "emoji": icon},
        title=[{"type": "text", "text": {"content": title}}],
        properties=props,
    )


def update_db(db_id, props):
    return notion.databases.update(database_id=db_id, properties=props)


def append_blocks(page_id, blocks):
    for i in range(0, len(blocks), 100):
        notion.blocks.children.append(block_id=page_id, children=blocks[i:i+100])
