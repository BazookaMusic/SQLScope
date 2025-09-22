"""Configure the Python path so tests can import the Pyodide-bound helpers."""

from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
PYTHON_RUNTIME_DIR = PROJECT_ROOT / "ui" / "public" / "python"

if str(PYTHON_RUNTIME_DIR) not in sys.path:
    sys.path.insert(0, str(PYTHON_RUNTIME_DIR))
