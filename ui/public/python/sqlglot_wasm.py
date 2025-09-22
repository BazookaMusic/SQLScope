"""Utilities exposed to the Pyodide runtime for SQLGlot-backed features."""

from __future__ import annotations

import json
from typing import Iterable, List, Optional

import sqlglot
import sqlglot.dialects as sqlglotdialects
from sqlglot import exp
from sqlglot.optimizer import optimizer
from sqlglot.schema import MappingSchema


def dialects() -> Iterable[str]:
    """Return the list of dialects supported by sqlglot."""

    return [name for name in sqlglotdialects.Dialect.classes if name]


SUPPORTED_DIALECTS = {dialect.lower() for dialect in dialects()}

CURRENT_SCHEMA: Optional[MappingSchema] = None


def is_supported_dialect(dialect: str) -> bool:
    """Determine if a dialect is supported."""

    return dialect.lower() in SUPPORTED_DIALECTS


def get_available_dialects() -> str:
    """Return available dialects as a JSON document."""

    dialects_json = {"dialects": list(dialects())}
    return json.dumps(dialects_json)


def _deduplicate_preserving_order(values: Iterable[str]) -> List[str]:
    """Return the input items without duplicates, preserving the first occurrence."""

    seen = set()
    unique_values: List[str] = []

    for value in values:
        if value not in seen:
            seen.add(value)
            unique_values.append(value)

    return unique_values


def set_schema(schema_json: str) -> str:
    """Set or clear the active schema definition used for validation."""

    global CURRENT_SCHEMA

    try:
        if not schema_json or not schema_json.strip():
            CURRENT_SCHEMA = None
            return json.dumps({"status": "cleared"})

        parsed = json.loads(schema_json)
        if not isinstance(parsed, dict):
            raise TypeError("Schema JSON must decode to an object mapping tables to columns.")

        CURRENT_SCHEMA = MappingSchema(parsed)
        return json.dumps({"status": "ok"})
    except Exception as exc:  # pragma: no cover - transformed into JSON error response
        CURRENT_SCHEMA = None
        return json.dumps({"errors": str(exc)})


def transpile_query(source: str, in_dialect: str, out_dialect: str, pretty: bool = False) -> str:
    """Transpile a SQL query between dialects and return a JSON response."""

    in_dialect = in_dialect.lower()
    out_dialect = out_dialect.lower()

    try:
        if not is_supported_dialect(in_dialect):
            raise ValueError(f"{in_dialect} is not a supported dialect")
        if not is_supported_dialect(out_dialect):
            raise ValueError(f"{out_dialect} is not a supported dialect")

        statements = sqlglot.parse(
            source,
            read=in_dialect,
        )
        optimized = [
            optimizer.optimize(
                statement,
                schema=CURRENT_SCHEMA,
                dialect=in_dialect,
            )
            for statement in statements
        ]
        transpiled = [
            statement.sql(dialect=out_dialect, pretty=pretty)
            for statement in optimized
        ]
        result = {"query": "\n".join(transpiled)}
    except Exception as exc:  # pragma: no cover - transformed into JSON error response
        result = {"errors": str(exc)}

    return json.dumps(result)


def get_columns(source: str, in_dialect: str) -> str:
    """Return projected columns for the provided query as a JSON payload."""

    in_dialect = in_dialect.lower()

    try:
        if not is_supported_dialect(in_dialect):
            raise ValueError(f"{in_dialect} is not a supported dialect")

        tree = sqlglot.parse_one(source, read=in_dialect)
        optimized = optimizer.optimize(
            tree,
            schema=CURRENT_SCHEMA,
            dialect=in_dialect,
        )
        columns: List[str] = []

        target = optimized if isinstance(optimized, exp.Select) else optimized.find(exp.Select)

        if isinstance(target, exp.Select):
            for projection in target.expressions:
                expr = projection
                if isinstance(expr, exp.Alias):
                    expr = expr.this  # unwrap alias

                if isinstance(expr, exp.Column):
                    columns.append(expr.name)

        result = {"columns": _deduplicate_preserving_order(columns)}
    except Exception as exc:  # pragma: no cover - transformed into JSON error response
        result = {"errors": str(exc)}

    return json.dumps(result)


def _handle_join_target(target: exp.Expression) -> List[str]:
    if isinstance(target, exp.Table):
        return [target.name]
    if isinstance(target, exp.Subquery):
        return _extract_joined_tables(target.this)
    if isinstance(target, exp.Alias):
        inner = target.this
        if isinstance(inner, exp.Table):
            return [inner.name]
        if isinstance(inner, exp.Subquery):
            return _extract_joined_tables(inner.this)
    return []


def _extract_joined_tables(node: exp.Expression) -> List[str]:
    tables: List[str] = []

    for join in node.find_all(exp.Join):
        tables.extend(_handle_join_target(join.this))

    for from_exp in node.find_all(exp.From):
        tables.extend(_handle_join_target(from_exp.this))

    return tables


def get_joins(source: str, in_dialect: str) -> str:
    """Return joined tables information as JSON."""

    in_dialect = in_dialect.lower()

    try:
        if not is_supported_dialect(in_dialect):
            raise ValueError(f"{in_dialect} is not a supported dialect")

        tree = sqlglot.parse_one(source, read=in_dialect)
        optimized = optimizer.optimize(
            tree,
            schema=CURRENT_SCHEMA,
            dialect=in_dialect,
        )
        all_tables = _extract_joined_tables(optimized)
        join_count = len(list(optimized.find_all(exp.Join)))

        result = {
            "tables": _deduplicate_preserving_order(all_tables),
            "join_count": join_count,
        }
    except Exception as exc:  # pragma: no cover - transformed into JSON error response
        result = {"errors": str(exc)}

    return json.dumps(result)


__all__ = [
    "get_available_dialects",
    "get_columns",
    "get_joins",
    "set_schema",
    "is_supported_dialect",
    "transpile_query",
]
