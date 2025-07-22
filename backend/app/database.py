from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import event, select
from sqlalchemy.engine import Engine
from typing import AsyncGenerator

from app.config import settings
from app.models.base import Base

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,
    future=True,
    pool_pre_ping=True
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enable foreign key constraints for SQLite."""
    if 'sqlite' in str(dbapi_connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency function for database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database tables."""
    # Import models here to ensure registration
    from app.models import AIModel, Image, AnalysisResult  # noqa: F401
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    await seed_initial_data()


async def seed_initial_data():
    """Seed database with initial AI model data."""
    from app.models import AIModel
    
    async with AsyncSessionLocal() as session:
        # Check if models already exist
        result = await session.execute(select(AIModel))
        if result.first():
            return
        
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