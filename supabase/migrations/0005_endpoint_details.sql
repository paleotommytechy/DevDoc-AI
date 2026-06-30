-- Migration: Endpoint Details & Sample Request Generator
-- Path: supabase/migrations/0005_endpoint_details.sql

-- Create endpoints table
CREATE TABLE IF NOT EXISTS endpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  method VARCHAR(15) NOT NULL,
  route VARCHAR(255) NOT NULL,
  controller VARCHAR(255),
  source_file VARCHAR(255),
  middleware TEXT[], -- Array of middleware names detected
  authentication_required BOOLEAN DEFAULT false NOT NULL,
  validation_library VARCHAR(50),
  request_schema JSONB DEFAULT '{}'::jsonb,
  response_schema JSONB DEFAULT '{}'::jsonb,
  sample_request JSONB DEFAULT '{}'::jsonb,
  sample_response JSONB DEFAULT '{}'::jsonb,
  query_parameters TEXT[] DEFAULT '{}'::text[],
  path_parameters TEXT[] DEFAULT '{}'::text[],
  response_status_codes INTEGER[] DEFAULT '{}'::integer[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable indexes for faster query performance on project and route lookups
CREATE INDEX IF NOT EXISTS idx_endpoints_project_id ON endpoints(project_id);
CREATE INDEX IF NOT EXISTS idx_endpoints_route ON endpoints(route);
CREATE INDEX IF NOT EXISTS idx_endpoints_method ON endpoints(method);
