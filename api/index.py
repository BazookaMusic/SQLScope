from fastapi import FastAPI, Query
import api.consts as CONSTS
from api.responses import OkWithQuery,BadRequest, OkList
from pydantic import BaseModel
import api.translator as translator
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:3000",  # React app running on localhost
    "http://127.0.0.1:3000",  # React app running on localhost
]

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


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)