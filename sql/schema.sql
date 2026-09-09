CREATE DATABASE IF NOT EXISTS server_monitor;
USE server_monitor;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nama VARCHAR(100) NOT NULL,
  role ENUM('admin','teknisi') NOT NULL DEFAULT 'teknisi',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS servers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  ip_address VARCHAR(255) NOT NULL,
  mac_address VARCHAR(50) DEFAULT NULL,
  port INT DEFAULT NULL,
  tipe VARCHAR(50) DEFAULT NULL,
  icon VARCHAR(50) DEFAULT 'dns',
  lokasi VARCHAR(100) DEFAULT NULL,
  keterangan TEXT,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monitoring_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  server_id INT NOT NULL,
  status ENUM('online','offline') NOT NULL,
  response_time_ms INT DEFAULT NULL,
  checked_at DATETIME NOT NULL,
  INDEX idx_server_time (server_id, checked_at),
  CONSTRAINT fk_logs_server FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS latency_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  server_id INT NOT NULL,
  latency_ms INT DEFAULT NULL,
  min_ms INT DEFAULT NULL,
  max_ms INT DEFAULT NULL,
  jitter_ms FLOAT DEFAULT 0,
  packet_loss FLOAT DEFAULT 0,
  checked_at DATETIME NOT NULL,
  INDEX idx_latency_time (server_id, checked_at),
  CONSTRAINT fk_latency_server FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS metrics_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cpu FLOAT DEFAULT 0,
  memory FLOAT DEFAULT 0,
  disk FLOAT DEFAULT 0,
  network_rx BIGINT DEFAULT 0,
  network_tx BIGINT DEFAULT 0,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
