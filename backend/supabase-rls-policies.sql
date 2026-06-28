-- SQL Permission & RLS Configuration for DevDoc AI Supabase Integration
-- Open your Supabase Dashboard -> SQL Editor, paste this script, and run it.

-- ====================================================================
-- OPTION A: DISABLE ROW-LEVEL SECURITY (Recommended for Custom Backends)
-- ====================================================================
-- Since DevDoc AI uses a secure Express backend with its own JWT token
-- and bcrypt authentication, the backend already handles all access control.
-- Disabling RLS allows your backend client to perform CRUD operations smoothly.

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- If you ran Option A, you are ALL SET! You can ignore Option B below.


-- ====================================================================
-- OPTION B: ENABLE RLS WITH REQUISITE POLICIES (If you prefer keeping RLS enabled)
-- ====================================================================
-- If your organization requires Row Level Security to be strictly enabled
-- on all tables, uncomment and run the following statements instead.

/*
-- 1. Enable RLS on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid name collisions
DROP POLICY IF EXISTS "Allow public select/insert to users" ON users;
DROP POLICY IF EXISTS "Allow public insert to users" ON users;
DROP POLICY IF EXISTS "Allow public select to users" ON users;
DROP POLICY IF EXISTS "Allow public update to users" ON users;

DROP POLICY IF EXISTS "Allow public select to projects" ON projects;
DROP POLICY IF EXISTS "Allow public insert to projects" ON projects;
DROP POLICY IF EXISTS "Allow public update to projects" ON projects;
DROP POLICY IF EXISTS "Allow public delete to projects" ON projects;

-- 3. Create permissive policies for the Users table
-- Allows the backend API (running under the 'anon' or 'authenticated' role) to manage user records.
CREATE POLICY "Allow public insert to users" ON users 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public select to users" ON users 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow public update to users" ON users 
  FOR UPDATE 
  USING (true);

-- 4. Create permissive policies for the Projects table
-- Allows the backend API to query, create, update, and delete project logs.
CREATE POLICY "Allow public select to projects" ON projects 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert to projects" ON projects 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update to projects" ON projects 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public delete to projects" ON projects 
  FOR DELETE 
  USING (true);
*/
