"""
Database Connection and Initialization Manager
Manages SQLite connections, executes DDL schema, and provides transactional execution.
"""

import sqlite3
import os
from typing import Optional

DB_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "smart_hospital.db")
SCHEMA_FILE_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")


def get_db_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    """
    Creates and returns a connection to SQLite database with foreign keys enabled
    and row factory set to sqlite3.Row for dictionary-like access.
    """
    path = db_path if db_path is not None else DB_FILE_PATH
    conn = sqlite3.connect(path, timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db(db_path: Optional[str] = None) -> None:
    """
    Executes schema.sql against the database to create required tables and indexes.
    """
    conn = get_db_connection(db_path)
    try:
        with open(SCHEMA_FILE_PATH, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        conn.executescript(schema_sql)
        conn.commit()
    finally:
        conn.close()
