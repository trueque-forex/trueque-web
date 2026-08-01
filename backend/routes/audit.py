# backend/routes/audit.py
#
# ⚠️  THIS FILE IS NOT MOUNTED AS A ROUTER.
#
# The audit helper function has been moved to:
#   backend/utils/audit_utils.py
#
# If you need to add HTTP audit endpoints in future, create a proper
# router here and import log_action from backend.utils.audit_utils.
#
# This file is retained as a placeholder to prevent broken imports from
# any code that may have referenced this path.

# Re-export for backward compatibility
from backend.utils.audit_utils import log_action  # noqa: F401