import sqlglot
import sqlglot.dialects


def dialects():
    return [name for name, obj in sqlglot.dialects.__dict__.items() if isinstance(obj, type) and issubclass(obj, sqlglot.Dialect) and obj is not sqlglot.Dialect and 'dialect' not in name.lower()]

supported_dialects = {dialect.lower() for dialect in dialects()}
def is_supported_dialect(dialect: str) -> bool:
    # get submodules from dialect
    lower_dialect = dialect.lower()
    return lower_dialect in supported_dialects

def translate(source: str, in_dialect: str, out_dialect: str, pretty:bool = False) -> str:
    print(f"Translating from {in_dialect} to {out_dialect}")
    return sqlglot.transpile(source, read=in_dialect, write = out_dialect, pretty=pretty)