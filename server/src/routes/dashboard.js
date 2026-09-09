const express = require('express');
const router = express.Router();
const pool = require('../db');
const { wajibLogin } = require('../middleware/auth');
const { checkServer } = require('../utils/checker');

router.use(wajibLogin);

router.get('/dashboard', async (req, res) => {
  try {
    const [servers] = await pool.query('SELECT * FROM servers WHERE aktif = 1 ORDER BY nama');
    let totalOnline = 0, totalOffline = 0, totalMs = 0, checkedCount = 0;
    const statusList = [];
    for (const s of servers) {
      const [lastLog] = await pool.query(
        'SELECT status, response_time_ms, checked_at FROM monitoring_logs WHERE server_id = ? ORDER BY checked_at DESC, id DESC LIMIT 1',
        [s.id]
      );
      const last = lastLog[0];
      const status = last?.status || 'offline';
      if (status === 'online') totalOnline++; else totalOffline++;
      if (last?.response_time_ms) { totalMs += last.response_time_ms; checkedCount++; }
      statusList.push({ server: s, status, ms: last?.response_time_ms || null, checked_at: last?.checked_at || null });
    }
    const [logCount] = await pool.query('SELECT COUNT(*) as total FROM monitoring_logs');
    const avgMs = checkedCount > 0 ? Math.round(totalMs / checkedCount * 10) / 10 : 0;
    res.json({ totalServer: servers.length, totalOnline, totalOffline, avgMs, totalLogs: logCount[0].total, servers: statusList });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat dashboard' });
  }
});

module.exports = router;
