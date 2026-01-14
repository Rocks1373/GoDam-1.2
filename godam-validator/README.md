# GoDam Validator

`godam-validator` is a lightweight Python microservice that:

- inspects a PostgreSQL table schema dynamically;
- validates Excel (`.xlsx`, `.xls`) or CSV uploads against required columns, datatypes, and defined foreign keys;
- emits invalid rows with explanations in `GoDAM_ErrorRows.xlsx` (or a configured location);
- inserts only valid records into the specified table (unless run with `--dry-run`).

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Usage

```bash
python main.py path/to/upload.xlsx --table public.my_table --db-url postgresql://user:pass@host:5432/dbname
```

Options:

- `--error-output`: path for the Excel file that captures invalid rows (default `GoDAM_ErrorRows.xlsx`).
- `--dry-run`: validate without inserting any rows.
- `--skip-fk-check`: skip foreign key enforcement (useful for bulk imports when referential data is absent locally).

The script automatically reads column metadata (nullability, data types) and defined foreign keys using `information_schema`, so you do not need to hardcode any schema details.
> **Important:** the validator only touches the `stock` table. `stock_movements` is the historical audit log and must not be used to recompute the snapshot; always keep the upload corresponding to the desired `stock.qty` value.
