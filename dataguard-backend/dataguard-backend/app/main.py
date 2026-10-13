from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.datasets import router

app=FastAPI(title=settings.app_name,version=settings.version,description='Data Quality & ML Pipeline Gatekeeper')
app.add_middleware(CORSMiddleware,allow_origins=settings.cors_list,allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
app.include_router(router)

@app.get('/health')
def health(): return {'status':'healthy','service':'DataGuard AI Backend','version':settings.version}

@app.get('/')
def root(): return {'name':'DataGuard AI','docs':'/docs','health':'/health'}
