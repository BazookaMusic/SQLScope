
const SQLGlotPython = {
    PythonFunctionDeclarations: `import sqlglot
import sqlglot.dialects as dialects
import json

def dialects():
    return dialects.DIALECTS

supported_dialects = {dialect.lower() for dialect in dialects()}
def is_supported_dialect(dialect: str) -> bool:
    # get submodules from dialect
    lower_dialect = dialect.lower()
    return lower_dialect in supported_dialects

def translate(source: str, in_dialect: str, out_dialect: str, pretty:bool = False) -> str:
    print(f"Translating from {in_dialect} to {out_dialect}")
    return sqlglot.transpile(source, read=in_dialect, write = out_dialect, pretty=pretty)

print("initialized")
`,
GetAvailableDialects: `
dialects_json = { "dialects" : dialects()}
json.dumps(dialects_json)`,
TranspileQuery: `
in_dialect = in_dialect.lower()
out_dialect = out_dialect.lower()

try:
    if (not is_supported_dialect(in_dialect)):
        raise Exception(f"{in_dialect} is not a supported dialect")
    if (not is_supported_dialect(out_dialect)):
        raise Exception(f"{out_dialect} is not a supported dialect")
    
    result = { "query" : '\\n'.join(sqlglot.transpile(source, read=in_dialect, write = out_dialect, pretty=pretty)) }
except Exception as ex:
    result = {"errors" : str(ex)}

json.dumps(result)
`
}

export default SQLGlotPython;