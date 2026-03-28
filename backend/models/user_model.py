from sqlalchemy import Column, String
from backend.database import Base
from backend.models.models import users

class User(Base):
    __table__ = users
    
    # We can still define ORM-only properties or relationships here if needed
    # But columns are now derived strictly from backend.models.models.users