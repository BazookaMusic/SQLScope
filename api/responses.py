from fastapi.responses import JSONResponse

def OkWithQuery(query):
    return JSONResponse(status_code=200, content=
                        {
                            "query": query
                        })

def OkList(li, name="list"):
    return JSONResponse(status_code=200, content=
                        {
                            name: [str(item) for item in li]
                        })

def BadRequest(e: Exception):
    return JSONResponse(status_code=400, content=
                        {
                            "error": str(e)
                        })