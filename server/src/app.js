require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { getAllMetrics } = require('./utils/metrics');
const { checkServer, checkLatency } = require('./utils/checker');
const { updateServerIps, getArpTable, scanForDevices } = require('./utils/networkScanner');
const pool = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'netmon-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/monitoring', require('./routes/monitoring'));
app.use('/api/riwayat', require('./routes/riwayat'));
app.use('/api/servers', require('./routes/servers'));
app.use('/api/users', require('./routes/users'));
app.use('/api/latency', require('./routes/latency'));
app.use('/api/diagnostic', require('./routes/diagnostic'));
app.use('/api', require('./routes/api'));

// Health check (no auth)
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected', host: process.env.MYSQLHOST || 'unknown', db_name: process.env.MYSQLDATABASE || 'unknown' });
  } catch (err) {
    res.json({ ok: false, error: err.message, host: process.env.MYSQLHOST || 'unknown', db_name: process.env.MYSQLDATABASE || 'unknown' });
  }
});

// Serve React build static files
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Socket.io metrics namespace
const metricsNs = io.of('/metrics');
let metricsInterval = null;
metricsNs.on('connection', (socket) => {
  console.log('Metrics client connected:', socket.id);
  if (!metricsInterval) {
    metricsInterval = setInterval(async () => {
      try {
        const metrics = await getAllMetrics();
        metricsNs.emit('metrics', metrics);
      } catch (err) { console.error(err); }
    }, 2000);
  }
  socket.on('requestMetrics', async () => {
    try { socket.emit('metrics', await getAllMetrics()); } catch (err) { console.error(err); }
  });
  socket.on('disconnect', () => {
    console.log('Metrics client disconnected:', socket.id);
    if (metricsNs.listenerCount('connection') === 0 && metricsInterval) {
      clearInterval(metricsInterval); metricsInterval = null;
    }
  });
});

// Socket.io server status namespace
const statusNs = io.of('/server-status');

// ARP auto-scan setiap 5 menit
let arpInterval = null;
async function runArpScan() {
  try {
    const updates = await updateServerIps();
    if (updates.length > 0) {
      console.log(`ARP auto-scan: ${updates.length} IP updated`);
      statusNs.emit('ipUpdates', updates);
    }
    return updates;
  } catch (err) {
    console.error('ARP scan error:', err);
    return [];
  }
}
arpInterval = setInterval(runArpScan, 5 * 60 * 1000);

// Route manual ARP scan
const { wajibLogin } = require('./middleware/auth');
app.get('/api/arp/scan', wajibLogin, async (req, res) => {
  try {
    const updates = await runArpScan();
    const arpTable = getArpTable();
    res.json({ success: true, updates, arpTable, message: `${updates.length} IP updated` });
  } catch (err) {
    res.status(500).json({ error: 'ARP scan gagal' });
  }
});

app.get('/api/arp/table', wajibLogin, async (req, res) => {
  try {
    const arpTable = getArpTable();
    const scan = await scanForDevices();
    res.json({ arpTable, scan });
  } catch (err) {
    res.status(500).json({ error: 'Gagal baca ARP table' });
  }
});

statusNs.on('connection', (socket) => {
  console.log('Status client connected:', socket.id);
  socket.on('checkServers', async () => {
    try {
      await updateServerIps();
      const [servers] = await pool.query('SELECT * FROM servers WHERE aktif = 1');
      const results = [];
      for (const srv of servers) {
        const result = await checkServer(srv.ip_address, srv.port);
        const status = result.status === 'online' ? 'online' : 'offline';
        await pool.query('INSERT INTO monitoring_logs (server_id, status, response_time_ms, checked_at) VALUES (?, ?, ?, NOW())', [srv.id, status, result.ms]);
        results.push({ id: srv.id, nama: srv.nama, ip: srv.ip_address, mac: srv.mac_address, port: srv.port, tipe: srv.tipe, icon: srv.icon, status, latency: result.ms, checked_at: new Date().toLocaleString('id-ID') });
      }
      statusNs.emit('serverStatus', results);
    } catch (err) { console.error(err); }
  });
});

// Socket.io latency namespace
const latencyNs = io.of('/latency');
let latencyInterval = null;

async function runLatencyCheck() {
  try {
    const [servers] = await pool.query('SELECT * FROM servers WHERE aktif = 1');
    const results = [];
    for (const srv of servers) {
      const result = checkLatency(srv.ip_address, 5);
      await pool.query(
        'INSERT INTO latency_history (server_id, latency_ms, min_ms, max_ms, jitter_ms, packet_loss, checked_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [srv.id, result.avg, result.min, result.max, result.jitter, result.packetLoss]
      );
      results.push({
        id: srv.id,
        nama: srv.nama,
        ip: srv.ip_address,
        tipe: srv.tipe,
        icon: srv.icon,
        latency: result.avg,
        min: result.min,
        max: result.max,
        jitter: result.jitter,
        packetLoss: result.packetLoss,
        status: result.status,
        checked_at: new Date().toLocaleString('id-ID')
      });
    }
    latencyNs.emit('latencyUpdate', results);
  } catch (err) {
    console.error('Latency check error:', err);
  }
}

latencyNs.on('connection', (socket) => {
  console.log('Latency client connected:', socket.id);
  socket.on('requestLatency', () => runLatencyCheck());
  if (!latencyInterval) {
    latencyInterval = setInterval(runLatencyCheck, 30000);
    runLatencyCheck();
  }
  socket.on('disconnect', () => {
    console.log('Latency client disconnected:', socket.id);
    if (latencyNs.listenerCount('connection') === 0 && latencyInterval) {
      clearInterval(latencyInterval);
      latencyInterval = null;
    }
  });
});

// Catch-all for React SPA (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
module.exports = { app, server, io };
