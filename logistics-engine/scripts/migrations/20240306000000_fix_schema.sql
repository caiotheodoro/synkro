-- Fix warehouses table by removing duplicate fields and fixing structure
ALTER TABLE IF EXISTS warehouses 
DROP COLUMN IF EXISTS customer_id,
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS total_amount,
DROP COLUMN IF EXISTS currency,
DROP COLUMN IF EXISTS tracking_number,
DROP COLUMN IF EXISTS notes;

-- Add missing columns to shipping_info
ALTER TABLE IF EXISTS shipping_info
ADD COLUMN IF NOT EXISTS status_str VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS carrier VARCHAR(100);

-- Add missing columns to payment_info
ALTER TABLE IF EXISTS payment_info
RENAME COLUMN status TO status_enum;

ALTER TABLE IF EXISTS payment_info
ADD COLUMN IF NOT EXISTS status_str VARCHAR(50) DEFAULT 'pending';

-- Update payment_info to set status_str from status_enum
UPDATE payment_info SET status_str = status_enum::text; 

ALTER TABLE IF EXISTS inventory_reservations
ADD COLUMN IF NOT EXISTS product_id UUID;



ALTER TABLE IF EXISTS inventory_items
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS attributes JSONB;
