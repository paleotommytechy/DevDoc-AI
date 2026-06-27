import pg from "pg";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from the root and backend directories
dotenv.config({ path: path.join(process.cwd(), ".env") });
dotenv.config({ path: path.join(process.cwd(), "backend", ".env") });

const { Client } = pg;

async function runDiagnostic() {
  console.log("\n========================================================");
  console.log("🔍 DevDoc AI - Database Connection Diagnostic Tool");
  console.log("========================================================\n");

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.log("❌ ERROR: DATABASE_URL is not set in your environment.");
    console.log("Please create a '.env' file in either the project root or the '/backend' directory.");
    console.log("Add the following line with your Supabase Connection string:");
    console.log("DATABASE_URL=\"postgresql://postgres:[password]@db.[project-ref].supabase.co:6543/postgres?sslmode=require\"\n");
    console.log("ℹ️ Currently falling back to: In-Memory Database Mode");
    console.log("========================================================\n");
    return;
  }

  // Sanitize password in output
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":******@");
  console.log(`📡 Connecting to: ${maskedUrl}`);

  const isSupabase = dbUrl.includes("supabase");
  const useSsl = isSupabase || dbUrl.includes("elephantsql") || dbUrl.includes("render");

  const client = new Client({
    connectionString: dbUrl,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log("🔌 Attempting database connection...");
    await client.connect();
    console.log("✅ Connection established successfully!\n");

    // Check version
    const versionRes = await client.query("SELECT version();");
    console.log(`📊 PostgreSQL Version: ${versionRes.rows[0].version}\n`);

    console.log("📋 Checking required database tables...");
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'projects');
    `);

    const existingTables = tablesRes.rows.map(row => row.table_name);
    let allTablesExist = true;

    if (existingTables.includes("users")) {
      console.log("  [✓] 'users' table exists.");
    } else {
      console.log("  [✗] 'users' table is MISSING.");
      allTablesExist = false;
    }

    if (existingTables.includes("projects")) {
      console.log("  [✓] 'projects' table exists.");
      
      // Check column schema for project columns
      console.log("🔍 Checking columns on 'projects' table...");
      const columnsRes = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects';
      `);
      const existingColumns = columnsRes.rows.map(row => row.column_name);
      
      const expectedColumns = [
        "framework", "language", "route_count", "controller_count", 
        "middleware_count", "model_count", "database", "authentication", 
        "analysis_status", "analysis_completed_at", "routes_discovered"
      ];

      let missingColumnsCount = 0;
      for (const col of expectedColumns) {
        if (existingColumns.includes(col)) {
          console.log(`    [✓] Column '${col}' is present.`);
        } else {
          console.log(`    [✗] Column '${col}' is MISSING (will be added automatically on server start).`);
          missingColumnsCount++;
        }
      }
      
      if (missingColumnsCount === 0) {
        console.log("  ✨ All dynamic analysis columns are fully synchronized!");
      } else {
        console.log(`  ℹ️  ${missingColumnsCount} optional schema columns will be automatically added by DbService on server startup.`);
      }
    } else {
      console.log("  [✗] 'projects' table is MISSING.");
      allTablesExist = false;
    }

    console.log("\n========================================================");
    if (allTablesExist) {
      console.log("🎉 DIAGNOSTIC PASSED: Your Supabase database is ready!");
      console.log("The application is fully configured and connected.");
    } else {
      console.log("⚠️ DIAGNOSTIC WARNING: Table structure is incomplete.");
      console.log("Please run the schema script to set up your tables:");
      console.log("1. Open your Supabase Dashboard.");
      console.log("2. Navigate to SQL Editor.");
      console.log("3. Click 'New query'.");
      console.log("4. Copy-paste the content of '/backend/supabase-schema.sql'.");
      console.log("5. Click 'Run' to create the necessary tables and trigger functions.");
    }
    console.log("========================================================\n");

  } catch (err: any) {
    console.log("\n❌ DIAGNOSTIC FAILED: Could not connect to the database.");
    console.log("--------------------------------------------------------");
    console.log(`Error Message: ${err.message}`);
    console.log("--------------------------------------------------------\n");
    
    console.log("💡 TROUBLESHOOTING TIPS:");
    if (err.message.includes("self-signed certificate")) {
      console.log("👉 Certificate issue: Supabase requires SSL connection. Ensure your DATABASE_URL ends with '?sslmode=require' or verify SSL is configured correctly.");
    } else if (err.message.includes("password authentication failed")) {
      console.log("👉 Authentication failed: Check your database password. Note that special characters in your password should be URL encoded (e.g., '@' as '%40').");
    } else if (err.message.includes("ENOTFOUND") || err.message.includes("getaddrinfo")) {
      console.log("👉 Network Host issue: The domain in DATABASE_URL could not be resolved. Please verify your Supabase project ref or database server address.");
    } else {
      console.log("👉 General checklist:");
      console.log("  1. Verify DATABASE_URL is written correctly in your '.env' file.");
      console.log("  2. If using Supabase, make sure your project is active (not paused).");
      console.log("  3. Ensure that your firewall permits outbound TCP traffic to ports 5432 or 6543.");
    }
    console.log("\n========================================================\n");
  } finally {
    await client.end();
  }
}

runDiagnostic();
