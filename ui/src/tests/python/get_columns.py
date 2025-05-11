import json
import sqlglot
import sqlglot.dialects
from sqlglot import exp

def dialects():
    return sqlglot.dialects.DIALECTS

supported_dialects = {dialect.lower() for dialect in dialects()}

def is_supported_dialect(dialect: str) -> bool:
    return dialect.lower() in supported_dialects

def translate(source: str, in_dialect: str, out_dialect: str, pretty: bool = False) -> str:
    print(f"Translating from {in_dialect} to {out_dialect}")
    return sqlglot.transpile(source, read=in_dialect, write=out_dialect, pretty=pretty)

in_dialect = "TSQL"
in_dialect = in_dialect.lower()
source = "SELECT a,b,c,d from e JOIN (SELECT foo,bar,baz from AFD)"

try:
    if not is_supported_dialect(in_dialect):
        raise Exception(f"{in_dialect} is not a supported dialect")

    tree = sqlglot.parse_one(source, read=in_dialect)

    columns = []

    if isinstance(tree, exp.Select):
        for projection in tree.expressions:
            expr = projection
            if isinstance(expr, exp.Alias):
                expr = expr.this  # Unwrap alias

            if isinstance(expr, exp.Column):
                columns.append(expr.name)  # Just get unqualified column name

    # Deduplicate, preserve order
    seen = set()
    unique_columns = []
    for c in columns:
        if c not in seen:
            seen.add(c)
            unique_columns.append(c)

    result = { "columns": unique_columns }

except Exception as ex:
    result = { "errors": str(ex) }

json.dumps(result)