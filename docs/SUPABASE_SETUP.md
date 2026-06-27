# 🌌 Supabase Integration & Database Configuration Guide

This guide describes how to connect, configure, and maintain your **Supabase PostgreSQL Database** with the **DevDoc AI** system. It is designed to work seamlessly both on local machines and within the AI Studio workspace.

---

## 🚀 1. Supabase Setup Steps

To connect your Supabase database instance to DevDoc AI, follow these steps:

1. **Create a Supabase Project**:
   - Sign in to [Supabase](https://supabase.com).
   - Create a new project and select your preferred region.
   - Note down the database **Password** you set during project creation.

2. **Retrieve Connection String & Client Keys**:
   - **Database Connection URI**:
     - Navigate to **Project Settings** (gear icon) -> **Database**.
     - Scroll down to the **Connection string** section. Select **URI**.
     - Toggle to **Transaction Pooler** (recommended for serverless or containerized environments like Cloud Run) or **Session Pooler**:
       - **Transaction Pooler**: Port `6543`. Best for high-concurrency client pools.
       - **Session Pooler**: Port `5432`.
     - Copy the URI. It will look like this:
       ```text
       postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:6543/postgres?sslmode=require
       ```
     - **Note**: Replace `[YOUR-PASSWORD]` with the actual password you set during project creation. If your password contains special characters (e.g., `@`, `/`, `#`), ensure they are URL-encoded (e.g., `@` becomes `%40`, `#` becomes `%23`).
   - **Supabase Client API Keys**:
     - Navigate to **Project Settings** (gear icon) -> **API**.
     - Copy your **Project URL** (under "Project API keys" -> URL) - this matches `SUPABASE_URL`.
     - Copy your **`anon` `public`** key (under "Project API keys" -> `anon` / `public`) - this matches `SUPABASE_ANON_KEY`.

---

## 📋 2. Implementing Schema & Tables

DevDoc AI uses two primary tables: `users` and `projects`. The system manages migrations and dynamic schema columns automatically on boot, but the core table boundaries should be created first.

### Step-by-Step Schema Setup:
1. Copy the contents of the database schema file located in the project at `/backend/supabase-schema.sql`.
2. Open your **Supabase Dashboard**.
3. Select **SQL Editor** from the left navigation panel.
4. Click **New query**.
5. Paste the copied SQL contents into the editor.
6. Click **Run** (or press `Cmd + Enter` / `Ctrl + Enter`).

### Schema Description:
- **`users` Table**: Contains account profiles with UUID identifiers, secure encrypted passwords (`bcrypt`), and creation timestamps.
- **`projects` Table**: Contains monitored codebases linked to the corresponding creator.
- **`update_projects_updated_at` Trigger**: Automatically updates the `updated_at` column whenever a project row is updated.
- **Automatic Auto-Schema Alignment**: Upon starting up, the backend's `DbService` automatically checks and appends any missing project analysis columns (such as `framework`, `language`, `route_count`, `routes_discovered`, etc.) so that you never have to worry about manual schema migration drift.

---

## 🔒 3. Environment Variable Configuration

To connect the application to your Supabase instance, create or update your environment files:

### For Workspace/Root Environment (`/.env`)
Create a `.env` file at the root of your project directory and add your variables:
```env
# Supabase PostgreSQL connection string
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:6543/postgres?sslmode=require"

# Supabase Client API Credentials
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"

# Gemini AI Credentials (automatically managed in AI Studio)
GEMINI_API_KEY="your_gemini_api_key_here"
```

### For Backend Environment (`/backend/.env`)
Create a `.env` file inside the `backend/` directory:
```env
PORT=3000
NODE_ENV=development

# Supabase database configuration
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:6543/postgres?sslmode=require"

# Supabase Client API Credentials
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"

# Gemini API configuration
GEMINI_API_KEY="your_gemini_api_key_here"
```

---

## 🔍 4. Connection Verification & Debugging System

We have implemented a **Database Connection Diagnostic Tool** to verify connection settings, identify schema discrepancies, and diagnose connection errors.

### Running Diagnostics:
To check if your database is connected and set up correctly, run the following command in your terminal:

```bash
# From the workspace root
npm run db:test

# Or from the backend folder
cd backend
npm run db:test
```

### Common Diagnostics Errors & Troubleshooting:

#### ❌ Error: `self-signed certificate`
* **Cause**: Supabase requires encrypted SSL/TLS connections for security.
* **Resolution**: Ensure your `DATABASE_URL` is appended with `?sslmode=require`. The `DbService` will automatically configure the database driver to safely bypass self-signed certificate rejections for Supabase connections.

#### ❌ Error: `password authentication failed`
* **Cause**: The database password in `DATABASE_URL` is incorrect or contains unencoded special characters.
* **Resolution**: Double-check your database password. If your password contains characters like `@`, `:`, `/`, or `?`, you must URL-encode them.

#### ❌ Error: `ENOTFOUND` or Host Unreachable
* **Cause**: Your local machine cannot resolve the database domain (possibly due to network proxies, firewalls, or a paused Supabase project).
* **Resolution**:
  1. Open your Supabase Dashboard and check if the project is paused or active.
  2. Test if you can ping the hostname.
  3. Ensure that outbound TCP traffic on ports `5432` and `6543` is permitted by your local firewall or network administrator.

---

## 🧹 5. Resetting Database during Development (Clean Slate)

If you are developing locally and want to reset the database back to a clean slate, you can run the following commands in the **Supabase SQL Editor**:

```sql
-- WARNING: This will permanently delete all users and projects data!
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

-- Re-run the migration to restore the pristine structure
-- (Execute the contents of /backend/supabase-schema.sql)
```

### 💡 Fallback Database Mode
If you do not have an active Supabase project configured or prefer to run completely offline without setting up database variables, **DevDoc AI automatically falls back to an high-performance in-memory state engine**.
* The server will boot normally.
* It will output a warning: `⚠️ No DATABASE_URL found in environment. Running with in-memory database fallback.`
* Users and projects created during your runtime session will be fully interactive but will reset when the server process is restarted.
