#!/usr/bin/env python3
"""
Minimal GoDam upload validator service.

Reads a PostgreSQL table schema, validates Excel/CSV uploads against required
columns, column datatypes, and foreign keys, and splits valid/invalid rows.
Valid rows are inserted into the target table while invalid rows are saved as
`GoDAM_ErrorRows.xlsx` (or configured path) with an explanation per row.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Sequence

import pandas as pd
import psycopg2
from psycopg2 import sql
from psycopg2.extras import execute_values

DEFAULT_ERROR_FILE = "GoDAM_ErrorRows.xlsx"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate Excel/CSV uploads for GoDam.")
    parser.add_argument("input", help="Path to Excel (.xlsx/.xls) or CSV file to validate.")
    parser.add_argument("--db-url", help="Postgres connection URL (env DATABASE_URL fallback).")
    parser.add_argument("--table", required=True, help="Target table name (schema.table optional).")
    parser.add_argument("--error-output", default=DEFAULT_ERROR_FILE, help="Path for the Excel file that lists invalid rows.")
    parser.add_argument("--dry-run", action="store_true", help="Skip database insertion; only validate and emit errors.")
    parser.add_argument("--skip-fk-check", action="store_true", help="Do not enforce foreign key lookups.")
    return parser.parse_args()


def get_connection(db_url: str) -> psycopg2.extensions.connection:
    return psycopg2.connect(db_url)


def split_schema(table_arg: str) -> tuple[str, str]:
    if "." in table_arg:
        schema, table = table_arg.split(".", 1)
    else:
        schema, table = "public", table_arg
    return schema, table


def load_table_columns(
    cursor: psycopg2.extensions.cursor, schema: str, table: str
) -> list[dict[str, Any]]:
    cursor.execute(
        """
        SELECT column_name, is_nullable, data_type, character_maximum_length, numeric_precision
        FROM information_schema.columns
        WHERE table_schema = %s AND table_name = %s
        ORDER BY ordinal_position
        """,
        (schema, table),
    )
    return [
        {
            "name": row[0],
            "nullable": row[1] == "YES",
            "data_type": row[2],
            "max_length": row[3],
            "precision": row[4],
        }
        for row in cursor
    ]


def load_existing_stock(
    cursor: psycopg2.extensions.cursor,
) -> dict[tuple[str, str], float]:
    cursor.execute("SELECT part_number, warehouse_no, qty FROM stock")
    result: dict[tuple[str, str], float] = {}
    for row in cursor:
        key = (normalize_key(row[0]), normalize_key(row[1]))
        if key[0] is not None and key[1] is not None:
            result[key] = row[2]
    return result


def load_foreign_keys(
    cursor: psycopg2.extensions.cursor, schema: str, table: str
) -> dict[str, tuple[str, str, str]]:
    cursor.execute(
        """
        SELECT
          kcu.column_name,
          ccu.table_schema,
          ccu.table_name,
          ccu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.constraint_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = %s
          AND tc.table_name = %s
        """,
        (schema, table),
    )
    return {row[0]: (row[1], row[2], row[3]) for row in cursor}


def fetch_fk_values(
    conn: psycopg2.extensions.connection,
    foreign_schema: str,
    foreign_table: str,
    foreign_column: str,
) -> set[Any]:
    with conn.cursor() as cursor:
        cursor.execute(
            sql.SQL("SELECT {column} FROM {schema}.{table}").format(
                column=sql.Identifier(foreign_column),
                schema=sql.Identifier(foreign_schema),
                table=sql.Identifier(foreign_table),
            )
        )
        return {row[0] for row in cursor if row[0] is not None}


def read_input_file(path: str) -> pd.DataFrame:
    path_obj = Path(path)
    if path_obj.suffix.lower() in {".xlsx", ".xls"}:
        return pd.read_excel(path_obj)
    if path_obj.suffix.lower() == ".csv":
        return pd.read_csv(path_obj)
    raise SystemExit("Unsupported file format. Only .xlsx, .xls, and .csv are accepted.")


def normalize_value(value: Any) -> Any:
    if isinstance(value, str):
        value = value.strip()
        if value == "":
            return None
    return value


def normalize_key(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def validate_cell(value: Any, data_type: str) -> tuple[Any, str | None]:
    if value is None:
        return value, None
    normalized = normalize_value(value)
    if normalized is None:
        return None, None
    try:
        if data_type in {"integer", "bigint", "smallint"}:
            return int(normalized), None
        if data_type in {"numeric", "decimal", "real", "double precision"}:
            return float(normalized), None
        if data_type == "boolean":
            text = str(normalized).lower()
            if text in {"true", "t", "yes", "1"}:
                return True, None
            if text in {"false", "f", "no", "0"}:
                return False, None
            raise ValueError("invalid boolean")
        if data_type in {
            "timestamp without time zone",
            "timestamp with time zone",
            "date",
            "time without time zone",
            "time with time zone",
        }:
            return pd.to_datetime(normalized), None
    except (ValueError, TypeError):
        return normalized, f"invalid {data_type}"
    return normalized, None


def write_error_workbook(
    headers: Sequence[str], invalid_rows: list[tuple[list[Any], str]], path: str
) -> None:
    workbook = pd.DataFrame(
        [dict(zip(headers, row)) | {"godam_error_reason": reason} for row, reason in invalid_rows]
    )
    workbook.to_excel(path, index=False)


def main() -> None:
    args = parse_args()
    db_url = args.db_url or os.environ.get("DATABASE_URL")
    if not db_url:
        raise SystemExit("Database URL is required (pass --db-url or set DATABASE_URL).")
    schema, table = split_schema(args.table)
    data = read_input_file(args.input)
    if data.empty:
        print("No rows found in input.")
        return

    with get_connection(db_url) as conn:
        with conn.cursor() as cursor:
            columns = load_table_columns(cursor, schema, table)
            if not columns:
                raise SystemExit(f"Table {schema}.{table} not found.")
            fks = load_foreign_keys(cursor, schema, table) if not args.skip_fk_check else {}
            existing_stock = load_existing_stock(cursor)

        fk_cache: dict[str, set[Any]] = {}
        if fks:
            for column, (fk_schema, fk_table, fk_column) in fks.items():
                fk_cache[column] = fetch_fk_values(conn, fk_schema, fk_table, fk_column)

        invalid_rows: list[tuple[list[Any], str]] = []
        valid_values: list[list[Any]] = []
        headers = [col["name"] for col in columns]
        lower_names = {name.lower(): idx for idx, name in enumerate(headers)}
        required_cols = {"part_number", "warehouse_no", "sap_pn", "description", "qty", "vendor_name"}
        missing = required_cols - set(lower_names.keys())
        if missing:
            raise SystemExit(f"Required columns missing from stock table: {', '.join(sorted(missing))}")
        seen_keys: set[tuple[str, str]] = set()

        for _, row in data.iterrows():
            converted_row: list[Any] = []
            row_errors: list[str] = []
            for col_schema in columns:
                col_name = col_schema["name"]
                raw_value = normalize_value(row.get(col_name))
                if raw_value is None and not col_schema["nullable"]:
                    row_errors.append(f"{col_name} is required")
                    converted_row.append(None)
                    continue
                converted, error = validate_cell(raw_value, col_schema["data_type"])
                if error:
                    row_errors.append(f"{col_name}: {error}")
                converted_value = converted
                converted_row.append(converted_value)
                if (
                    col_name.lower() == "qty"
                    and converted_value is not None
                    and isinstance(converted_value, (int, float))
                    and converted_value < 0
                ):
                    row_errors.append(f"{col_name}: value cannot be negative")
                if (
                    not error
                    and col_name in fk_cache
                    and converted is not None
                    and converted not in fk_cache[col_name]
                ):
                    fk_ref = fks[col_name]
                    row_errors.append(
                        f"{col_name}: missing FK {fk_ref[1]}.{fk_ref[2]}"
                    )
            if row_errors:
                invalid_rows.append((converted_row, "; ".join(row_errors)))
            else:
                part_idx = lower_names["part_number"]
                warehouse_idx = lower_names["warehouse_no"]
                part_key = normalize_key(converted_row[part_idx])
                warehouse_key = normalize_key(converted_row[warehouse_idx])
                if part_key is None or warehouse_key is None:
                    invalid_rows.append((converted_row, "part_number and warehouse_no are required"))
                    continue
                key = (part_key, warehouse_key)
                if key in seen_keys:
                    invalid_rows.append((converted_row, "duplicate (part_number, warehouse_no) in upload"))
                    continue
                seen_keys.add(key)
                existing_qty = existing_stock.get(key)
                if existing_qty is not None:
                    print(f"Updating existing stock for {key} (current qty={existing_qty})")
                valid_values.append(converted_row)

        if invalid_rows:
            print(f"Found {len(invalid_rows)} invalid rows; writing to {args.error_output}")
            write_error_workbook(headers, invalid_rows, args.error_output)
        else:
            print("No invalid rows detected.")

        if args.dry_run:
            print("Dry run; skipping insert.")
            return

        if valid_values:
            with conn.cursor() as cursor:
                columns_sql = sql.SQL(", ").join(sql.Identifier(name) for name in headers)
                assignments = sql.SQL(", ").join(
                    sql.SQL("{col} = EXCLUDED.{col}").format(col=sql.Identifier(name))
                    for name in headers
                )
                insert_stmt = sql.SQL(
                    "INSERT INTO {}.{} ({}) VALUES %s ON CONFLICT (part_number, warehouse_no) DO UPDATE SET {}"
                ).format(
                    sql.Identifier(schema),
                    sql.Identifier(table),
                    columns_sql,
                    assignments,
                )
                execute_values(cursor, insert_stmt.as_string(conn), valid_values)
            conn.commit()
            print(f"Inserted {len(valid_values)} row(s) into {schema}.{table}.")
        else:
            print("No valid rows to insert.")


if __name__ == "__main__":
    main()
