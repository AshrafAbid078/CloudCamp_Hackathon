import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, inspect, text

from backend.db.migrations import INITIAL_REVISION, migration_config, upgrade_database


def test_empty_database_upgrade_is_repeatable(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'empty.db'}")
    upgrade_database(engine)
    upgrade_database(engine)
    with engine.connect() as connection:
        assert connection.execute(text("SELECT version_num FROM alembic_version")).scalar() == "1d8b7a2c490f"
        assert "token_version" in {c["name"] for c in inspect(connection).get_columns("users")}
    engine.dispose()


def test_unversioned_initial_database_adopted_without_data_loss(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'legacy.db'}")
    scripts = ScriptDirectory.from_config(migration_config())
    with engine.begin() as connection:
        with Operations.context(MigrationContext.configure(connection)):
            scripts.get_revision(INITIAL_REVISION).module.upgrade()
        connection.execute(text("INSERT INTO users VALUES (1, 'legacy', 'existing-hash', 'admin', 0, 1, '2026-01-01 00:00:00')"))
    upgrade_database(engine)
    upgrade_database(engine)
    with engine.connect() as connection:
        assert connection.execute(text("SELECT username, hashed_password, token_version FROM users")).one() == ("legacy", "existing-hash", 0)
    engine.dispose()


def test_unknown_unversioned_schema_is_not_stamped(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'unknown.db'}")
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE users (id INTEGER PRIMARY KEY)"))
    with pytest.raises(RuntimeError, match="automatic adoption refused"):
        upgrade_database(engine)
    assert "alembic_version" not in inspect(engine).get_table_names()
    engine.dispose()
