"""
Database initialization script
Run this to create all tables in the database
"""
from app.database import engine, Base
from app.models import User, Post, PostLike

def init_database():
    """Create all tables in the database"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")
    print("\nTables created:")
    print("  - users")
    print("  - posts")
    print("  - post_likes")

if __name__ == "__main__":
    init_database()
