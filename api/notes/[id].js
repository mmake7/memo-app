const { getPool, ensureInit } = require('../../lib/db');

module.exports = async (req, res) => {
  try {
    await ensureInit();
    const pool = getPool();
    const { id } = req.query;

    if (req.method === 'PUT') {
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
      return res.json(rows[0]);
    }

    if (req.method === 'DELETE') {
      await pool.query('delete from public.notes where id = $1', [id]);
      return res.status(204).end();
    }

    res.setHeader('Allow', 'PUT, DELETE');
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('/api/notes/[id]', e);
    res.status(500).json({ error: e.message });
  }
};
