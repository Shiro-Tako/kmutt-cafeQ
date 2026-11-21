CREATE TABLE IF NOT EXISTS app_lock (id INT PRIMARY KEY, initialized BOOLEAN NOT NULL DEFAULT FALSE);
INSERT IGNORE INTO app_lock (id) VALUES (1);
CREATE TABLE IF NOT EXISTS cafes (
 id INT PRIMARY KEY, name VARCHAR(80) NOT NULL, pickup_point VARCHAR(160) NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
 id INT PRIMARY KEY, name VARCHAR(80) NOT NULL, email VARCHAR(254) NOT NULL UNIQUE, password_hash VARCHAR(200) NOT NULL
);
CREATE TABLE IF NOT EXISTS cafe_staff (
 user_id INT NOT NULL, cafe_id INT NOT NULL, PRIMARY KEY (user_id,cafe_id),
 FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (cafe_id) REFERENCES cafes(id)
);
CREATE TABLE IF NOT EXISTS profile_photos (
 user_id INT PRIMARY KEY, photo TEXT NOT NULL,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS cafe_owners (
 cafe_id INT PRIMARY KEY, user_id INT NOT NULL,
 FOREIGN KEY (cafe_id) REFERENCES cafes(id), FOREIGN KEY (user_id) REFERENCES users(id)
);
-- Existing demo stores: designate the earliest staff account as owner once.
INSERT IGNORE INTO cafe_owners (cafe_id,user_id)
 SELECT cafe_id, MIN(user_id) FROM cafe_staff GROUP BY cafe_id;
CREATE TABLE IF NOT EXISTS menu_items (
 id INT PRIMARY KEY, cafe_id INT NOT NULL, name VARCHAR(80) NOT NULL, category VARCHAR(30) NOT NULL,
 description VARCHAR(160) NOT NULL, price INT NOT NULL CHECK (price >= 0), image_url VARCHAR(255),
 is_active BOOLEAN NOT NULL DEFAULT TRUE, FOREIGN KEY (cafe_id) REFERENCES cafes(id),
 INDEX menu_by_cafe (cafe_id,is_active,category)
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash CHAR(64) PRIMARY KEY, user_id INT NOT NULL, expires_at BIGINT NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS favorites (
 user_id INT NOT NULL, menu_item_id INT NOT NULL, PRIMARY KEY (user_id,menu_item_id),
 FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);
CREATE TABLE IF NOT EXISTS orders (
 id INT PRIMARY KEY, user_id INT NOT NULL, cafe_id INT NOT NULL, pickup_point VARCHAR(160) NOT NULL,
 status ENUM('Waiting','Preparing','Ready','Done') NOT NULL, subtotal INT NOT NULL, packaging_fee INT NOT NULL,
 total INT NOT NULL, created_at VARCHAR(30) NOT NULL, customer_name VARCHAR(80) NOT NULL,
 FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (cafe_id) REFERENCES cafes(id),
 INDEX customer_history (user_id,created_at), INDEX cafe_queue (cafe_id,status,created_at)
);
CREATE TABLE IF NOT EXISTS order_items (
 order_id INT NOT NULL, menu_item_id INT NOT NULL, name VARCHAR(80) NOT NULL,
 unit_price INT NOT NULL, quantity INT NOT NULL CHECK (quantity > 0), PRIMARY KEY (order_id,menu_item_id),
 FOREIGN KEY (order_id) REFERENCES orders(id), FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);
CREATE TABLE IF NOT EXISTS payments (
 order_id INT PRIMARY KEY, user_id INT NOT NULL, confirmation_id CHAR(36) NOT NULL, fingerprint CHAR(64) NOT NULL,
 amount INT NOT NULL, method VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL,
 UNIQUE KEY confirmation (user_id,confirmation_id),
 FOREIGN KEY (order_id) REFERENCES orders(id), FOREIGN KEY (user_id) REFERENCES users(id)
);
