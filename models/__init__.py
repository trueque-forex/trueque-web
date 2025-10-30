# trueque_web/models/__init__.py
# existing model imports (keep any that are already here)
from . import identity, kyc, remittance, delivery_finance, lookups

# import the new model so Base.metadata includes it
from .beneficiary import Beneficiary  # noqa: F401