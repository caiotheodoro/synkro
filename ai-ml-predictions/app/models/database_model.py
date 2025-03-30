from sqlalchemy import Column, String, Float, DateTime, JSON, Integer, ForeignKey, Enum, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

Base = declarative_base()

class PredictionType(enum.Enum):
    DEMAND = "demand"
    STOCKOUT = "stockout"
    OPTIMIZATION = "optimization"

class PredictionStatus(enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    item_id = Column(String, nullable=False)
    warehouse_id = Column(String, nullable=False)
    prediction_type = Column(Enum(PredictionType), nullable=False)
    status = Column(Enum(PredictionStatus), nullable=False, default=PredictionStatus.PENDING)
    predicted_demand = Column(Float, nullable=False)
    confidence_score = Column(Float)
    data_hash = Column(String, nullable=False)
    model_version = Column(String, nullable=False)
    error_message = Column(String)
    prediction_metadata = Column(JSON)
    input_data = Column(JSON)
    output_data = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    metrics = relationship("PredictionMetrics", back_populates="prediction", uselist=False)

class PredictionMetrics(Base):
    __tablename__ = "prediction_metrics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    prediction_id = Column(String, ForeignKey("predictions.id"), nullable=False)
    mape = Column(Float)  # Mean Absolute Percentage Error
    rmse = Column(Float)  # Root Mean Square Error
    mae = Column(Float)   # Mean Absolute Error
    r2_score = Column(Float)  # R-squared score
    actual_value = Column(Float)  # Actual value when available
    prediction_error = Column(Float)  # Difference between predicted and actual
    is_accurate = Column(Boolean)  # Whether prediction was within acceptable range
    timestamp = Column(DateTime, default=datetime.utcnow)
    metrics_metadata = Column(JSON)  # Additional metrics data
    prediction = relationship("PredictionRecord", back_populates="metrics")

class DataChangeTracker(Base):
    __tablename__ = "data_change_tracker"

    item_id = Column(String, primary_key=True)
    warehouse_id = Column(String, nullable=False)
    last_hash = Column(String, nullable=False)
    last_prediction_id = Column(String, ForeignKey("predictions.id"))
    consecutive_no_changes = Column(Integer, default=0)
    last_checked = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow)
    tracker_metadata = Column(JSON) 