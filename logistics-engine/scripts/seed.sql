TRUNCATE TABLE inventory_levels, inventory_items, warehouses, inventory_reservations, inventory_transactions,
           order_items, order_status_history, orders, customers, payment_info, shipping_info CASCADE;

INSERT INTO warehouses (id, code, name, address_line1, address_line2, city, state, postal_code, country, contact_name, contact_phone, contact_email, created_at, updated_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'NYC-WH1', 'New York City Warehouse', '123 Broadway', 'Suite 500', 'New York', 'NY', '10001', 'USA', 'John Smith', '212-555-1234', 'john.smith@example.com', NOW() - INTERVAL '300 days', NOW()),
    ('22222222-2222-2222-2222-222222222222', 'LA-WH1', 'Los Angeles Warehouse', '456 Hollywood Blvd', 'Unit 200', 'Los Angeles', 'CA', '90028', 'USA', 'Sarah Johnson', '310-555-5678', 'sarah.johnson@example.com', NOW() - INTERVAL '290 days', NOW()),
    ('33333333-3333-3333-3333-333333333333', 'CHI-WH1', 'Chicago Warehouse', '789 Michigan Ave', 'Floor 3', 'Chicago', 'IL', '60601', 'USA', 'Michael Brown', '312-555-9012', 'michael.brown@example.com', NOW() - INTERVAL '280 days', NOW()),
    ('44444444-4444-4444-4444-444444444444', 'ATL-WH1', 'Atlanta Warehouse', '101 Peachtree St', 'Dock 7', 'Atlanta', 'GA', '30303', 'USA', 'Jessica Davis', '404-555-3456', 'jessica.davis@example.com', NOW() - INTERVAL '270 days', NOW()),
    ('55555555-5555-5555-5555-555555555555', 'SEA-WH1', 'Seattle Warehouse', '202 Pike St', 'Warehouse B', 'Seattle', 'WA', '98101', 'USA', 'David Wilson', '206-555-7890', 'david.wilson@example.com', NOW() - INTERVAL '260 days', NOW());

INSERT INTO inventory_items (id, sku, name, description, category, attributes, warehouse_id, created_at, updated_at, price, overstock_threshold, low_stock_threshold, quantity)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ELEC-001', 'Smartphone X', 'Latest model smartphone', 'Electronics', '{"color": "black", "storage": "128GB"}', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '295 days', NOW(), 999.99, 200, 50, 120),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'ELEC-002', 'Laptop Pro', 'High-performance laptop', 'Electronics', '{"color": "silver", "ram": "16GB"}', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '290 days', NOW(), 1499.99, 150, 30, 85),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', 'ELEC-003', 'Wireless Earbuds', 'Noise-cancelling earbuds', 'Electronics', '{"color": "white", "batteryLife": "24h"}', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '285 days', NOW(), 199.99, 300, 75, 210),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', 'ELEC-004', 'Smart Watch', 'Fitness tracking watch', 'Electronics', '{"color": "black", "waterproof": true}', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '280 days', NOW(), 299.99, 250, 60, 175),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', 'ELEC-005', 'Tablet Ultra', '10-inch tablet', 'Electronics', '{"color": "space gray", "storage": "256GB"}', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '275 days', NOW(), 699.99, 150, 40, 95),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbba', 'CLTH-001', 'Men''s T-Shirt', 'Cotton crew neck t-shirt', 'Clothing', '{"size": "M", "color": "blue"}', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '270 days', NOW(), 24.99, 500, 100, 350),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CLTH-002', 'Women''s Jeans', 'Slim fit denim jeans', 'Clothing', '{"size": "S", "color": "indigo"}', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '265 days', NOW(), 59.99, 400, 80, 220),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 'CLTH-003', 'Winter Jacket', 'Insulated puffer jacket', 'Clothing', '{"size": "L", "color": "black"}', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '260 days', NOW(), 129.99, 200, 50, 40),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbd', 'CLTH-004', 'Athletic Shoes', 'Running performance shoes', 'Clothing', '{"size": "10", "color": "white/red"}', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '255 days', NOW(), 89.99, 300, 75, 65),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbe', 'CLTH-005', 'Wool Sweater', 'Warm knit sweater', 'Clothing', '{"size": "XL", "color": "navy"}', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '250 days', NOW(), 79.99, 250, 60, 25),
    ('cccccccc-cccc-cccc-cccc-ccccccccccca', 'HOME-001', 'Coffee Maker', 'Programmable drip coffee maker', 'Home Goods', '{"color": "black", "cups": "12"}', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '245 days', NOW(), 89.99, 150, 30, 100),
    ('cccccccc-cccc-cccc-cccc-cccccccccccb', 'HOME-002', 'Blender', 'High-speed blender', 'Home Goods', '{"color": "red", "watts": "1200"}', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '240 days', NOW(), 129.99, 100, 25, 80),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'HOME-003', 'Bed Sheets', 'Egyptian cotton queen sheets', 'Home Goods', '{"color": "white", "thread_count": "800"}', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '235 days', NOW(), 69.99, 200, 50, 140),
    ('cccccccc-cccc-cccc-cccc-cccccccccccd', 'HOME-004', 'Dining Set', '4-person table and chairs', 'Home Goods', '{"color": "oak", "pieces": "5"}', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '230 days', NOW(), 599.99, 50, 10, 8),
    ('cccccccc-cccc-cccc-cccc-ccccccccccce', 'HOME-005', 'Vacuum Cleaner', 'Bagless upright vacuum', 'Home Goods', '{"color": "purple", "cordless": true}', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '225 days', NOW(), 249.99, 75, 15, 17);

INSERT INTO inventory_levels (item_id, warehouse_id, quantity, reserved, available, last_updated)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 120, 20, 100, NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', '11111111-1111-1111-1111-111111111111', 85, 15, 70, NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', '22222222-2222-2222-2222-222222222222', 210, 30, 180, NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', '33333333-3333-3333-3333-333333333333', 175, 25, 150, NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', '44444444-4444-4444-4444-444444444444', 95, 15, 80, NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbba', '22222222-2222-2222-2222-222222222222', 350, 50, 300, NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 220, 40, 180, NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', '33333333-3333-3333-3333-333333333333', 40, 10, 30, NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbd', '44444444-4444-4444-4444-444444444444', 65, 15, 50, NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbe', '55555555-5555-5555-5555-555555555555', 25, 5, 20, NOW()),
    ('cccccccc-cccc-cccc-cccc-ccccccccccca', '11111111-1111-1111-1111-111111111111', 100, 20, 80, NOW()),
    ('cccccccc-cccc-cccc-cccc-cccccccccccb', '33333333-3333-3333-3333-333333333333', 80, 10, 70, NOW()),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', 140, 20, 120, NOW()),
    ('cccccccc-cccc-cccc-cccc-cccccccccccd', '55555555-5555-5555-5555-555555555555', 8, 3, 5, NOW()),
    ('cccccccc-cccc-cccc-cccc-ccccccccccce', '11111111-1111-1111-1111-111111111111', 17, 2, 15, NOW());

INSERT INTO customers (id, name, email, phone, created_at, updated_at)
VALUES
    ('dddddddd-dddd-dddd-dddd-ddddddddddda', 'Alice Johnson', 'alice.johnson@example.com', '555-123-4567', NOW() - INTERVAL '300 days', NOW()),
    ('dddddddd-dddd-dddd-dddd-dddddddddddb', 'Bob Williams', 'bob.williams@example.com', '555-234-5678', NOW() - INTERVAL '290 days', NOW()),
    ('dddddddd-dddd-dddd-dddd-dddddddddddc', 'Carol Martinez', 'carol.martinez@example.com', '555-345-6789', NOW() - INTERVAL '280 days', NOW()),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'David Anderson', 'david.anderson@example.com', '555-456-7890', NOW() - INTERVAL '270 days', NOW()),
    ('dddddddd-dddd-dddd-dddd-ddddddddddde', 'Emma Thomas', 'emma.thomas@example.com', '555-567-8901', NOW() - INTERVAL '260 days', NOW()),
    ('dddddddd-dddd-dddd-dddd-dddddddddddf', 'Frank Wilson', 'frank.wilson@example.com', '555-678-9012', NOW() - INTERVAL '250 days', NOW());

-- Add more seasonal orders for trend analysis
WITH seasonal_order_data AS (
    -- Holiday season orders (higher volume in November-December)
    SELECT 
        gen_random_uuid() as id,
        ROW_NUMBER() OVER () as row_num,
        'delivered'::order_status as status,
        (NOW() - INTERVAL '365 days' + INTERVAL '11 months' + (RANDOM() * 30)::INT * INTERVAL '1 day') as created_date,
        (NOW() - INTERVAL '365 days' + INTERVAL '11 months' + (RANDOM() * 30)::INT * INTERVAL '1 day' + INTERVAL '4 day') as updated_date
    FROM generate_series(1, 30)
    UNION ALL
    -- Summer season orders (June-August)
    SELECT 
        gen_random_uuid() as id,
        ROW_NUMBER() OVER () + 30 as row_num,
        'delivered'::order_status as status,
        (NOW() - INTERVAL '365 days' + INTERVAL '6 months' + (RANDOM() * 60)::INT * INTERVAL '1 day') as created_date,
        (NOW() - INTERVAL '365 days' + INTERVAL '6 months' + (RANDOM() * 60)::INT * INTERVAL '1 day' + INTERVAL '3 day') as updated_date
    FROM generate_series(1, 20)
    UNION ALL
    -- Back to school season (August-September)
    SELECT 
        gen_random_uuid() as id,
        ROW_NUMBER() OVER () + 50 as row_num,
        'delivered'::order_status as status,
        (NOW() - INTERVAL '365 days' + INTERVAL '8 months' + (RANDOM() * 30)::INT * INTERVAL '1 day') as created_date,
        (NOW() - INTERVAL '365 days' + INTERVAL '8 months' + (RANDOM() * 30)::INT * INTERVAL '1 day' + INTERVAL '3 day') as updated_date
    FROM generate_series(1, 15)
    UNION ALL
    -- Recent orders with various statuses for pipeline analysis
    SELECT 
        gen_random_uuid() as id,
        ROW_NUMBER() OVER () + 65 as row_num,
        CASE (RANDOM() * 4)::INT
            WHEN 0 THEN 'pending'::order_status
            WHEN 1 THEN 'processing'::order_status
            WHEN 2 THEN 'shipped'::order_status
            ELSE 'delivered'::order_status
        END as status,
        (NOW() - (RANDOM() * 30)::INT * INTERVAL '1 day') as created_date,
        (NOW() - (RANDOM() * 30)::INT * INTERVAL '1 day' + INTERVAL '1 day') as updated_date
    FROM generate_series(1, 50)
)
INSERT INTO orders (id, customer_id, status, total_amount, currency, tracking_number, notes, created_at, updated_at)
SELECT 
    s.id,
    -- Distribute orders among customers using direct selection instead of temp table
    CASE (s.row_num % 6)
        WHEN 0 THEN 'dddddddd-dddd-dddd-dddd-dddddddddddf'::uuid
        WHEN 1 THEN 'dddddddd-dddd-dddd-dddd-ddddddddddda'::uuid
        WHEN 2 THEN 'dddddddd-dddd-dddd-dddd-dddddddddddb'::uuid
        WHEN 3 THEN 'dddddddd-dddd-dddd-dddd-dddddddddddc'::uuid
        WHEN 4 THEN 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid
        WHEN 5 THEN 'dddddddd-dddd-dddd-dddd-ddddddddddde'::uuid
    END,
    s.status,
    (RANDOM() * 900 + 100)::DECIMAL(10,2),
    'USD',
    CASE 
        WHEN s.status IN ('delivered', 'processing', 'shipped') THEN 'TRK' || LPAD((RANDOM() * 10000000)::TEXT, 10, '0')
        ELSE NULL
    END,
    CASE (RANDOM() * 3)::INT
        WHEN 0 THEN 'Standard order'
        WHEN 1 THEN 'Gift order - please wrap'
        ELSE 'Customer requested expedited shipping'
    END,
    s.created_date,
    s.updated_date
FROM seasonal_order_data s;

-- Add category-specific order items to enable better analysis by product category
WITH all_orders AS (
    SELECT id, created_at, updated_at FROM orders -- Fixed: Include created_at and updated_at columns
    ORDER BY created_at DESC
    LIMIT 120
)
INSERT INTO order_items (id, order_id, sku, name, quantity, unit_price, total_price, created_at, updated_at, product_id)
SELECT 
    gen_random_uuid(),
    o.id,
    i.sku,
    i.name,
    CASE
        WHEN i.category = 'Electronics' THEN (RANDOM() * 2 + 1)::INT
        WHEN i.category = 'Clothing' THEN (RANDOM() * 3 + 1)::INT
        ELSE (RANDOM() * 4 + 1)::INT
    END as quantity,
    i.price,
    (CASE
        WHEN i.category = 'Electronics' THEN (RANDOM() * 2 + 1)::INT
        WHEN i.category = 'Clothing' THEN (RANDOM() * 3 + 1)::INT
        ELSE (RANDOM() * 4 + 1)::INT
    END * i.price)::DECIMAL(10,2) as total_price,
    o.created_at,
    o.updated_at,
    i.id
FROM all_orders o
CROSS JOIN LATERAL (
    SELECT id, sku, name, price, category FROM inventory_items
    WHERE category IS NOT NULL
    ORDER BY RANDOM()
    LIMIT 1
) i;

-- Add some orders with multiple items of the same category for category analysis
WITH multi_item_orders AS (
    SELECT id, created_at, updated_at FROM orders -- Fixed: Include created_at and updated_at columns
    ORDER BY RANDOM()
    LIMIT 40
)
INSERT INTO order_items (id, order_id, sku, name, quantity, unit_price, total_price, created_at, updated_at, product_id)
SELECT 
    gen_random_uuid(),
    o.id,
    i.sku,
    i.name,
    (RANDOM() * 2 + 1)::INT as quantity,
    i.price,
    ((RANDOM() * 2 + 1)::INT * i.price)::DECIMAL(10,2) as total_price,
    o.created_at,
    o.updated_at,
    i.id
FROM multi_item_orders o
CROSS JOIN LATERAL (
    SELECT id, sku, name, price, category FROM inventory_items i1
    WHERE category = (
        SELECT category FROM inventory_items i2
        JOIN order_items oi ON i2.id = oi.product_id
        WHERE oi.order_id = o.id
        LIMIT 1
    )
    AND id NOT IN (
        SELECT product_id FROM order_items WHERE order_id = o.id
    )
    ORDER BY RANDOM()
    LIMIT 2
) i;

-- Add some orders with items across multiple categories for cross-selling analysis
WITH cross_category_orders AS (
    SELECT id, created_at, updated_at FROM orders -- Fixed: Include created_at and updated_at columns
    ORDER BY RANDOM()
    LIMIT 25
)
INSERT INTO order_items (id, order_id, sku, name, quantity, unit_price, total_price, created_at, updated_at, product_id)
SELECT 
    gen_random_uuid(),
    o.id,
    i.sku,
    i.name,
    (RANDOM() * 2 + 1)::INT as quantity,
    i.price,
    ((RANDOM() * 2 + 1)::INT * i.price)::DECIMAL(10,2) as total_price,
    o.created_at,
    o.updated_at,
    i.id
FROM cross_category_orders o
CROSS JOIN LATERAL (
    SELECT id, sku, name, price, category FROM inventory_items i1
    WHERE category != (
        SELECT category FROM inventory_items i2
        JOIN order_items oi ON i2.id = oi.product_id
        WHERE oi.order_id = o.id
        LIMIT 1
    )
    ORDER BY RANDOM()
    LIMIT 2
) i;

-- Add some high-value orders for revenue analysis
WITH high_value_orders AS (
    SELECT id, created_at, updated_at FROM orders -- Fixed: Include created_at and updated_at columns
    ORDER BY RANDOM()
    LIMIT 10
)
INSERT INTO order_items (id, order_id, sku, name, quantity, unit_price, total_price, created_at, updated_at, product_id)
SELECT 
    gen_random_uuid(),
    o.id,
    i.sku,
    i.name,
    (RANDOM() * 3 + 3)::INT as quantity,
    i.price,
    ((RANDOM() * 3 + 3)::INT * i.price)::DECIMAL(10,2) as total_price,
    o.created_at,
    o.updated_at,
    i.id
FROM high_value_orders o
CROSS JOIN LATERAL (
    SELECT id, sku, name, price FROM inventory_items
    WHERE price > 500
    ORDER BY RANDOM()
    LIMIT 1
) i;

-- Update order total amounts after adding all these new order items
UPDATE orders o
SET total_amount = (
    SELECT SUM(total_price) FROM order_items WHERE order_id = o.id
)
WHERE EXISTS (
    SELECT 1 FROM order_items WHERE order_id = o.id
);

INSERT INTO order_status_history (id, order_id, previous_status, new_status, status_notes, changed_by, created_at)
SELECT
    gen_random_uuid(),
    id,
    NULL,
    'pending',
    'Order created',
    'system',
    created_at
FROM orders;

INSERT INTO order_status_history (id, order_id, previous_status, new_status, status_notes, changed_by, created_at)
SELECT
    gen_random_uuid(),
    id,
    'pending',
    'processing',
    'Order processing started',
    'system',
    created_at + INTERVAL '1 day'
FROM orders
WHERE status IN ('delivered', 'processing', 'shipped');

INSERT INTO order_status_history (id, order_id, previous_status, new_status, status_notes, changed_by, created_at)
SELECT
    gen_random_uuid(),
    id,
    'processing',
    'shipped',
    'Order shipped',
    'system',
    updated_at - INTERVAL '2 days'
FROM orders
WHERE status IN ('delivered', 'shipped');

INSERT INTO order_status_history (id, order_id, previous_status, new_status, status_notes, changed_by, created_at)
SELECT
    gen_random_uuid(),
    id,
    'processing',
    'delivered',
    'Order delivered',
    'system',
    updated_at
FROM orders
WHERE status = 'delivered';

INSERT INTO order_status_history (id, order_id, previous_status, new_status, status_notes, changed_by, created_at)
SELECT
    gen_random_uuid(),
    id,
    'pending',
    'cancelled',
    'Order canceled by customer',
    'system',
    updated_at
FROM orders
WHERE status = 'cancelled';

INSERT INTO payment_info (id, order_id, payment_method, transaction_id, currency, payment_date, created_at, updated_at, status, amount)
SELECT
    gen_random_uuid(),
    id,
    CASE (RANDOM() * 3)::INT
        WHEN 0 THEN 'CREDIT_CARD'
        WHEN 1 THEN 'PAYPAL'
        WHEN 2 THEN 'BANK_TRANSFER'
        ELSE 'OTHER'
    END,
    'TXN' || LPAD((RANDOM() * 10000000)::TEXT, 10, '0'),
    'USD',
    CASE
        WHEN status IN ('delivered', 'processing') THEN created_at + INTERVAL '1 hour'
        ELSE NULL
    END,
    created_at,
    updated_at,
    CASE
        WHEN status = 'delivered' THEN 'paid'
        WHEN status = 'processing' THEN 'processing'
        WHEN status = 'cancelled' THEN 'refunded'
        ELSE 'pending'
    END,
    total_amount
FROM orders;

INSERT INTO shipping_info (id, order_id, address_line1, address_line2, city, state, postal_code, country, recipient_name, recipient_phone, shipping_method, shipping_cost, created_at, updated_at, tracking_number, carrier, status, expected_delivery, actual_delivery)
SELECT
    gen_random_uuid(),
    o.id,
    '123 Main St',
    'Apt ' || (RANDOM() * 100)::INT,
    CASE (RANDOM() * 4)::INT
        WHEN 0 THEN 'New York'
        WHEN 1 THEN 'Los Angeles'
        WHEN 2 THEN 'Chicago'
        WHEN 3 THEN 'Houston'
        ELSE 'Miami'
    END,
    CASE (RANDOM() * 4)::INT
        WHEN 0 THEN 'NY'
        WHEN 1 THEN 'CA'
        WHEN 2 THEN 'IL'
        WHEN 3 THEN 'TX'
        ELSE 'FL'
    END,
    LPAD((RANDOM() * 99999)::TEXT, 5, '0'),
    'USA',
    c.name,
    c.phone,
    CASE (RANDOM() * 2)::INT
        WHEN 0 THEN 'STANDARD'
        WHEN 1 THEN 'EXPRESS'
        ELSE 'OVERNIGHT'
    END,
    (RANDOM() * 50)::DECIMAL(10,2),
    o.created_at,
    o.updated_at,
    CASE 
        WHEN o.status IN ('delivered', 'processing') THEN o.tracking_number
        ELSE NULL
    END,
    CASE (RANDOM() * 2)::INT
        WHEN 0 THEN 'UPS'
        WHEN 1 THEN 'FedEx'
        ELSE 'USPS'
    END,
    CASE
        WHEN o.status = 'delivered' THEN 'delivered'
        WHEN o.status = 'processing' THEN 'shipped'
        WHEN o.status = 'pending' THEN 'pending'
        ELSE 'canceled'
    END,
    CASE
        WHEN o.status IN ('delivered', 'processing') THEN o.created_at + INTERVAL '7 days'
        ELSE NULL
    END,
    CASE
        WHEN o.status = 'delivered' THEN o.updated_at
        ELSE NULL
    END
FROM orders o
JOIN customers c ON o.customer_id = c.id;

INSERT INTO inventory_transactions (id, item_id, type, reference, warehouse_id, created_at, updated_at, user_id, quantity)
SELECT
    gen_random_uuid(),
    id,
    'RECEIVING',
    'INIT-' || sku,
    warehouse_id,
    created_at,
    created_at,
    NULL,
    quantity
FROM inventory_items;

DO $$
DECLARE
    item_record RECORD;
    transaction_date TIMESTAMP;
    transaction_type TEXT;
    quantity INT;
    item_count INT;
BEGIN
    SELECT COUNT(*) INTO item_count FROM inventory_items;
    
    FOR day IN 1..180 LOOP
        transaction_date := NOW() - INTERVAL '180 days' + (day * INTERVAL '1 day');
        
        FOR i IN 1..((RANDOM() * 2)::INT + 1) LOOP
            FOR item_record IN 
                SELECT id, sku, warehouse_id 
                FROM inventory_items 
                ORDER BY RANDOM() 
                LIMIT 1
            LOOP
                IF RANDOM() < 0.6 THEN
                    transaction_type := 'RECEIVING';
                    quantity := ((RANDOM() * 20) + 5)::INT;
                ELSIF RANDOM() < 0.8 THEN
                    transaction_type := 'SHIPPING';
                    quantity := -((RANDOM() * 10) + 1)::INT;
                ELSE
                    transaction_type := 'ADJUSTMENT';
                    quantity := ((RANDOM() * 10) - 5)::INT;
                END IF;
                
                INSERT INTO inventory_transactions (
                    id, item_id, type, reference, warehouse_id, created_at, updated_at, 
                    user_id, quantity
                ) VALUES (
                    gen_random_uuid(),
                    item_record.id,
                    transaction_type,
                    'TRANS-' || TO_CHAR(transaction_date, 'YYYYMMDD') || '-' || item_record.sku,
                    item_record.warehouse_id,
                    transaction_date + (RANDOM() * INTERVAL '23 hours'),
                    transaction_date + (RANDOM() * INTERVAL '23 hours'),
                    NULL,
                    quantity
                );
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

INSERT INTO inventory_reservations (id, order_id, product_id, quantity, status, created_at, expires_at, updated_at, sku)
SELECT
    gen_random_uuid(),
    o.id,
    oi.product_id,
    oi.quantity,
    CASE
        WHEN o.status = 'delivered' THEN 'fulfilled'
        WHEN o.status = 'processing' THEN 'active'
        WHEN o.status = 'pending' THEN 'active'
        ELSE 'canceled'
    END,
    o.created_at,
    -- Always provide a value for expires_at, regardless of status
    o.created_at + INTERVAL '7 days',
    o.updated_at,
    oi.sku
FROM orders o
JOIN order_items oi ON o.id = oi.order_id; 