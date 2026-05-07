def sel(options):
    return {"select": {"options": [{"name": n, "color": c} for n, c in options]}}


def multisel(options):
    return {"multi_select": {"options": [{"name": n, "color": c} for n, c in options]}}


def relation_single(db_id):
    return {"relation": {"database_id": db_id, "single_property": {}}}


def relation_dual(db_id, back_name):
    return {
        "relation": {
            "database_id": db_id,
            "dual_property": {"synced_property_name": back_name},
        }
    }


def rollup(relation_prop, target_prop, fn):
    return {
        "rollup": {
            "relation_property_name": relation_prop,
            "rollup_property_name": target_prop,
            "function": fn,
        }
    }


def formula(expr):
    return {"formula": {"expression": expr}}
