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

# Helper: walk the AST and collect every join target
def extract_joined_tables(node):
    tables = []
    for join in node.find_all(exp.Join):
        tables.extend(handle_join_target(join.this))
    
    for from_exp in node.find_all(exp.From):
        tables.extend(handle_join_target(from_exp.this))
    return tables

# Helper: handle a single join target, diving into subqueries if needed
def handle_join_target(target):
    if isinstance(target, exp.Table):
        return [target.name]
    # exp.Subquery wraps a SELECT; its .this is the inner Select
    if isinstance(target, exp.Subquery):
        return extract_joined_tables(target.this)
    # exp.Alias can be aliasing either a table or a subquery
    if isinstance(target, exp.Alias):
        inner = target.this
        if isinstance(inner, exp.Table):
            return [inner.name]
        if isinstance(inner, exp.Subquery):
            return extract_joined_tables(inner.this)
    # anything else (VALUES, functions, etc.) we skip
    return []

try:
    if not is_supported_dialect(in_dialect):
        raise Exception(f"{in_dialect} is not a supported dialect")

    tree = sqlglot.parse_one(source, read=in_dialect)
    all_tables = extract_joined_tables(tree)

    # Dedupe while preserving first-seen order
    seen = set()
    unique_tables = []
    for tbl in all_tables:
        if tbl not in seen:
            seen.add(tbl)
            unique_tables.append(tbl)

    result = { "joins": unique_tables }
except Exception as ex:
    result = { "errors": str(ex) }

json.dumps(result)