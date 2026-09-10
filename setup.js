const fs = require('fs');
const path = require('path');
const pool = require('./server/src/db');

async function setup() {
  console.log('Running schema...');
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'sql/schema.sql'), 'utf8');
    const statements = schema.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;
      if (trimmed.toUpperCase().startsWith('CREATE DATABASE')) continue;
      if (trimmed.toUpperCase().startsWith('USE ')) continue;
      await pool.query(trimmed);
      console.log('OK:', trimmed.substring(0, 60));
    }
    console.log('Schema created!');
  } catch (err) {
    console.error('Schema error:', err.message);
  }

  console.log('Running seed...');
  try {
    const hash = require('bcryptjs').hashSync('admin123', 10);
    await pool.query('INSERT IGNORE INTO users (username, password, nama, role) VALUES (?, ?, ?, ?)', ['admin', hash, 'Administrator', 'admin']);

    const servers = [
      ['Router Utama', '192.168.3.1', 'f4:1e:57:cb:b4:c1', 0, 'Router/Gateway', 'router', 'Ruang Server', 'Gateway utama jaringan lokal'],
      ['PC Mba Hana', '192.168.3.2', '14:ac:60:d1:ba:3d', 0, 'Desktop Windows', 'desktop_windows', 'Ruang Kerja', 'PC Windows workstation'],
      ['Linux Device A', '192.168.3.7', '3c:78:95:bd:ee:38', 0, 'Linux Server', 'dns', 'Ruang Server', 'Linux device TTL 64'],
      ['Linux Device B', '192.168.3.17', null, 0, 'Linux Server', 'dns', 'Ruang Server', 'Linux device TTL 64'],
      ['Linux Device C', '192.168.3.18', '10:5a:95:5e:dd:20', 0, 'Linux Server', 'dns', 'Ruang Server', 'Linux device TTL 64'],
    ];
    for (const s of servers) {
      await pool.query('INSERT IGNORE INTO servers (nama, ip_address, mac_address, port, tipe, icon, lokasi, keterangan, aktif) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)', s);
    }
    console.log('Seed completed!');
  } catch (err) {
    console.error('Seed error:', err.message);
  }

  process.exit(0);
}

setup();
