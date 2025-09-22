"""Unit tests for the Python helpers that power the WASM integration."""

from __future__ import annotations

import json
from typing import Iterable

import pytest

from sqlglot_wasm import (
    get_available_dialects,
    get_columns,
    get_joins,
    set_schema,
    transpile_query,
)


@pytest.fixture(autouse=True)
def clear_schema() -> Iterable[None]:
    set_schema("")
    yield
    set_schema("")


@pytest.fixture(scope="module")
def sample_query() -> str:
    return (
        "SELECT a, b AS alias_b FROM table_one t1 "
        "LEFT JOIN (SELECT c FROM table_two) t2 ON t1.a = t2.c"
    )


def test_available_dialects_contains_common_entries() -> None:
    payload = json.loads(get_available_dialects())

    assert "dialects" in payload
    dialects = {dialect.lower() for dialect in payload["dialects"]}
    # A few representative dialects that should be present.
    assert {"duckdb", "spark", "postgres"}.issubset(dialects)


def test_transpile_query_returns_translated_sql(sample_query: str) -> None:
    payload = json.loads(transpile_query(sample_query, "duckdb", "spark"))

    assert "query" in payload
    assert payload["query"].strip().lower().startswith("select")
    assert "errors" not in payload


def test_transpile_query_rejects_unknown_dialect(sample_query: str) -> None:
    payload = json.loads(transpile_query(sample_query, "not-a-dialect", "spark"))

    assert "errors" in payload
    assert "not-a-dialect" in payload["errors"].lower()


def test_get_columns_returns_unique_column_names(sample_query: str) -> None:
    payload = json.loads(get_columns(sample_query, "duckdb"))

    assert payload["columns"] == ["a", "b"]


def test_get_columns_handles_invalid_dialect(sample_query: str) -> None:
    payload = json.loads(get_columns(sample_query, "unknown"))

    assert "errors" in payload


def test_get_joins_reports_tables_and_count(sample_query: str) -> None:
    payload = json.loads(get_joins(sample_query, "duckdb"))

    assert payload["join_count"] == 1
    # The nested query should surface table_two as part of the joined tables.
    assert set(payload["tables"]) == {"table_one", "table_two"}


def test_get_joins_handles_invalid_dialect(sample_query: str) -> None:
    payload = json.loads(get_joins(sample_query, "unknown"))

    assert "errors" in payload


def test_schema_enables_typechecking(sample_query: str) -> None:
    schema_payload = {
        "table_one": {"a": "int", "b": "int"},
        "table_two": {"c": "int"},
    }

    status = json.loads(set_schema(json.dumps(schema_payload)))
    assert "errors" not in status
    assert status["status"] in {"ok", "cleared"}

    payload = json.loads(transpile_query(sample_query, "duckdb", "duckdb"))
    assert "errors" not in payload


def test_schema_reports_unknown_columns() -> None:
    schema_payload = {
        "table_one": {"a": "int"},
    }

    status = json.loads(set_schema(json.dumps(schema_payload)))
    assert "errors" not in status
    assert status["status"] in {"ok", "cleared"}

    payload = json.loads(transpile_query("SELECT b FROM table_one", "duckdb", "duckdb"))

    assert "errors" in payload
    assert "b" in payload["errors"].lower()
