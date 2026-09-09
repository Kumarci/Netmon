const express = require('express');
const router = express.Router();
const pool = require('../db');
const { wajibLogin } = require('../middleware/auth');

router.use(wajibLogin);

router.get('/servers', async (req, res) => {
  try {
    const [servers] = await pool.query('SELECT id, nama, ip_address, port, tipe, icon FROM servers WHERE aktif = 1 ORDER BY nama');
    res.json(servers);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data server' });
  }
});

module.exports = router;
