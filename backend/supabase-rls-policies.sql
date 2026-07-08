-- Row Level Security (RLS) Policies for DevDoc AI Tables
-- Run this script in your Supabase SQL Editor to enforce secure data isolation.

-- ==========================================
-- 1. Enable Row Level Security (RLS) on all tables
-- ==========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_sources ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. "users" (Profiles) Policies
-- ==========================================

-- Allow insertion of public user records during frontend sign-up
CREATE POLICY "Allow public insert to users profile" ON users
  FOR INSERT 
  WITH CHECK (true);

-- Allow users to view their own profile only
CREATE POLICY "Allow users to read their own profile" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- Allow users to update their own profile details
CREATE POLICY "Allow users to update their own profile" ON users
  FOR UPDATE 
  USING (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Allow users to delete their own profile" ON users
  FOR DELETE 
  USING (auth.uid() = id);

-- ==========================================
-- 3. "projects" Policies
-- ==========================================

-- Allow users to insert projects bound to their authenticated ID
CREATE POLICY "Allow users to insert their own projects" ON projects
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view only their own projects
CREATE POLICY "Allow users to view their own projects" ON projects
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to update only their own projects
CREATE POLICY "Allow users to update their own projects" ON projects
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete only their own projects
CREATE POLICY "Allow users to delete their own projects" ON projects
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ==========================================
-- 4. "endpoints" Policies (Linked via projects)
-- ==========================================

-- Allow endpoint insertion only if the linked project belongs to the authenticated user
CREATE POLICY "Allow owners to insert endpoints" ON endpoints
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Allow endpoint viewing only if the linked project belongs to the authenticated user
CREATE POLICY "Allow owners to view endpoints" ON endpoints
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Allow endpoint updates only if the linked project belongs to the authenticated user
CREATE POLICY "Allow owners to update endpoints" ON endpoints
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Allow endpoint deletion only if the linked project belongs to the authenticated user
CREATE POLICY "Allow owners to delete endpoints" ON endpoints
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- ==========================================
-- 5. "project_sources" Policies (Linked via projects)
-- ==========================================

-- Allow source insertion only if the linked project belongs to the authenticated user
CREATE POLICY "Allow owners to insert project sources" ON project_sources
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Allow source viewing only if the linked project belongs to the authenticated user
CREATE POLICY "Allow owners to view project sources" ON project_sources
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Allow source updates only if the linked project belongs to the authenticated user
CREATE POLICY "Allow owners to update project sources" ON project_sources
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Allow source deletion only if the linked project belongs to the authenticated user
CREATE POLICY "Allow owners to delete project sources" ON project_sources
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
