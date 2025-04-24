from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy import Column, String, JSON, DateTime, Float
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.config.database import Base
from sqlalchemy.dialects.postgresql import UUID
import uuid

class PredictionModel(Base):
    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_name = Column(String, nullable=False)
    item_id = Column(String, nullable=False)
    input_data = Column(JSON, nullable=False)
    prediction_result = Column(JSON, nullable=False)
    confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    @classmethod
    async def create(
        cls,
        db: AsyncSession,
        model_name: str,
        item_id: str,
        input_data: Dict[str, Any],
        prediction_result: Dict[str, Any],
        confidence_score: Optional[float] = None
    ) -> "PredictionModel":
        prediction = cls(
            model_name=model_name,
            item_id=item_id,
            input_data=input_data,
            prediction_result=prediction_result,
            confidence_score=confidence_score
        )
        db.add(prediction)
        await db.commit()
        await db.refresh(prediction)
        return prediction

    @classmethod
    async def get(cls, db: AsyncSession, prediction_id: uuid.UUID) -> Optional["PredictionModel"]:
        result = await db.execute(
            select(cls).where(cls.id == prediction_id)
        )
        return result.scalar_one_or_none()

    @classmethod
    async def list(
        cls,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> list["PredictionModel"]:
        result = await db.execute(
            select(cls)
            .order_by(cls.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "model_name": self.model_name,
            "item_id": self.item_id,
            "input_data": self.input_data,
            "prediction_result": self.prediction_result,
            "confidence_score": self.confidence_score,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        } 