const SQLGlotPython = {
    PythonFunctionDeclarations: `
  import sqlglot
  import sqlglot.dialects as sqlglotdialects
  from sqlglot import exp
  import json
  
  def dialects():
      return sqlglotdialects.DIALECTS
  
  supported_dialects = {dialect.lower() for dialect in dialects()}
  
  def is_supported_dialect(dialect: str) -> bool:
      return dialect.lower() in supported_dialects
  
  def translate(source: str, in_dialect: str, out_dialect: str, pretty: bool = False) -> str:
      print(f"Translating from {in_dialect} to {out_dialect}")
      return sqlglot.transpile(source, read=in_dialect, write=out_dialect, pretty=pretty)
  `,
  
    GetAvailableDialects: `
  dialects_json = { "dialects": dialects() }
  json.dumps(dialects_json)
  `,
  
    TranspileQuery: `
  in_dialect = in_dialect.lower()
  out_dialect = out_dialect.lower()
  
  try:
      if not is_supported_dialect(in_dialect):
          raise Exception(f"{in_dialect} is not a supported dialect")
      if not is_supported_dialect(out_dialect):
          raise Exception(f"{out_dialect} is not a supported dialect")
      
      result = {
          "query": '\\n'.join(sqlglot.transpile(source, read=in_dialect, write=out_dialect, pretty=pretty))
      }
  except Exception as ex:
      result = { "errors": str(ex) }
  
  json.dumps(result)
  `,
  
    // 1) Retrieve all columns, grouped by their table (handles nested queries)
    GetColumns: `
in_dialect = in_dialect.lower()
  
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

json.dumps(result)`,
  
    // 2) (unchanged) Find all JOINs and list joined-in tables by join type
    GetJoins: `
in_dialect = in_dialect.lower()

def extract_joined_tables(node):
    tables = []
    for join in node.find_all(exp.Join):
        tables.extend(handle_join_target(join.this))
    
    for from_exp in node.find_all(exp.From):
        tables.extend(handle_join_target(from_exp.this))
    return tables, len(list(node.find_all(exp.Join)))

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
    all_tables, join_count = extract_joined_tables(tree)

    # Dedupe while preserving first-seen order
    seen = set()
    unique_tables = []
    for tbl in all_tables:
        if tbl not in seen:
            seen.add(tbl)
            unique_tables.append(tbl)

    result = { "tables": unique_tables, "join_count":  join_count}
except Exception as ex:
    result = { "errors": str(ex) }

json.dumps(result)
`
  }
  
  export default SQLGlotPython;
  