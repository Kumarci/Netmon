const express = require('express');
const router = express.Router();
const pool = require('../db');
const { wajibLogin } = require('../middleware/auth');

router.use(wajibLogin);

router.get('/logs', async (req, res) => {
  try {
    const { server_id, status, start_date, end_date, limit = 100, offset = 0 } = req.query;
    let query = 'SELECT ml.*, s.nama as server_nama, s.ip_address, s.tipe, s.icon FROM monitoring_logs ml JOIN servers s ON ml.server_id = s.id WHERE 1=1';
    const params = [];
    if (server_id) { query += ' AND ml.server_id = ?'; params.push(server_id); }
    if (status) { query += ' AND ml.status = ?'; params.push(status); }
    if (start_date) { query += ' AND ml.checked_at >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND ml.checked_at <= ?'; params.push(end_date + ' 23:59:59'); }
    const [countResult] = await pool.query(query.replace('SELECT ml.*, s.nama as server_nama, s.ip_address, s.tipe, s.icon', 'SELECT COUNT(*) as total'), params);
    const total = countResult[0].total;
    query += ' ORDER BY ml.checked_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const [logs] = await pool.query(query, params);
    res.json({ logs, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data log' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [totalLogs] = await pool.query('SELECT COUNT(*) as total FROM monitoring_logs');
    const [avgLatency] = await pool.query('SELECT COALESCE(AVG(response_time_ms),0) as avg_ms FROM monitoring_logs WHERE response_time_ms IS NOT NULL');
    const [failCount] = await pool.query("SELECT COUNT(*) as total FROM monitoring_logs WHERE status = 'offline' AND checked_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
    const [serverCount] = await pool.query('SELECT COUNT(*) as total FROM servers WHERE aktif = 1');
    const [latencyDist] = await pool.query(`
      SELECT
        SUM(CASE WHEN response_time_ms < 5 THEN 1 ELSE 0 END) as fast,
        SUM(CASE WHEN response_time_ms >= 5 AND response_time_ms < 20 THEN 1 ELSE 0 END) as normal,
        SUM(CASE WHEN response_time_ms >= 20 AND response_time_ms < 100 THEN 1 ELSE 0 END) as degraded,
        SUM(CASE WHEN status = 'offline' OR response_time_ms IS NULL THEN 1 ELSE 0 END) as timeout,
        COUNT(*) as total
      FROM monitoring_logs WHERE checked_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
    const dist = latencyDist[0];
    const distTotal = dist.total || 1;
    res.json({
      totalLogs: totalLogs[0].total,
      avgLatency: Math.round(avgLatency[0].avg_ms * 10) / 10,
      failCount24h: failCount[0].total,
      serverCount: serverCount[0].total,
      latencyDistribution: {
        fast: { count: dist.fast, percent: Math.round(dist.fast / distTotal * 1000) / 10 },
        normal: { count: dist.normal, percent: Math.round(dist.normal / distTotal * 1000) / 10 },
        degraded: { count: dist.degraded, percent: Math.round(dist.degraded / distTotal * 1000) / 10 },
        timeout: { count: dist.timeout, percent: Math.round(dist.timeout / distTotal * 1000) / 10 }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil statistik' });
  }
});

module.exports = router;
