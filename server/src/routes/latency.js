const express = require('express');
const router = express.Router();
const pool = require('../db');
const { wajibLogin } = require('../middleware/auth');

router.use(wajibLogin);

const TIMEFRAME_MAP = {
  '1H': '1 HOUR',
  '6H': '6 HOUR',
  '24H': '24 HOUR',
  '7D': '7 DAY',
  '30D': '30 DAY'
};

router.get('/history', async (req, res) => {
  try {
    const { server_id, timeframe = '1H' } = req.query;
    const interval = TIMEFRAME_MAP[timeframe] || '1 HOUR';

    let query = `SELECT lh.*, s.nama as server_nama, s.ip_address, s.icon
      FROM latency_history lh
      JOIN servers s ON lh.server_id = s.id
      WHERE lh.checked_at >= NOW() - INTERVAL ${interval}`;

    const params = [];
    if (server_id) {
      query += ' AND lh.server_id = ?';
      params.push(server_id);
    }
    query += ' ORDER BY lh.checked_at ASC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Latency history error:', err);
    res.status(500).json({ error: 'Gagal mengambil data latency' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { server_id, timeframe = '24H' } = req.query;
    const interval = TIMEFRAME_MAP[timeframe] || '24 HOUR';

    let whereClause = `WHERE lh.checked_at >= NOW() - INTERVAL ${interval}`;
    const params = [];
    if (server_id) {
      whereClause += ' AND lh.server_id = ?';
      params.push(server_id);
    }

    const [stats] = await pool.query(`
      SELECT
        COUNT(*) as total_checks,
        ROUND(AVG(lh.latency_ms), 1) as avg_latency,
        MIN(lh.latency_ms) as min_latency,
        MAX(lh.latency_ms) as max_latency,
        ROUND(AVG(lh.jitter_ms), 1) as avg_jitter,
        ROUND(AVG(lh.packet_loss), 2) as avg_packet_loss,
        SUM(CASE WHEN lh.latency_ms IS NULL THEN 1 ELSE 0 END) as failed_checks
      FROM latency_history lh
      ${whereClause}
    `, params);

    const total = stats[0].total_checks || 0;
    const failed = stats[0].failed_checks || 0;
    const stability = total > 0 ? Math.round(((total - failed) / total) * 1000) / 10 : 100;

    res.json({
      totalChecks: total,
      avgLatency: stats[0].avg_latency || 0,
      minLatency: stats[0].min_latency || 0,
      maxLatency: stats[0].max_latency || 0,
      avgJitter: stats[0].avg_jitter || 0,
      avgPacketLoss: stats[0].avg_packet_loss || 0,
      stability
    });
  } catch (err) {
    console.error('Latency stats error:', err);
    res.status(500).json({ error: 'Gagal mengambil stats latency' });
  }
});

router.get('/current', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT lh.*, s.nama as server_nama, s.ip_address, s.icon, s.tipe
      FROM latency_history lh
      JOIN servers s ON lh.server_id = s.id
      WHERE lh.id IN (
        SELECT MAX(id) FROM latency_history GROUP BY server_id
      )
      ORDER BY s.nama
    `);
    res.json(rows);
  } catch (err) {
    console.error('Latency current error:', err);
    res.status(500).json({ error: 'Gagal mengambil data latency terkini' });
  }
});

router.get('/compare', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.id, s.nama, s.ip_address, s.icon, s.tipe,
        lh.latency_ms, lh.min_ms, lh.max_ms, lh.jitter_ms, lh.packet_loss, lh.checked_at,
        CASE
          WHEN lh.latency_ms IS NULL THEN 'offline'
          WHEN lh.latency_ms < 30 AND (lh.jitter_ms IS NULL OR lh.jitter_ms < 5) THEN 'healthy'
          WHEN lh.latency_ms < 80 OR (lh.jitter_ms IS NOT NULL AND lh.jitter_ms < 15) THEN 'warning'
          ELSE 'critical'
        END as latency_status
      FROM servers s
      LEFT JOIN latency_history lh ON lh.id = (
        SELECT MAX(id) FROM latency_history WHERE server_id = s.id
      )
      WHERE s.aktif = 1
      ORDER BY s.nama
    `);
    res.json(rows);
  } catch (err) {
    console.error('Latency compare error:', err);
    res.status(500).json({ error: 'Gagal mengambil data perbandingan' });
  }
});

module.exports = router;
