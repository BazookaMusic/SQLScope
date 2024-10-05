from fastapi import FastAPI, Query
import consts as CONSTS
from responses import OkWithQuery,BadRequest, OkList, Ok
from pydantic import BaseModel
import translator as translator
from fastapi.middleware.cors import CORSMiddleware
import os

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allow specific origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

class SQLTranspileRequest(BaseModel):
    query: str
    inDialect: str
    outDialect: str
    pretty: bool

@app.post("/transpile")
def convert_sql(request: SQLTranspileRequest):
    translated = ""
    if request.outDialect.lower() == CONSTS.IDENTITY:
        return OkWithQuery(request.query)
    
    try:
        normalized_in_dialect = request.inDialect.lower()
        normalized_out_dialect = request.outDialect.lower()

        if not translator.is_supported_dialect(normalized_in_dialect):
            raise Exception(f"Invalid input dialect: {request.inDialect}")
        
        if not translator.is_supported_dialect(normalized_out_dialect):
            raise Exception(f"Invalid output dialect: {request.outDialect}")
        
        print(f"Translating from {normalized_in_dialect} to {normalized_out_dialect}")
        translated = translator.translate(request.query, normalized_in_dialect, normalized_out_dialect, request.pretty)
    except Exception as e:
        print(e)
        return BadRequest(e)
    
    return OkWithQuery(translated)

@app.get("/dialects")
def dialects():
    all_dialects = [dialect for dialect in translator.dialects()]
    return OkList(all_dialects, "dialects")

@app.get("/healthz")
def healthz():
    return Ok()

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)