-- Add item_id column to predictions table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='predictions' AND column_name='item_id'
    ) THEN
        ALTER TABLE predictions ADD COLUMN item_id VARCHAR(255) NOT NULL DEFAULT 'legacy';
        CREATE INDEX IF NOT EXISTS idx_predictions_item_id ON predictions(item_id);
    END IF;
END $$; 