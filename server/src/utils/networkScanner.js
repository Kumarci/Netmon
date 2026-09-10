const { execSync } = require('child_process');
const pool = require('../db');

function getLocalNetworkInfo() {
  try {
    const output = execSync('ipconfig /all', { timeout: 5000, encoding: 'utf8' });
    const sections = output.split(/\r?\n(?=\S)/);
    for (const section of sections) {
      if (section.includes('VirtualBox') || section.includes('Loopback') || section.includes('Teredo') || section.includes('isatap')) continue;
      const ipv4Match = section.match(/IPv4 Address[.\s]+:\s+([\d.]+)/);
      const macMatch = section.match(/Physical Address[.\s]+:\s+([\da-f]{2}-[\da-f]{2}-[\da-f]{2}-[\da-f]{2}-[\da-f]{2}-[\da-f]{2})/i);
      if (ipv4Match && macMatch) {
        const ip = ipv4Match[1];
        if (ip.startsWith('169.254.')) continue;
        return { ip, mac: macMatch[1].toLowerCase() };
      }
    }
    return null;
  } catch (err) {
    return null;
  }
}

function getArpTable() {
  try {
    const output = execSync('arp -a', { timeout: 5000, encoding: 'utf8' });
    const entries = [];
    const lines = output.split('\n');
    for (const line of lines) {
      const match = line.match(/(\d+\.\d+\.\d+\.\d+)\s+([0-9a-f]{2}-[0-9a-f]{2}-[0-9a-f]{2}-[0-9a-f]{2}-[0-9a-f]{2}-[0-9a-f]{2})\s+(dynamic|static)/i);
      if (match) {
        entries.push({
          ip: match[1],
          mac: match[2].toLowerCase(),
          type: match[3].toLowerCase()
        });
      }
    }
    return entries;
  } catch (err) {
    return [];
  }
}

function normalizeMac(mac) {
  return mac.replace(/-/g, ':').toLowerCase();
}

async function updateServerIps() {
  try {
    const updates = [];

    const localInfo = getLocalNetworkInfo();
    if (localInfo) {
      const normalizedLocalMac = normalizeMac(localInfo.mac);
      const [localSrv] = await pool.query('SELECT id, nama, ip_address FROM servers WHERE aktif = 1 AND mac_address = ?', [normalizedLocalMac]);
      if (localSrv.length > 0 && localSrv[0].ip_address !== localInfo.ip) {
        await pool.query('UPDATE servers SET ip_address = ? WHERE id = ?', [localInfo.ip, localSrv[0].id]);
        updates.push({ id: localSrv[0].id, nama: localSrv[0].nama, oldIp: localSrv[0].ip_address, newIp: localInfo.ip, mac: normalizedLocalMac });
        console.log(`Local IP update: ${localSrv[0].nama} ${localSrv[0].ip_address} → ${localInfo.ip}`);
      }
    }

    const arpEntries = getArpTable();
    if (arpEntries.length === 0) {
      return updates;
    }

    const [servers] = await pool.query('SELECT id, nama, ip_address, mac_address FROM servers WHERE aktif = 1 AND mac_address IS NOT NULL');
    for (const srv of servers) {
      const normalizedSrvMac = normalizeMac(srv.mac_address);
      const match = arpEntries.find(e => normalizeMac(e.mac) === normalizedSrvMac);
      if (match && match.ip !== srv.ip_address) {
        await pool.query('UPDATE servers SET ip_address = ? WHERE id = ?', [match.ip, srv.id]);
        updates.push({ id: srv.id, nama: srv.nama, oldIp: srv.ip_address, newIp: match.ip, mac: srv.mac_address });
        console.log(`ARP update: ${srv.nama} ${srv.ip_address} → ${match.ip} (MAC: ${srv.mac_address})`);
      }
    }

    return updates;
  } catch (err) {
    console.error('ARP update error:', err.message);
    return [];
  }
}

async function scanForDevices() {
  try {
    const arpEntries = getArpTable();
    const [servers] = await pool.query('SELECT id, ip_address, mac_address FROM servers WHERE aktif = 1');
    const knownMacs = new Set(servers.filter(s => s.mac_address).map(s => normalizeMac(s.mac_address)));

    const newDevices = [];
    for (const entry of arpEntries) {
      if (!knownMacs.has(normalizeMac(entry.mac))) {
        newDevices.push(entry);
      }
    }

    return { total: arpEntries.length, newDevices };
  } catch (err) {
    console.error('Scan error:', err.message);
    return { total: 0, newDevices: [] };
  }
}

module.exports = { getArpTable, getLocalNetworkInfo, updateServerIps, scanForDevices, normalizeMac };
