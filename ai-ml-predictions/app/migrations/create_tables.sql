-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create predictions table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prediction_type') THEN
        CREATE TYPE prediction_type AS ENUM ('demand', 'stockout', 'optimization');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prediction_status') THEN
        CREATE TYPE prediction_status AS ENUM ('pending', 'completed', 'failed');
    END IF;
END $$;

-- Create base tables
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(255) NOT NULL,
    item_id VARCHAR(255) NOT NULL,
    input_data JSONB NOT NULL,
    prediction_result JSONB NOT NULL,
    confidence_score FLOAT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

-- Create or replace the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create indexes and triggers
DO $$ 
BEGIN
    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS update_predictions_updated_at ON predictions;
    DROP TRIGGER IF EXISTS update_data_change_tracker_last_updated ON data_change_tracker;
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

DO $$ 
BEGIN
    -- Create indexes if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_predictions_model_name') THEN
        CREATE INDEX idx_predictions_model_name ON predictions(model_name);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_predictions_created_at') THEN
        CREATE INDEX idx_predictions_created_at ON predictions(created_at);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_predictions_item_id') THEN
        CREATE INDEX idx_predictions_item_id ON predictions(item_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_prediction_metrics_prediction_id') THEN
        CREATE INDEX idx_prediction_metrics_prediction_id ON prediction_metrics(prediction_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_data_change_tracker_last_prediction_id') THEN
        CREATE INDEX idx_data_change_tracker_last_prediction_id ON data_change_tracker(last_prediction_id);
    END IF;

    -- Create triggers
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_predictions_updated_at') THEN
        CREATE TRIGGER update_predictions_updated_at
            BEFORE UPDATE ON predictions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_data_change_tracker_last_updated') THEN
        CREATE TRIGGER update_data_change_tracker_last_updated
            BEFORE UPDATE ON data_change_tracker
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN undefined_table THEN 
        RAISE NOTICE 'Table does not exist yet';
    WHEN undefined_column THEN 
        RAISE NOTICE 'Column does not exist yet';
    WHEN duplicate_table THEN 
        RAISE NOTICE 'Index or trigger already exists';
END $$; 


ALTER TABLE predictions 
ADD COLUMN IF NOT EXISTS features_used JSONB,
ADD COLUMN IF NOT EXISTS predicted_demand FLOAT,
ADD COLUMN IF NOT EXISTS item_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS confidence_score FLOAT;

-- Update existing columns to match the prediction service data structure
ALTER TABLE predictions 
ALTER COLUMN input_data TYPE JSONB USING input_data::JSONB,
ALTER COLUMN prediction_result TYPE JSONB USING prediction_result::JSONB;

-- Add comments to explain the columns
COMMENT ON COLUMN predictions.features_used IS 'JSON containing all features used for the prediction';
COMMENT ON COLUMN predictions.predicted_demand IS 'The predicted demand value';
COMMENT ON COLUMN predictions.confidence_score IS 'Confidence score of the prediction (0-1)';