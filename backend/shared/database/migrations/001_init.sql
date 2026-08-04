-- Migration 001: Streamlined Production Schema for URL Shortener Microservices

CREATE TABLE IF NOT EXISTS urls (
  id BIGSERIAL PRIMARY KEY,
  original_url TEXT NOT NULL,
  short_code VARCHAR(50) UNIQUE NOT NULL,
  custom_alias VARCHAR(50),
  password_hash VARCHAR(255) DEFAULT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes & Partial Index as Collision Arbiter
CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_urls_custom_alias ON urls(custom_alias) WHERE custom_alias IS NOT NULL;
