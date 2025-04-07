-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL,
    input_data JSONB NOT NULL,
    prediction_result JSONB NOT NULL,
    confidence_score FLOAT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create prediction metrics table
CREATE TABLE IF NOT EXISTS prediction_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id INTEGER NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
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
    last_prediction_id INTEGER REFERENCES predictions(id),
    consecutive_no_changes INTEGER DEFAULT 0,
    last_checked TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tracker_metadata JSONB
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_predictions_model_name ON predictions(model_name);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_prediction_metrics_prediction_id ON prediction_metrics(prediction_id);
CREATE INDEX IF NOT EXISTS idx_data_change_tracker_last_prediction_id ON data_change_tracker(last_prediction_id);

-- Create or replace the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist and recreate them
DO $$ BEGIN
    DROP TRIGGER IF EXISTS update_predictions_updated_at ON predictions;
    DROP TRIGGER IF EXISTS update_data_change_tracker_last_updated ON data_change_tracker;
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

-- Create triggers for updated_at
CREATE TRIGGER update_predictions_updated_at
    BEFORE UPDATE ON predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_change_tracker_last_updated
    BEFORE UPDATE ON data_change_tracker
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 