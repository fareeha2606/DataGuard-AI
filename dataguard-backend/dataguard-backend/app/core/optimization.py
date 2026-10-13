def beam_search(actions, width=3, depth=4):
    # Lightweight cost-aware beam search over candidate cleaning actions.
    states=[([],0.0)]
    for _ in range(min(depth,len(actions))):
        candidates=[]
        for chosen,cost in states:
            for a in actions:
                aid=a['id']
                if aid in chosen: continue
                risk={'Low':1,'Medium':3,'High':7}.get(a.get('risk','Low'),2)
                impact=3 if 'Improve' in a.get('impact','') or 'completeness' in a.get('impact','').lower() else 2
                score=cost + risk - impact
                candidates.append((chosen+[aid],score))
        candidates.sort(key=lambda x:x[1]); states=candidates[:width]
    return states[0][0] if states else []
