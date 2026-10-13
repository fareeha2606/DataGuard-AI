from datetime import datetime, timezone
from pathlib import Path
import uuid
from app.config import settings
from app.database.mongodb import store
from app.utils.data import read_csv
from app.core.profiler import profile
from app.core.quality import quality_analysis
from app.core.anomaly import detect
from app.core.cleaning import recommend
from app.core.risk import risks, readiness
from app.core.optimization import beam_search
from app.ml.explain import explain

class DatasetService:
    def create(self, filename, path):
        did='DS-'+uuid.uuid4().hex[:8].upper(); df=read_csv(path); p=profile(df)
        doc={"id":did,"name":filename,"path":str(path),"created_at":datetime.now(timezone.utc).isoformat(),"rows":p['rows'],"columns":p['columns'],"size":Path(path).stat().st_size,"status":"Uploaded","analysis":None,"gate":{"decision":"In review","confidence":0}}
        store.put_dataset(doc); return doc
    def analyze(self,did,target=None):
        doc=store.get_dataset(did)
        if not doc: raise KeyError(did)
        df=read_csv(doc['path']); prof=profile(df); q=quality_analysis(df,target); an=detect(df,settings.anomaly_sample_rows); rs=risks(df,target); rd,score=readiness(df,q['score'],rs,an['count']); actions=recommend(df); plan=beam_search(actions)
        selected=[a for a in actions if a['id'] in plan]
        result={"profile":prof,"quality":q,"anomalies":an,"cleaning":{"actions":actions,"beam_search_plan":plan,"recommended":selected},"ml_risks":rs,"ml_readiness":{"dimensions":rd,"score":score},"explanations":explain(rs,rd),"target_column":target}
        hard=any(r['status']=='Critical' for r in rs); decision='Blocked' if hard else 'Conditional' if score<85 or q['score']<85 else 'Approved'; conf=max(50,min(99,score-(10 if hard else 0)))
        result['gate']={"decision":decision,"confidence":conf,"hard_checks":{"critical_ml_risk":hard,"quality_below_85":q['score']<85}}
        doc['analysis']=result; doc['status']='Analysis complete'; doc['quality']=q['score']; doc['readiness']=score; doc['issues']=len(q['issues']); doc['anomalies']=an['count']; doc['missing']=prof['missing_pct']; doc['duplicates']=prof['duplicates']; doc['gate']={"decision":decision,"confidence":conf}; store.put_dataset(doc); store.event(did,'analysis_completed',{'decision':decision,'quality':q['score'],'readiness':score}); return doc
    def get(self,did):
        d=store.get_dataset(did)
        if not d: raise KeyError(did)
        return d
service=DatasetService()
