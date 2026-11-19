-- Presentation-aligned tables. Existing tables are retained for migration history.
CREATE TABLE IF NOT EXISTS Customer (
 customer_id INT PRIMARY KEY, name VARCHAR(80) NOT NULL, email VARCHAR(254) NOT NULL UNIQUE,
 password_hash VARCHAR(200) NOT NULL, phone VARCHAR(30) NULL,
 FOREIGN KEY (customer_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS Staff (
 staff_id INT PRIMARY KEY, name VARCHAR(80) NOT NULL, email VARCHAR(254) NOT NULL UNIQUE,
 password_hash VARCHAR(200) NOT NULL, role VARCHAR(30) NOT NULL DEFAULT 'staff',
 FOREIGN KEY (staff_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS Menu (
 menu_id INT PRIMARY KEY, cafe_id INT NOT NULL, name VARCHAR(80) NOT NULL, category VARCHAR(30) NOT NULL,
 price INT NOT NULL CHECK (price >= 0), available BOOLEAN NOT NULL DEFAULT TRUE,
 description VARCHAR(160) NOT NULL, image_url VARCHAR(255),
 FOREIGN KEY (cafe_id) REFERENCES cafes(id)
);
CREATE TABLE IF NOT EXISTS `Order` (
 order_id INT PRIMARY KEY, customer_id INT NOT NULL, cafe_id INT NOT NULL,
 order_date VARCHAR(30) NOT NULL, total_price INT NOT NULL, status ENUM('Waiting','Preparing','Ready','Done') NOT NULL,
 pickup_point VARCHAR(160) NOT NULL, subtotal INT NOT NULL, packaging_fee INT NOT NULL, customer_name VARCHAR(80) NOT NULL,
 FOREIGN KEY (customer_id) REFERENCES Customer(customer_id), FOREIGN KEY (cafe_id) REFERENCES cafes(id),
 INDEX order_history (customer_id,order_date)
);
CREATE TABLE IF NOT EXISTS OrderDetail (
 detail_id BIGINT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, menu_id INT NOT NULL,
 quantity INT NOT NULL CHECK (quantity > 0), price INT NOT NULL, name VARCHAR(80) NOT NULL,
 UNIQUE KEY order_menu (order_id,menu_id),
 FOREIGN KEY (order_id) REFERENCES `Order`(order_id), FOREIGN KEY (menu_id) REFERENCES Menu(menu_id)
);
CREATE TABLE IF NOT EXISTS Queue (
 queue_id INT PRIMARY KEY, order_id INT NOT NULL UNIQUE, cafe_id INT NOT NULL,
 queue_number INT NOT NULL, queue_date DATE NOT NULL, status ENUM('Waiting','Preparing','Ready','Done') NOT NULL,
 UNIQUE KEY daily_queue (cafe_id,queue_date,queue_number),
 FOREIGN KEY (order_id) REFERENCES `Order`(order_id), FOREIGN KEY (cafe_id) REFERENCES cafes(id)
);
INSERT IGNORE INTO Customer (customer_id,name,email,password_hash)
 SELECT id,name,email,password_hash FROM users;
INSERT IGNORE INTO Staff (staff_id,name,email,password_hash)
 SELECT DISTINCT u.id,u.name,u.email,u.password_hash FROM users u JOIN cafe_staff s ON s.user_id=u.id;
INSERT IGNORE INTO Menu (menu_id,cafe_id,name,category,price,available,description,image_url)
 SELECT id,cafe_id,name,category,price,is_active,description,image_url FROM menu_items;
INSERT IGNORE INTO `Order` (order_id,customer_id,cafe_id,order_date,total_price,status,pickup_point,subtotal,packaging_fee,customer_name)
 SELECT id,user_id,cafe_id,created_at,total,status,pickup_point,subtotal,packaging_fee,customer_name FROM orders;
INSERT IGNORE INTO OrderDetail (order_id,menu_id,quantity,price,name)
 SELECT order_id,menu_item_id,quantity,unit_price,name FROM order_items;
INSERT IGNORE INTO Queue (queue_id,order_id,cafe_id,queue_number,queue_date,status)
 SELECT order_id,order_id,cafe_id,ROW_NUMBER() OVER (PARTITION BY cafe_id,LEFT(order_date,10) ORDER BY order_date,order_id),LEFT(order_date,10),status FROM `Order`;
