require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(express.json());
app.use(express.static(__dirname));

async function initSchema() {
  await pool.query(`
    create table if not exists public.notes (
      id uuid primary key default gen_random_uuid(),
      title text not null default '',
      body  text not null default '',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
  await pool.query(`
    create or replace function public.set_updated_at()
    returns trigger language plpgsql as $$
    begin
      new.updated_at = now();
      return new;
    end;
    $$;
  `);
  await pool.query(`drop trigger if exists trg_notes_set_updated_at on public.notes;`);
  await pool.query(`
    create trigger trg_notes_set_updated_at
    before update on public.notes
    for each row execute function public.set_updated_at();
  `);
  await pool.query(
    `create index if not exists idx_notes_updated_at on public.notes (updated_at desc);`
  );
}

app.get('/api/notes', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'select * from public.notes order by updated_at desc'
    );
    res.json(rows);
  } catch (e) {
    console.error('GET /api/notes', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const { title = '', body = '' } = req.body ?? {};
    const { rows } = await pool.query(
      'insert into public.notes (title, body) values ($1, $2) returning *',
      [title, body]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('POST /api/notes', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body } = req.body ?? {};
    const { rows } = await pool.query(
      `update public.notes
         set title = coalesce($2, title),
             body  = coalesce($3, body)
       where id = $1
       returning *`,
      [id, title ?? null, body ?? null]
    );
    if (!rows[0]) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('PUT /api/notes/:id', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('delete from public.notes where id = $1', [id]);
    res.status(204).end();
  } catch (e) {
    console.error('DELETE /api/notes/:id', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

initSchema()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('DB init failed:', err);
    process.exit(1);
  });
