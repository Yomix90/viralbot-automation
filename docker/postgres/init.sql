-- ViralBot Database Initialization
-- This script runs automatically when the PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- Create indexes for better performance
-- (SQLAlchemy will create the tables via Alembic migrations)

-- Set timezone
SET timezone = 'UTC';
