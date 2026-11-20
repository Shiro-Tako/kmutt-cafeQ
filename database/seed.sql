-- KMUTT CafeQ demo data. Run after schema.sql. Demo data only, never real accounts.
-- Fixed IDs match the docs: Cafe Rung 1, Food Court 2, Iced Americano 101,
-- Cafe Rung staff 202, sample order 301. Prices are in satang.

USE kmutt_cafeq;

-- password_hash is a placeholder. Member 2 picks the hashing library; once chosen,
-- replace it with a real hash of the demo password (see database/README.md).
INSERT INTO users (id, name, email, password_hash) VALUES
  (201, 'Demo Customer',     'customer@example.test',        '$2b$10$REPLACE_WITH_REAL_HASH_OF_demo1234_0000000000000000000'),
  (202, 'Staff Demo',        'staff-rung@example.test',      '$2b$10$REPLACE_WITH_REAL_HASH_OF_demo1234_0000000000000000000'),
  (203, 'Staff Food Court',  'staff-foodcourt@example.test', '$2b$10$REPLACE_WITH_REAL_HASH_OF_demo1234_0000000000000000000');

INSERT INTO cafes (id, name, pickup_point) VALUES
  (1, 'Cafe Rung',  'Cafe Rung pickup counter'),
  (2, 'Food Court', 'Food Court pickup counter');

-- Each staff member works at one cafe only, to test cross-cafe access.
INSERT INTO cafe_staff (user_id, cafe_id) VALUES
  (202, 1),
  (203, 2);

INSERT INTO menu_items (id, cafe_id, name, category, description, price, image_url, is_active) VALUES
  (101, 1, 'Iced Americano',          'Coffee',     'Double espresso and water, served cold',            5500, '/figma/c78c7.png', 1),
  (102, 1, 'Iced Coffee Sweet Heaven','Coffee',     'Double espresso with condensed milk, served cold',  7000, '/figma/e532a.png', 1),
  (103, 1, 'Hot Cappuccino',          'Coffee',     'Double espresso and fresh milk, served hot',        4000, '/figma/dda84.png', 1),
  (104, 1, 'Iced Cappuccino',         'Coffee',     'Double espresso and fresh milk, served cold',       4500, '/figma/6f32b.png', 1),
  (105, 1, 'Iced Coffee Lemonade',    'Coffee',     'Double espresso with fresh lemonade, served cold',  5500, '/figma/dd102.png', 1),
  (106, 1, 'Iced Mocha',              'Coffee',     'Double espresso and chocolate, served cold',        5500, '/figma/2532d.png', 1),
  (107, 1, 'Iced Lemonade',           'Tea & More', 'Fresh lemon over ice',                              4500, '/figma/c468c.png', 1),
  (108, 1, 'Iced Chocolate',          'Tea & More', 'Chocolate and milk, served cold',                   6000, '/figma/d790d.png', 1),
  (109, 1, 'Hot Chocolate',           'Tea & More', 'Warm chocolate and steamed milk',                   5000, '/figma/39bbc.png', 1),
  (110, 1, 'Iced Lemon Tea',          'Tea & More', 'Chilled tea with lemon',                            5500, '/figma/dd102.png', 1),
  (111, 2, 'Thai Milk Tea',           'Tea & More', 'Thai tea with milk over ice',                       4000, NULL,               1),
  (112, 2, 'Chocolate Cake',          'Snacks',     'A slice of chocolate cake',                         6500, NULL,               1);

-- Four orders, one per status. Packaging fee is 500 (5 baht) per order.
INSERT INTO orders (id, user_id, cafe_id, pickup_point, status, subtotal, packaging_fee, total, created_at, updated_at) VALUES
  (301, 201, 1, 'Cafe Rung pickup counter',  'Waiting',   11000, 500, 11500, '2026-11-14 09:30:00', '2026-11-14 09:30:00'),
  (302, 201, 1, 'Cafe Rung pickup counter',  'Preparing',  4000, 500,  4500, '2026-11-14 09:20:00', '2026-11-14 09:25:00'),
  (303, 201, 2, 'Food Court pickup counter', 'Ready',      8000, 500,  8500, '2026-11-14 09:10:00', '2026-11-14 09:18:00'),
  (304, 201, 1, 'Cafe Rung pickup counter',  'Done',       6000, 500,  6500, '2026-11-13 09:00:00', '2026-11-13 09:12:00');

INSERT INTO order_items (order_id, menu_item_id, name, unit_price, quantity) VALUES
  (301, 101, 'Iced Americano', 5500, 2),
  (302, 103, 'Hot Cappuccino', 4000, 1),
  (303, 111, 'Thai Milk Tea',  4000, 2),
  (304, 108, 'Iced Chocolate', 6000, 1);

INSERT INTO payments (id, order_id, user_id, confirmation_id, request_fingerprint, amount, method, status, confirmed_at) VALUES
  (401, 301, 201, '00000000-0000-4000-8000-000000000301', REPEAT('a', 64), 11500, 'PromptPay demo', 'Succeeded', '2026-11-14 09:30:00'),
  (402, 302, 201, '00000000-0000-4000-8000-000000000302', REPEAT('b', 64),  4500, 'PromptPay demo', 'Succeeded', '2026-11-14 09:20:00'),
  (403, 303, 201, '00000000-0000-4000-8000-000000000303', REPEAT('c', 64),  8500, 'PromptPay demo', 'Succeeded', '2026-11-14 09:10:00'),
  (404, 304, 201, '00000000-0000-4000-8000-000000000304', REPEAT('d', 64),  6500, 'PromptPay demo', 'Succeeded', '2026-11-13 09:00:00');

INSERT INTO favorites (user_id, menu_item_id) VALUES
  (201, 101),
  (201, 108);
