-- Migration: Add Architecture Diagrams Table
-- Path: supabase/migrations/0007_architecture_diagrams.sql

CREATE TABLE IF NOT EXISTS architecture_diagrams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  diagram_type VARCHAR(50) NOT NULL, -- 'folder_tree', 'route_controller', 'controller_service', 'service_database', 'middleware_flow', 'request_lifecycle', 'dependency_graph'
  mermaid_code TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(project_id, diagram_type)
);

CREATE INDEX IF NOT EXISTS idx_architecture_diagrams_project_id ON architecture_diagrams(project_id);

-- Disable RLS (database is proxied securely via Express backend which enforces ownership)
ALTER TABLE architecture_diagrams DISABLE ROW LEVEL SECURITY;


