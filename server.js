const express = require('express');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

pool.query(`
  CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY,
    data JSONB NOT NULL
  )
`).catch(console.error);

app.get('/api/state', async (req, res) => {
  try {
    const r = await pool.query('SELECT data FROM app_state WHERE id = 1');
    res.json(r.rows[0]?.data || { sessions: [], currentSessionId: null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/state', async (req, res) => {
  try {
    await pool.query(`
      INSERT INTO app_state (id, data) VALUES (1, $1)
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
    `, [JSON.stringify(req.body)]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
