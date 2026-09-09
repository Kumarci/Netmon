const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { wajibLogin, wajibAdmin } = require('../middleware/auth');

router.use(wajibLogin);
router.use(wajibAdmin);

router.get('/', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, nama, role, created_at FROM users ORDER BY username');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
});

router.post('/', async (req, res) => {
  const { username, password, nama, role } = req.body;
  try {
    const hash = bcrypt.hashSync(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password, nama, role) VALUES (?, ?, ?, ?)',
      [username, hash, nama, role || 'teknisi']
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menambahkan user' });
  }
});

router.put('/:id', async (req, res) => {
  const { username, password, nama, role } = req.body;
  try {
    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      await pool.query('UPDATE users SET username=?, password=?, nama=?, role=? WHERE id=?', [username, hash, nama, role, req.params.id]);
    } else {
      await pool.query('UPDATE users SET username=?, nama=?, role=? WHERE id=?', [username, nama, role, req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui user' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus user' });
  }
});

module.exports = router;
