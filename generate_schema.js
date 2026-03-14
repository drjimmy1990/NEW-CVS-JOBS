const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const dbUrl = process.argv[2] ?? process.env.DATABASE_URL;
let outputFile = process.argv[3] ?? 'full_schema_export.sql';

if (!dbUrl) {
    console.error('Error: Please provide a Postgres connection string.');
    console.log('Usage: node generate_schema.js "postgres://user:password@host:port/dbname" [output_file.sql]');
    process.exit(1);
}

outputFile = path.resolve(process.cwd(), outputFile);

const client = new Client({
    connectionString: dbUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

async function exportSchema() {
    try {
        console.log('📡 Connecting to database...');
        await client.connect();

        let sqlOutput = `-- ==========================================\n`;
        sqlOutput += `-- Database Schema Export\n`;
        sqlOutput += `-- Generated at: ${new Date().toISOString()}\n`;
        sqlOutput += `-- ==========================================\n\n`;

        // 1. EXTRACT ENUM TYPES
        console.log('📦 Extracting ENUM types...');
        const enums = await client.query(`
            SELECT t.typname AS type_name, e.enumlabel AS enum_value
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public'
            ORDER BY t.typname, e.enumsortorder;
        `);
        
        let currentEnum = null;
        let enumValues = [];
        
        enums.rows.forEach(row => {
            if (currentEnum !== row.type_name) {
                if (currentEnum) {
                    sqlOutput += `CREATE TYPE public.${currentEnum} AS ENUM (${enumValues.map(v => `'${v}'`).join(', ')});\n`;
                }
                currentEnum = row.type_name;
                enumValues = [];
            }
            enumValues.push(row.enum_value);
        });
        
        if (currentEnum) {
            sqlOutput += `CREATE TYPE public.${currentEnum} AS ENUM (${enumValues.map(v => `'${v}'`).join(', ')});\n\n`;
        }

        // 2. EXTRACT TABLES & COLUMNS
        console.log('📦 Extracting Tables...');
        const tables = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        `);

        for (const { table_name } of tables.rows) {
            sqlOutput += `-- Table: ${table_name}\n`;
            sqlOutput += `CREATE TABLE IF NOT EXISTS public.${table_name} (\n`;

            const columns = await client.query(`
                SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = $1
                ORDER BY ordinal_position
            `, [table_name]);

            const colDefs = columns.rows.map(col => {
                let def = `    ${col.column_name} ${col.data_type}`;
                if (col.character_maximum_length) def += `(${col.character_maximum_length})`;
                if (col.is_nullable === 'NO') def += ' NOT NULL';
                if (col.column_default !== null) def += ` DEFAULT ${col.column_default}`;
                return def;
            });

            sqlOutput += colDefs.join(',\n') + '\n';
            sqlOutput += ');\n\n';
        }

        // 3. EXTRACT PRIMARY & FOREIGN KEYS (Simplified)
        console.log('📦 Extracting Constraints (Keys)...');
        const constraints = await client.query(`
            SELECT 
                tc.constraint_name, tc.table_name, tc.constraint_type,
                kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
            LEFT JOIN information_schema.constraint_column_usage ccu
              ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_schema = 'public' 
              AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
        `);

        constraints.rows.forEach(c => {
            if (c.constraint_type === 'PRIMARY KEY') {
                sqlOutput += `ALTER TABLE ONLY public.${c.table_name} ADD CONSTRAINT ${c.constraint_name} PRIMARY KEY (${c.column_name});\n`;
            } else if (c.constraint_type === 'FOREIGN KEY' && c.foreign_table_name) {
                sqlOutput += `ALTER TABLE ONLY public.${c.table_name} ADD CONSTRAINT ${c.constraint_name} FOREIGN KEY (${c.column_name}) REFERENCES public.${c.foreign_table_name}(${c.foreign_column_name});\n`;
            } else if (c.constraint_type === 'UNIQUE') {
                 sqlOutput += `ALTER TABLE ONLY public.${c.table_name} ADD CONSTRAINT ${c.constraint_name} UNIQUE (${c.column_name});\n`;
            }
        });
        sqlOutput += '\n';

        // 4. EXTRACT RLS POLICIES
        console.log('📦 Extracting RLS Policies...');
        const policies = await client.query(`
            SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
            FROM pg_policies
            WHERE schemaname = 'public'
        `);
        
        let currentRLSTable = null;
        policies.rows.forEach(p => {
            if (currentRLSTable !== p.tablename) {
                sqlOutput += `ALTER TABLE public.${p.tablename} ENABLE ROW LEVEL SECURITY;\n`;
                currentRLSTable = p.tablename;
            }
            
            sqlOutput += `CREATE POLICY "${p.policyname}" ON public.${p.tablename} `;
            sqlOutput += `AS ${p.permissive} FOR ${p.cmd} TO ${p.roles[0].replace(/{|}/g, '') || 'public'} `;
            if (p.qual) sqlOutput += `USING (${p.qual}) `;
            if (p.with_check) sqlOutput += `WITH CHECK (${p.with_check})`;
            sqlOutput += ';\n';
        });
        sqlOutput += '\n';
        
        // 5. EXTRACT FUNCTIONS & TRIGGERS
        console.log('📦 Extracting Functions & Triggers...');
        const functions = await client.query(`
            SELECT p.proname, pg_get_functiondef(p.oid) as definition
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
        `);
        
        functions.rows.forEach(fn => {
            if (fn.definition) {
                sqlOutput += fn.definition + ';\n\n';
            }
        });

        // Write file
        fs.writeFileSync(outputFile, sqlOutput, 'utf8');
        console.log(`✅ Done! Mapped schema to: ${outputFile}`);
        console.log('⚠️ Note: Direct table dumps might be missing some complex Supabase Auth/Storage linkage.');

    } catch (e) {
        console.error('❌ Connection or query failed:', e);
    } finally {
        await client.end();
    }
}

exportSchema();
