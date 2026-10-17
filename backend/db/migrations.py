"""Alembic upgrades and validated adoption of the original create_all schema."""
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.operations import Operations
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, inspect

INITIAL_REVISION = "0e53c01be55a"


def migration_config():
    return Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))


def _schema(connection):
    inspector = inspect(connection)
    result = {}
    for table in inspector.get_table_names():
        if table == "alembic_version":
            continue
        columns = [(c["name"], str(c["type"]), c["nullable"], c["primary_key"])
                   for c in inspector.get_columns(table)]
        indexes = sorted((i["name"], tuple(i["column_names"]), bool(i["unique"]))
                         for i in inspector.get_indexes(table))
        result[table] = (columns, indexes)
    return result


def adopt_legacy_schema(connection, config):
    """Stamp only a complete, exact original schema; never drop or infer data."""
    tables = inspect(connection).get_table_names()
    if "alembic_version" in tables or not tables:
        return
    scripts = ScriptDirectory.from_config(config)
    reference_engine = create_engine("sqlite://")
    try:
        with reference_engine.begin() as reference:
            with Operations.context(MigrationContext.configure(reference)):
                scripts.get_revision(INITIAL_REVISION).module.upgrade()
            if _schema(connection) != _schema(reference):
                raise RuntimeError("Unversioned database does not match the initial schema; automatic adoption refused. Back up and reconcile the schema first.")
        MigrationContext.configure(connection).stamp(scripts, INITIAL_REVISION)
    finally:
        reference_engine.dispose()


def upgrade_database(engine):
    config = migration_config()
    with engine.begin() as connection:
        config.attributes["connection"] = connection
        command.upgrade(config, "head")
