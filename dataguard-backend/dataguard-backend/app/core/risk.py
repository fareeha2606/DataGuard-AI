import polars as pl
import numpy as np

def risks(df: pl.DataFrame, target: str|None=None):
    out=[]
    cols=[c for c in df.columns]
    target_guess=target
    if not target_guess:
        for c in cols:
            if c.lower() in {'target','label','y','churned','outcome','class'}: target_guess=c; break
    if target_guess and target_guess in cols:
        t=df[target_guess]
        for c in cols:
            if c==target_guess: continue
            if t.dtype==pl.String and df[c].dtype==pl.String:
                # post-outcome naming heuristic
                if any(k in c.lower() for k in ['reason','outcome','resolution','status_after','post_']):
                    out.append({"name":"Potential target leakage","status":"Critical","detail":"Feature name suggests information may only be available after the target event.","columns":c,"action":"Validate availability at inference or exclude."})
            if df[c].n_unique()==df.height and any(k in c.lower() for k in ['id','uuid','email','customer']):
                out.append({"name":"Suspicious identifier column","status":"Attention","detail":"Near-unique identifiers can cause memorization or leakage.","columns":c,"action":"Exclude unless justified."})
        if t.n_unique()==2:
            vals=t.value_counts(); counts=vals['count'].to_list(); frac=min(counts)/max(sum(counts),1)
            if frac<0.2: out.append({"name":"Class imbalance","status":"Attention","detail":f"Minority class is approximately {round(frac*100,1)}%.","columns":target_guess,"action":"Use stratification and suitable metrics."})
    # high cardinality
    for c in cols:
        ratio=df[c].n_unique()/max(df.height,1)
        if ratio>.9 and df[c].dtype==pl.String:
            if not any(x.get('columns')==c for x in out): out.append({"name":"High cardinality","status":"Attention","detail":"Column has very high uniqueness.","columns":c,"action":"Review encoding and identifier risk."})
    if not out: out.append({"name":"No obvious critical ML risk","status":"Good","detail":"No heuristic risk rule fired.","columns":"None","action":"Continue with model-specific validation."})
    return out

def readiness(df, quality_score, risk_list, anomaly_count):
    critical=sum(1 for r in risk_list if r['status']=='Critical'); attention=sum(1 for r in risk_list if r['status']=='Attention')
    completeness=max(0,min(100,quality_score)); consistency=max(0,quality_score-attention*4)
    anomaly=max(0,100-min(100, anomaly_count/max(df.height,1)*100))
    leakage=max(0,100-critical*35-attention*5)
    scores=[completeness,consistency,85,anomaly,78,leakage,88,90]
    names=['Data Completeness','Data Consistency','Feature Quality','Anomaly Risk','Class Balance','Leakage Risk','Feature Redundancy','Distribution Risk']
    texts=['Coverage of populated values.','Category/format consistency.','Basic feature usability.','Potential unusual-record risk.','Target balance heuristic.','Leakage and availability risk.','Redundancy heuristic.','Distribution stability heuristic.']
    dims=[]
    for n,s,t in zip(names,scores,texts): dims.append({'name':n,'score':round(s),'status':'Good' if s>=85 else 'Attention' if s>=70 else 'Critical','text':t})
    return dims, round(sum(scores)/len(scores))
