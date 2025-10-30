<<<<<<< HEAD
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context
from backend.models.transaction import Base
from backend.models.advance_model import Advance  # Include any models you want tracked
target_metadata = Base.metadata


# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
=======
import sys, os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from alembic import context
from sqlalchemy import engine_from_config, pool

# Ensure project root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import models and metadata
from trueque_web.models.base import Base
from trueque_web.models import identity, kyc, remittance, delivery_finance, lookups

# Register metadata for autogenerate
target_metadata = Base.metadata

# Load Alembic config
config = context.config

# Inject DB URL from environment variable
db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise RuntimeError("DATABASE_URL environment variable is not set.")
config.set_main_option("sqlalchemy.url", db_url)

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
<<<<<<< HEAD
            connection=connection, target_metadata=target_metadata
=======
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            render_as_batch=True  # Optional: safer for SQLite or legacy tables
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
        )

        with context.begin_transaction():
            context.run_migrations()

<<<<<<< HEAD

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
=======
run_migrations_online()
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
