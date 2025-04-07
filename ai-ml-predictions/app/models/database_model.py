from sqlalchemy import Column, String, Float, DateTime, JSON, Integer, ForeignKey, Enum, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func

Base = declarative_base()

class PredictionType(str, enum.Enum):
    demand = 'demand'
    stockout = 'stockout'
    optimization = 'optimization'

class PredictionStatus(str, enum.Enum):
    pending = 'pending'
    completed = 'completed'
    failed = 'failed'

class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(String(255), nullable=False)
    warehouse_id = Column(String(255), nullable=False, default='default')
    prediction_type = Column(Enum(PredictionType, name='prediction_type', create_type=False), nullable=False, default=PredictionType.demand)
    status = Column(Enum(PredictionStatus, name='prediction_status', create_type=False), nullable=False, default=PredictionStatus.pending)
    predicted_demand = Column(Float, nullable=False)
    confidence_score = Column(Float)
    data_hash = Column(String(255), nullable=False)
    model_version = Column(String(100), nullable=False, default='1.0.0')
    error_message = Column(String)
    prediction_metadata = Column(JSONB)
    input_data = Column(JSONB)
    output_data = Column(JSONB)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=func.now())
    last_updated = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
    metrics = relationship("PredictionMetrics", back_populates="prediction", uselist=False)

class PredictionMetrics(Base):
    __tablename__ = "prediction_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prediction_id = Column(UUID(as_uuid=True), ForeignKey('predictions.id', ondelete='CASCADE'), nullable=False)
    mape = Column(Float)  
    rmse = Column(Float)  
    mae = Column(Float)   
    r2_score = Column(Float)  
    actual_value = Column(Float)  
    prediction_error = Column(Float)  
    is_accurate = Column(Boolean)  
    timestamp = Column(DateTime(timezone=True), nullable=False, default=func.now())
    metrics_metadata = Column(JSONB)  
    prediction = relationship("PredictionRecord", back_populates="metrics")

class DataChangeTracker(Base):
    __tablename__ = "data_change_tracker"

    item_id = Column(String(255), primary_key=True)
    warehouse_id = Column(String(255), nullable=False)
    last_hash = Column(String(255), nullable=False)
    last_prediction_id = Column(UUID(as_uuid=True), ForeignKey('predictions.id'))
    consecutive_no_changes = Column(Integer, default=0)
    last_checked = Column(DateTime(timezone=True), nullable=False, default=func.now())
    last_updated = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
    tracker_metadata = Column(JSONB) 