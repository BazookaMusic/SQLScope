"""Utilities exposed to the Pyodide runtime for SQLGlot-backed features."""

from __future__ import annotations

import json
from typing import Iterable, List

import sqlglot
import sqlglot.dialects as sqlglotdialects
from sqlglot import exp


def dialects() -> Iterable[str]:
    """Return the list of dialects supported by sqlglot."""

    return [name for name in sqlglotdialects.Dialect.classes if name]


SUPPORTED_DIALECTS = {dialect.lower() for dialect in dialects()}


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


def transpile_query(source: str, in_dialect: str, out_dialect: str, pretty: bool = False) -> str:
    """Transpile a SQL query between dialects and return a JSON response."""

    in_dialect = in_dialect.lower()
    out_dialect = out_dialect.lower()

    try:
        if not is_supported_dialect(in_dialect):
            raise ValueError(f"{in_dialect} is not a supported dialect")
        if not is_supported_dialect(out_dialect):
            raise ValueError(f"{out_dialect} is not a supported dialect")

        transpiled = sqlglot.transpile(source, read=in_dialect, write=out_dialect, pretty=pretty)
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
        columns: List[str] = []

        if isinstance(tree, exp.Select):
            for projection in tree.expressions:
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
        all_tables = _extract_joined_tables(tree)
        join_count = len(list(tree.find_all(exp.Join)))

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
    "is_supported_dialect",
    "transpile_query",
]
