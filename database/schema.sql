-- KMUTT CafeQ schema (MySQL 8.0). Follows docs/database-contract.md.
-- Run on the kmutt_cafeq database. Safe to re-run: it drops and recreates every table.
-- Money is stored as integer satang (5500 = 55 baht). Times are stored in UTC.

CREATE DATABASE IF NOT EXISTS kmutt_cafeq CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kmutt_cafeq;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS cafe_staff;
DROP TABLE IF EXISTS cafes;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cafes (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100) NOT NULL,
  pickup_point VARCHAR(150) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cafes_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A user who appears here can manage this cafe's menu and queue.
CREATE TABLE cafe_staff (
  user_id INT UNSIGNED NOT NULL,
  cafe_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, cafe_id),
  CONSTRAINT fk_cafe_staff_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_cafe_staff_cafe FOREIGN KEY (cafe_id) REFERENCES cafes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- token_hash holds a SHA-256 hex digest of the session token, never the token itself.
CREATE TABLE sessions (
  token_hash CHAR(64) NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (token_hash),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Items are never deleted. Staff set is_active = 0 to stop selling so order history stays intact.
CREATE TABLE menu_items (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cafe_id     INT UNSIGNED NOT NULL,
  name        VARCHAR(120) NOT NULL,
  category    VARCHAR(20) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  price       INT UNSIGNED NOT NULL,
  image_url   VARCHAR(500) NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_menu_cafe_active_category (cafe_id, is_active, category),
  CONSTRAINT fk_menu_cafe FOREIGN KEY (cafe_id) REFERENCES cafes (id),
  CONSTRAINT chk_menu_category CHECK (category IN ('Coffee', 'Tea & More', 'Snacks')),
  CONSTRAINT chk_menu_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE favorites (
  user_id      INT UNSIGNED NOT NULL,
  menu_item_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, menu_item_id),
  CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_fav_item FOREIGN KEY (menu_item_id) REFERENCES menu_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- pickup_point is copied from the cafe at order time. The backend must set updated_at
-- to UTC_TIMESTAMP() whenever it changes status.
CREATE TABLE orders (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  cafe_id       INT UNSIGNED NOT NULL,
  pickup_point  VARCHAR(150) NOT NULL,
  status        VARCHAR(10) NOT NULL DEFAULT 'Waiting',
  subtotal      INT UNSIGNED NOT NULL,
  packaging_fee INT UNSIGNED NOT NULL DEFAULT 0,
  total         INT UNSIGNED NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
  updated_at    DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (id),
  KEY idx_orders_user_created (user_id, created_at),
  KEY idx_orders_cafe_status_created (cafe_id, status, created_at),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_orders_cafe FOREIGN KEY (cafe_id) REFERENCES cafes (id),
  CONSTRAINT chk_orders_status CHECK (status IN ('Waiting', 'Preparing', 'Ready', 'Done')),
  CONSTRAINT chk_orders_total CHECK (total = subtotal + packaging_fee)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- name and unit_price are snapshots, so later menu edits never change past orders.
CREATE TABLE order_items (
  order_id     INT UNSIGNED NOT NULL,
  menu_item_id INT UNSIGNED NOT NULL,
  name         VARCHAR(120) NOT NULL,
  unit_price   INT UNSIGNED NOT NULL,
  quantity     INT UNSIGNED NOT NULL,
  PRIMARY KEY (order_id, menu_item_id),
  KEY idx_order_items_menu (menu_item_id),
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_item FOREIGN KEY (menu_item_id) REFERENCES menu_items (id),
  CONSTRAINT chk_oi_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One payment per order. The unique pair (user_id, confirmation_id) makes a repeated
-- confirm request return the same order instead of creating a second one.
CREATE TABLE payments (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id            INT UNSIGNED NOT NULL,
  user_id             INT UNSIGNED NOT NULL,
  confirmation_id     VARCHAR(36) NOT NULL,
  request_fingerprint CHAR(64) NOT NULL,
  amount              INT UNSIGNED NOT NULL,
  method              VARCHAR(30) NOT NULL,
  status              VARCHAR(20) NOT NULL,
  confirmed_at        DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_order (order_id),
  UNIQUE KEY uq_payments_user_confirmation (user_id, confirmation_id),
  CONSTRAINT fk_pay_order FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT fk_pay_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
