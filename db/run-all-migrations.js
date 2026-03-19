#!/usr/bin/env node
/**
 * Run all SQL files in db/migrations in order (by filename).
 * Uses DATABASE_URL from .env (repo root) or process.env (e.g. GitHub Actions).
 * From repo root: node db/run-all-migrations.js
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

let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Set it in .env or as an env var.');
  process.exit(1);
}
// Avoid pg driver SSL deprecation warning: prefer verify-full
if (databaseUrl.includes('sslmode=require') && !databaseUrl.includes('verify-full')) {
  databaseUrl = databaseUrl.replace('sslmode=require', 'sslmode=verify-full');
}

const migrationsDir = path.join(__dirname, 'migrations');
if (!fs.existsSync(migrationsDir)) {
  console.log('No migrations directory, skipping.');
  process.exit(0);
}

const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

if (files.length === 0) {
  console.log('No .sql files in db/migrations.');
  process.exit(0);
}

const { Client } = require('pg');
const client = new Client({ connectionString: databaseUrl });

async function run() {
  await client.connect();
  try {
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      await client.query(sql);
      console.log('Ran:', file);
    }
    console.log('All migrations completed.');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}
run();
