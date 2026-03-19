#!/usr/bin/env node
/**
 * Run a SQL file against DATABASE_URL. Usage: node db/run-sql.js <path/to/file.sql>
 * Loads .env from project root. Run from repo root: node db/run-sql.js db/migrations/001_init.sql
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const trimmed = line.replace(/^\s+|\s+$/g, '');
    const m = trimmed.match(/^#?\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set in .env. See NEON_SETUP.md');
  process.exit(1);
}

let sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('Usage: node db/run-sql.js <path/to/file.sql>');
  process.exit(1);
}
if (!path.isAbsolute(sqlFile)) sqlFile = path.resolve(process.cwd(), sqlFile);
if (!fs.existsSync(sqlFile)) {
  console.error('File not found:', sqlFile);
  process.exit(1);
}

const sql = fs.readFileSync(sqlFile, 'utf8');
const { Client } = require('pg');
const client = new Client({ connectionString: databaseUrl });

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('SQL executed successfully.');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}
run();
