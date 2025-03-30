-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE prediction_type AS ENUM (
    'demand',
    'stockout',
    'optimization'
);

CREATE TYPE prediction_status AS ENUM (
    'pending',
    'completed',
    'failed'
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id VARCHAR(255) NOT NULL,
    warehouse_id VARCHAR(255) NOT NULL,
    prediction_type prediction_type NOT NULL,
    status prediction_status NOT NULL DEFAULT 'pending',
    predicted_demand FLOAT NOT NULL,
    confidence_score FLOAT,
    data_hash VARCHAR(255) NOT NULL,
    model_version VARCHAR(100) NOT NULL,
    error_message TEXT,
    prediction_metadata JSONB,
    input_data JSONB,
    output_data JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create prediction metrics table
CREATE TABLE IF NOT EXISTS prediction_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    mape FLOAT,
    rmse FLOAT,
    mae FLOAT,
    r2_score FLOAT,
    actual_value FLOAT,
    prediction_error FLOAT,
    is_accurate BOOLEAN,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metrics_metadata JSONB
);

-- Create data change tracker table
CREATE TABLE IF NOT EXISTS data_change_tracker (
    item_id VARCHAR(255) PRIMARY KEY,
    warehouse_id VARCHAR(255) NOT NULL,
    last_hash VARCHAR(255) NOT NULL,
    last_prediction_id UUID REFERENCES predictions(id),
    consecutive_no_changes INTEGER DEFAULT 0,
    last_checked TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tracker_metadata JSONB
);

-- Create indexes for better query performance
CREATE INDEX idx_predictions_item_id ON predictions(item_id);
CREATE INDEX idx_predictions_warehouse_id ON predictions(warehouse_id);
CREATE INDEX idx_predictions_timestamp ON predictions(timestamp);
CREATE INDEX idx_predictions_status ON predictions(status);
CREATE INDEX idx_prediction_metrics_prediction_id ON prediction_metrics(prediction_id);
CREATE INDEX idx_data_change_tracker_last_prediction_id ON data_change_tracker(last_prediction_id);

-- Create trigger to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_predictions_last_updated
    BEFORE UPDATE ON predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column();

CREATE TRIGGER update_data_change_tracker_last_updated
    BEFORE UPDATE ON data_change_tracker
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column(); 