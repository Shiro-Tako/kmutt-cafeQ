-- KMUTT CafeQ database checks. Run after schema.sql and seed.sql on a fresh database.
-- Every check is a SELECT, or a change inside a transaction that is rolled back.
-- Read the result grid under each query. "EXPECT" says what it should show.

USE kmutt_cafeq;

-- 1. Row counts after a fresh install.
-- EXPECT: users 3, cafes 2, cafe_staff 2, menu_items 12, orders 4, order_items 4, payments 4, favorites 2
SELECT 'users' AS table_name, COUNT(*) AS n FROM users
UNION ALL SELECT 'cafes', COUNT(*) FROM cafes
UNION ALL SELECT 'cafe_staff', COUNT(*) FROM cafe_staff
UNION ALL SELECT 'menu_items', COUNT(*) FROM menu_items
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'favorites', COUNT(*) FROM favorites;

-- 2. Money adds up: subtotal equals the sum of its items, total equals subtotal + fee,
-- and each order has exactly one payment for the same amount.
-- EXPECT: zero rows (any row listed is a problem)
SELECT o.id AS order_id, o.subtotal, SUM(oi.unit_price * oi.quantity) AS items_sum,
       o.total, p.amount AS paid
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN payments p ON p.order_id = o.id
GROUP BY o.id, o.subtotal, o.total, p.amount
HAVING o.subtotal <> items_sum OR o.total <> p.amount OR p.amount IS NULL;

-- 3. Queue is separated by cafe: the Cafe Rung queue must not contain Food Court orders.
-- EXPECT: orders 301, 302 (Waiting, Preparing) and 304 (Done) only, all cafe_id 1
SELECT id, cafe_id, status, created_at
FROM orders
WHERE cafe_id = 1
ORDER BY created_at;

-- EXPECT: only order 303 (Ready), cafe_id 2
SELECT id, cafe_id, status, created_at
FROM orders
WHERE cafe_id = 2
ORDER BY created_at;

-- 4. Staff permission: staff 202 may only manage cafe 1.
-- EXPECT: staff 202 -> cafe 1 only; staff 203 -> cafe 2 only
SELECT user_id, cafe_id FROM cafe_staff ORDER BY user_id;

-- 5. Old totals do not change when a menu price changes.
-- The change below is rolled back at the end, so the demo data stays as it was.
START TRANSACTION;
UPDATE menu_items SET price = 9999, name = 'Renamed Americano' WHERE id = 101;
-- EXPECT: unit_price 5500, name 'Iced Americano', total 11500 (unchanged snapshot)
SELECT oi.order_id, oi.name, oi.unit_price, oi.quantity, o.total
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE oi.order_id = 301;
ROLLBACK;

-- 6. Stopping a sale keeps history: set is_active = 0 and the old order still reads fine.
START TRANSACTION;
UPDATE menu_items SET is_active = 0 WHERE id = 101;
-- EXPECT: active_cafe_rung_items = 9 (10 items minus the one switched off), and order 301 still lists its Iced Americano
SELECT COUNT(*) AS active_cafe_rung_items FROM menu_items WHERE cafe_id = 1 AND is_active = 1;
SELECT order_id, name, quantity FROM order_items WHERE order_id = 301;
ROLLBACK;

-- 7. Repeating a payment request is blocked by the unique key.
-- EXPECT: one row showing confirmation 00000000-0000-4000-8000-000000000301 exists once
SELECT user_id, confirmation_id, COUNT(*) AS times_used
FROM payments
WHERE user_id = 201 AND confirmation_id = '00000000-0000-4000-8000-000000000301'
GROUP BY user_id, confirmation_id;

-- 8. Indexes exist for menu lookup, history and queue.
-- EXPECT: idx_menu_cafe_active_category, idx_orders_user_created, idx_orders_cafe_status_created
SELECT table_name, index_name, GROUP_CONCAT(column_name ORDER BY seq_in_index) AS columns_in_index
FROM information_schema.statistics
WHERE table_schema = 'kmutt_cafeq'
  AND index_name IN ('idx_menu_cafe_active_category', 'idx_orders_user_created', 'idx_orders_cafe_status_created')
GROUP BY table_name, index_name;

-- 9. Constraints reject bad data. Run these ONE AT A TIME (select one line, press Ctrl+Enter).
-- Each should fail with an error. If one succeeds, delete the row it added.
-- (a) negative price:       INSERT INTO menu_items (cafe_id, name, category, price) VALUES (1, 'Bad', 'Coffee', -1);
-- (b) bad category:         INSERT INTO menu_items (cafe_id, name, category, price) VALUES (1, 'Bad', 'Food', 100);
-- (c) zero quantity:        INSERT INTO order_items (order_id, menu_item_id, name, unit_price, quantity) VALUES (301, 102, 'Bad', 100, 0);
-- (d) bad status:           UPDATE orders SET status = 'Cancelled' WHERE id = 301;
-- (e) total mismatch:       UPDATE orders SET total = 1 WHERE id = 301;
-- (f) duplicate email:      INSERT INTO users (name, email, password_hash) VALUES ('Dup', 'customer@example.test', 'x');
-- (g) unknown cafe:         INSERT INTO menu_items (cafe_id, name, category, price) VALUES (99, 'Bad', 'Coffee', 100);
