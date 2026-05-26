"""
PostgreSQL connection pool using psycopg2 + pgvector.
Provides get_connection() context manager for all DB operations.
"""

from contextlib import contextmanager
from typing import Generator

import psycopg2
import psycopg2.pool
from pgvector.psycopg2 import register_vector
from core.config import settings

_pool: psycopg2.pool.ThreadedConnectionPool | None = None


def _get_pool() -> psycopg2.pool.ThreadedConnectionPool:
    global _pool
    if _pool is None:
        _pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=2,
            maxconn=10,
            dsn=settings.DATABASE_URL,
        )
    return _pool


@contextmanager
def get_connection() -> Generator[psycopg2.extensions.connection, None, None]:
    """Context manager that yields a DB connection from the pool."""
    pool = _get_pool()
    conn = pool.getconn()
    try:
        register_vector(conn)
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)
