-- Migration: Add Project Sources Table
-- Path: supabase/migrations/0006_project_sources.sql

CREATE TABLE IF NOT EXISTS project_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- 'ZIP', 'LOCAL_URL', 'PUBLIC_URL'
  source_url TEXT,
  scan_status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
  last_scan_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable indexes for faster query performance on project lookup
CREATE INDEX IF NOT EXISTS idx_project_sources_project_id ON project_sources(project_id);
