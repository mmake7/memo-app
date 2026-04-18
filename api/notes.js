const { getPool, ensureInit } = require('../lib/db');

module.exports = async (req, res) => {
  try {
    await ensureInit();
    const pool = getPool();

    if (req.method === 'GET') {
      const { rows } = await pool.query(
        'select * from public.notes order by updated_at desc'
      );
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const { title = '', body = '' } = req.body ?? {};
      const { rows } = await pool.query(
        'insert into public.notes (title, body) values ($1, $2) returning *',
        [title, body]
      );
      return res.status(201).json(rows[0]);
    }

    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('/api/notes', e);
    res.status(500).json({ error: e.message });
  }
};
