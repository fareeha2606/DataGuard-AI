def explain(risks, readiness_dims):
    return [{"feature":r.get('columns','Unknown'),"impact":"risk","reason":r.get('detail','Risk rule triggered'),"recommendation":r.get('action','Review')} for r in risks[:10]]
