from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import event
from sqlalchemy.engine import Engine
from typing import AsyncGenerator

from app.config import settings

# Create async engine with SQLite-specific optimizations
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,  # Set to False in production
    future=True,
    pool_pre_ping=True  # Validates connections before use
)

# Session factory for dependency injection
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for all SQLAlchemy models
Base = declarative_base()


# SQLite-specific optimization for foreign key support
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """
    Enable foreign key constraints for SQLite.
    
    SQLite has foreign keys disabled by default, so we enable them
    for data integrity. This is called automatically on each connection.
    """
    if 'sqlite' in str(dbapi_connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


async def get_db() -> AsyncGenerator[AsyncSession, None]: #  The function doesn't return a session, it yields it within a context that handles setup and teardown.
    """
    Dependency function for database sessions.
    
    This is used with FastAPI's dependency injection system to provide
    database sessions to route handlers. It ensures proper session
    cleanup even if exceptions occur.
    
    Usage:
        @app.get("/users/")
        async def get_users(db: AsyncSession = Depends(get_db)):
            return await user_service.get_all(db)
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """
    Initialize database tables.
    
    Creates all tables defined by SQLAlchemy models. In production,
    use Alembic migrations instead of this direct approach.
    """
    # Import all models to ensure they're registered with Base
    from app.models import image, ai_model, analysis
    
    async with engine.begin() as conn:
        # Drop all tables (development only!)
        await conn.run_sync(Base.metadata.drop_all)
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed initial data
    await seed_initial_data()


async def seed_initial_data():
    """
    Seed database with initial AI model data.
    
    This creates sample AI model entries that would typically be
    managed through a proper ML model registry in production.
    """
    from app.models.ai_model import AIModel
    
    async with AsyncSessionLocal() as session:
        # Check if models already exist
        from sqlalchemy import select
        result = await session.execute(select(AIModel))
        if result.first():
            return  # Already seeded
        
        # Create sample AI models
        models = [
            AIModel(
                name="Chest X-Ray Classifier",
                version="1.0.0",
                description="CNN model for detecting pneumonia in chest X-rays",
                model_type="classification",
                confidence_threshold=0.85
            ),
            AIModel(
                name="Brain MRI Segmentation",
                version="2.1.0", 
                description="U-Net model for brain tumor segmentation in MRI scans",
                model_type="segmentation",
                confidence_threshold=0.90
            ),
            AIModel(
                name="CT Lung Nodule Detection",
                version="1.5.2",
                description="YOLO-based model for detecting lung nodules in CT scans",
                model_type="detection",
                confidence_threshold=0.75
            )
        ]
        
        for model in models:
            session.add(model)
        
        await session.commit()
        print(f"✅ Seeded {len(models)} AI models")