const express = require('express');
const router = express.Router();
const pool = require('../db');
const { wajibLogin, wajibAdmin } = require('../middleware/auth');

router.use(wajibLogin);

router.get('/', async (req, res) => {
  try {
    const [servers] = await pool.query('SELECT * FROM servers ORDER BY nama');
    res.json(servers);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data server' });
  }
});

router.post('/', wajibAdmin, async (req, res) => {
  const { nama, ip_address, mac_address, port, tipe, icon, lokasi, keterangan } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO servers (nama, ip_address, mac_address, port, tipe, icon, lokasi, keterangan, aktif) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [nama, ip_address, mac_address || null, port || 0, tipe || '', icon || 'dns', lokasi || '', keterangan || '']
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menambahkan server' });
  }
});

router.put('/:id', wajibAdmin, async (req, res) => {
  const { nama, ip_address, mac_address, port, tipe, icon, lokasi, keterangan, aktif } = req.body;
  try {
    await pool.query(
      'UPDATE servers SET nama=?, ip_address=?, mac_address=?, port=?, tipe=?, icon=?, lokasi=?, keterangan=?, aktif=? WHERE id=?',
      [nama, ip_address, mac_address || null, port || 0, tipe || '', icon || 'dns', lokasi || '', keterangan || '', aktif ? 1 : 0, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui server' });
  }
});

router.delete('/:id', wajibAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM servers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus server' });
  }
});

module.exports = router;
