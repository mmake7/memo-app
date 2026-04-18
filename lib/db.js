const { Pool } = require('pg');

let pool;
let initPromise;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }
  return pool;
}

async function runSchema() {
  const p = getPool();
  await p.query(`
    create table if not exists public.notes (
      id uuid primary key default gen_random_uuid(),
      title text not null default '',
      body  text not null default '',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
  await p.query(`
    create or replace function public.set_updated_at()
    returns trigger language plpgsql as $$
    begin
      new.updated_at = now();
      return new;
    end;
    $$;
  `);
  await p.query(`drop trigger if exists trg_notes_set_updated_at on public.notes;`);
  await p.query(`
    create trigger trg_notes_set_updated_at
    before update on public.notes
    for each row execute function public.set_updated_at();
  `);
  await p.query(
    `create index if not exists idx_notes_updated_at on public.notes (updated_at desc);`
  );
}

async function ensureInit() {
  if (!initPromise) {
    initPromise = runSchema().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

module.exports = { getPool, ensureInit };
