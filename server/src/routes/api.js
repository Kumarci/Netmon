const express = require('express');
const router = express.Router();
const pool = require('../db');
const { wajibLogin } = require('../middleware/auth');
const { checkServer } = require('../utils/checker');
const { getAllMetrics } = require('../utils/metrics');

router.use(wajibLogin);

router.get('/metrics', async (req, res) => {
  try {
    const metrics = await getAllMetrics();
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil metrics' });
  }
});

router.get('/status/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM servers WHERE id = ?', [req.params.id]);
    const srv = rows[0];
    if (!srv) return res.json({ status: 'offline', ms: null });
    const result = await checkServer(srv.ip_address, srv.port);
    const status = result.status === 'online' ? 'online' : 'offline';
    await pool.query('INSERT INTO monitoring_logs (server_id, status, response_time_ms, checked_at) VALUES (?, ?, ?, NOW())', [srv.id, status, result.ms]);
    res.json({ id: srv.id, nama: srv.nama, ip: srv.ip_address, port: srv.port, status, latency: result.ms, checked_at: new Date().toLocaleString('id-ID') });
  } catch (err) {
    res.status(500).json({ status: 'offline', ms: null });
  }
});

router.get('/status', async (req, res) => {
  try {
    const [servers] = await pool.query('SELECT * FROM servers WHERE aktif = 1');
    const results = [];
    for (const srv of servers) {
      const result = await checkServer(srv.ip_address, srv.port);
      const status = result.status === 'online' ? 'online' : 'offline';
      await pool.query('INSERT INTO monitoring_logs (server_id, status, response_time_ms, checked_at) VALUES (?, ?, ?, NOW())', [srv.id, status, result.ms]);
      results.push({ id: srv.id, nama: srv.nama, ip: srv.ip_address, port: srv.port, tipe: srv.tipe, icon: srv.icon, status, latency: result.ms, checked_at: new Date().toLocaleString('id-ID') });
    }
    res.json(results);
  } catch (err) {
    res.status(500).json([]);
  }
});

module.exports = router;
