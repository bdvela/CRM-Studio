def h1(text):
    return {"object": "block", "type": "heading_1",
            "heading_1": {"rich_text": [{"type": "text", "text": {"content": text}}]}}


def h2(text):
    return {"object": "block", "type": "heading_2",
            "heading_2": {"rich_text": [{"type": "text", "text": {"content": text}}]}}


def h3(text):
    return {"object": "block", "type": "heading_3",
            "heading_3": {"rich_text": [{"type": "text", "text": {"content": text}}]}}


def para(text):
    return {"object": "block", "type": "paragraph",
            "paragraph": {"rich_text": [{"type": "text", "text": {"content": text}}]}}


def callout(text, emoji="💡", color="yellow_background"):
    return {
        "object": "block", "type": "callout",
        "callout": {
            "icon": {"type": "emoji", "emoji": emoji},
            "color": color,
            "rich_text": [{"type": "text", "text": {"content": text}}],
        },
    }


def bullet(text):
    return {
        "object": "block", "type": "bulleted_list_item",
        "bulleted_list_item": {"rich_text": [{"type": "text", "text": {"content": text}}]},
    }


def numbered(text):
    return {
        "object": "block", "type": "numbered_list_item",
        "numbered_list_item": {"rich_text": [{"type": "text", "text": {"content": text}}]},
    }


def toggle(text, children=None):
    return {
        "object": "block", "type": "toggle",
        "toggle": {
            "rich_text": [{"type": "text", "text": {"content": text}}],
            "children": children or [],
        },
    }


def divider():
    return {"object": "block", "type": "divider", "divider": {}}


def quote(text):
    return {"object": "block", "type": "quote",
            "quote": {"rich_text": [{"type": "text", "text": {"content": text}}]}}


def columns(*cols):
    """Create a column layout. Each arg is a list of blocks for one column."""
    return {
        "object": "block", "type": "column_list",
        "column_list": {
            "children": [
                {"type": "column", "column": {"children": col}}
                for col in cols
            ]
        },
    }
