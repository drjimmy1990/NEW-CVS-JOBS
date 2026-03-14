const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Extract the database URL from command line or env
// Usage: node dump_schema.js "postgres://user:pass@host:port/db" [output_file.sql]

const dbUrl = process.argv[2] || process.env.DATABASE_URL;
let outputFile = process.argv[3] || 'supabase_schema_dump.sql';

if (!dbUrl) {
    console.error('Error: Please provide a database connection string.');
    console.log('Usage: node dump_schema.js "postgres://user:password@host:port/db_name" [output_file.sql]');
    process.exit(1);
}

outputFile = path.resolve(process.cwd(), outputFile);

// pg_dump flags:
// -s: Schema only (no data)
// -O: No owner (don't output commands to set ownership of objects)
// -x: No privileges (prevent dumping of access privileges/revoke/grant)
// --schema=public: Just the public schema where tables/RLS are usually defined
const command = `pg_dump "${dbUrl}" -s -O -x --schema=public -f "${outputFile}"`;

console.log(`📡 Connecting to database...`);
console.log(`📦 Exporting schema, functions, triggers, and RLS to: ${outputFile}\n`);

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Export failed: ${error.message}`);
        // If pg_dump isn't found, tell the user
        if (error.message.includes('not found') || error.message.includes('is not recognized')) {
            console.error('\n⚠️ Note: This script requires "pg_dump" to be installed on your machine.');
            console.error('You can install PostgreSQL tools or use the Supabase CLI instead (`supabase db dump`).');
        }
        return;
    }
    
    // Check if the file actually has content
    if (fs.existsSync(outputFile)) {
        const stats = fs.statSync(outputFile);
        if (stats.size > 0) {
            console.log(`✅ Success! Schema exported successfully.`);
            console.log(`📄 File size: ${(stats.size / 1024).toFixed(2)} KB`);
        } else {
            console.log(`⚠️ Warning: Exported file is empty. Please check your connection string or database permissions.`);
        }
    }
});
