const express = require('express');
const router = express.Router();
const { execSync, exec } = require('child_process');
const net = require('net');
const { wajibLogin } = require('../middleware/auth');

router.use(wajibLogin);

const ALLOWED_HOST = /^[a-zA-Z0-9._:-]+$/;
const ALLOWED_COMMANDS = ['ping', 'tracert', 'nslookup', 'connectivity'];

function validateTarget(target) {
  if (!target || typeof target !== 'string') return false;
  return ALLOWED_HOST.test(target);
}

function parsePingOutput(output, target) {
  const lines = output.split('\n');
  const result = {
    command: 'ping',
    target,
    status: 'success',
    lines: [],
    stats: { avg: 0, min: 0, max: 0, packetLoss: 0, packetsSent: 0, packetsReceived: 0 },
    pingData: []
  };

  result.lines.push({ type: 'header', text: `PING ${target} with 32 bytes of data:` });

  for (const line of lines) {
    const replyMatch = line.match(/Reply from ([^:]+): bytes=(\d+) time[=<](\d+)ms TTL=(\d+)/i);
    if (replyMatch) {
      const ms = parseInt(replyMatch[3]);
      result.pingData.push(ms);
      result.lines.push({ type: 'reply', text: `64 bytes from ${replyMatch[1]}: time=${ms}ms TTL=${replyMatch[4]}`, latency: ms });
      continue;
    }

    const timeoutMatch = line.match(/Request timed out/i);
    if (timeoutMatch) {
      result.pingData.push(null);
      result.lines.push({ type: 'timeout', text: 'Request timed out.' });
      continue;
    }

    const statsMatch = line.match(/Packets: Sent = (\d+), Received = (\d+), Lost = (\d+)/i);
    if (statsMatch) {
      result.stats.packetsSent = parseInt(statsMatch[1]);
      result.stats.packetsReceived = parseInt(statsMatch[2]);
      const lost = parseInt(statsMatch[3]);
      result.stats.packetLoss = result.stats.packetsSent > 0 ? Math.round((lost / result.stats.packetsSent) * 1000) / 10 : 0;
    }

    const avgMatch = line.match(/Average = (\d+)ms/i);
    if (avgMatch) {
      result.stats.avg = parseInt(avgMatch[1]);
    }
  }

  const validPings = result.pingData.filter(p => p !== null);
  if (validPings.length > 0) {
    result.stats.min = Math.min(...validPings);
    result.stats.max = Math.max(...validPings);
    if (result.stats.avg === 0) {
      result.stats.avg = Math.round(validPings.reduce((a, b) => a + b, 0) / validPings.length);
    }
  }

  if (result.pingData.length === 0 || result.pingData.every(p => p === null)) {
    result.status = 'error';
    result.lines.push({ type: 'error', text: 'Request timeout. Host unreachable.' });
  } else if (result.stats.packetLoss > 0) {
    result.status = 'warning';
    result.lines.push({ type: 'warning', text: `High latency detected. Packet loss: ${result.stats.packetLoss}%` });
  } else {
    result.lines.push({ type: 'success', text: 'Host reachable.' });
  }

  result.lines.push({ type: 'summary', text: `${result.stats.packetsSent} transmitted, ${result.stats.packetsReceived} received, ${result.stats.packetLoss}% loss` });
  result.lines.push({ type: 'summary', text: `avg: ${result.stats.avg}ms | min: ${result.stats.min}ms | max: ${result.stats.max}ms` });

  return result;
}

function parseTracertOutput(output, target) {
  const lines = output.split('\n');
  const result = {
    command: 'tracert',
    target,
    status: 'success',
    lines: [],
    hops: []
  };

  result.lines.push({ type: 'header', text: `Traceroute to ${target} (max 30 hops):` });

  for (const line of lines) {
    const hopMatch = line.match(/^\s*(\d+)\s+(.+)$/);
    if (hopMatch) {
      const hopNum = parseInt(hopMatch[1]);
      const rest = hopMatch[2].trim();

      const timeMatch = rest.match(/(\d+)\s*ms/g);
      const ipMatch = rest.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);

      if (timeMatch && timeMatch.length > 0) {
        const times = timeMatch.map(t => parseInt(t));
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const ip = ipMatch ? ipMatch[1] : '*';
        result.hops.push({ hop: hopNum, ip, avg, times });
        result.lines.push({ type: 'hop', text: `${hopNum}  ${ip}  ${times.join(' ms  ')} ms` });
      } else {
        result.lines.push({ type: 'timeout', text: `${hopNum}  *  *  *  Request timed out.` });
      }
    }
  }

  if (result.hops.length === 0) {
    result.status = 'error';
    result.lines.push({ type: 'error', text: 'Traceroute failed.' });
  } else {
    result.lines.push({ type: 'success', text: `Trace complete. ${result.hops.length} hops.` });
  }

  return result;
}

function parseNslookupOutput(output, target) {
  const lines = output.split('\n');
  const result = {
    command: 'nslookup',
    target,
    status: 'success',
    lines: [],
    records: []
  };

  result.lines.push({ type: 'header', text: `DNS lookup for ${target}:` });

  for (const line of lines) {
    const nameMatch = line.match(/Name:\s*(.+)/i);
    if (nameMatch) {
      result.lines.push({ type: 'record', text: `Name: ${nameMatch[1].trim()}` });
    }

    const addrMatch = line.match(/Address:\s*(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    if (addrMatch) {
      result.records.push(addrMatch[1]);
      result.lines.push({ type: 'record', text: `Address: ${addrMatch[1]}` });
    }

    const aliasMatch = line.match(/Aliases:\s*(.+)/i);
    if (aliasMatch) {
      result.lines.push({ type: 'record', text: `Alias: ${aliasMatch[1].trim()}` });
    }
  }

  if (result.records.length === 0 && !output.includes('Address')) {
    result.status = 'error';
    result.lines.push({ type: 'error', text: 'DNS resolution failed. No records found.' });
  } else {
    result.lines.push({ type: 'success', text: `Resolved ${result.records.length} address(es).` });
  }

  return result;
}

function runConnectivityCheck(target) {
  return new Promise((resolve) => {
    const result = {
      command: 'connectivity',
      target,
      status: 'success',
      lines: [],
      ports: []
    };

    result.lines.push({ type: 'header', text: `Connectivity test for ${target}:` });

    const ports = [80, 443, 22, 3306];
    let checked = 0;

    for (const port of ports) {
      const socket = new net.Socket();
      socket.setTimeout(2000);

      socket.on('connect', () => {
        result.ports.push({ port, status: 'open', ms: 2 });
        result.lines.push({ type: 'reply', text: `Port ${port}: OPEN` });
        socket.destroy();
        checked++;
        if (checked === ports.length) finish();
      });

      socket.on('timeout', () => {
        result.ports.push({ port, status: 'closed', ms: null });
        result.lines.push({ type: 'timeout', text: `Port ${port}: CLOSED (timeout)` });
        socket.destroy();
        checked++;
        if (checked === ports.length) finish();
      });

      socket.on('error', () => {
        result.ports.push({ port, status: 'closed', ms: null });
        result.lines.push({ type: 'timeout', text: `Port ${port}: CLOSED` });
        socket.destroy();
        checked++;
        if (checked === ports.length) finish();
      });

      socket.connect(port, target);
    }

    function finish() {
      const openPorts = result.ports.filter(p => p.status === 'open');
      if (openPorts.length > 0) {
        result.status = 'success';
        result.lines.push({ type: 'success', text: `${openPorts.length}/${ports.length} ports open. Host reachable.` });
      } else {
        result.status = 'error';
        result.lines.push({ type: 'error', text: 'All ports closed. Host unreachable.' });
      }
      resolve(result);
    }
  });
}

router.post('/run', async (req, res) => {
  try {
    const { command, target } = req.body;

    if (!command || !ALLOWED_COMMANDS.includes(command)) {
      return res.status(400).json({ error: 'Command not allowed. Use: ping, tracert, nslookup, connectivity' });
    }

    if (!validateTarget(target)) {
      return res.status(400).json({ error: 'Invalid target. Must be a valid IP or hostname.' });
    }

    let result;

    switch (command) {
      case 'ping': {
        const output = execSync(`ping -n 3 -w 2000 ${target}`, { timeout: 15000, encoding: 'utf8' });
        result = parsePingOutput(output, target);
        break;
      }
      case 'tracert': {
        const output = execSync(`tracert -d -w 2000 -h 15 ${target}`, { timeout: 30000, encoding: 'utf8' });
        result = parseTracertOutput(output, target);
        break;
      }
      case 'nslookup': {
        const output = execSync(`nslookup ${target}`, { timeout: 10000, encoding: 'utf8' });
        result = parseNslookupOutput(output, target);
        break;
      }
      case 'connectivity': {
        result = await runConnectivityCheck(target);
        break;
      }
      default:
        return res.status(400).json({ error: 'Unknown command' });
    }

    res.json(result);
  } catch (err) {
    console.error('Diagnostic error:', err.message);
    res.json({
      command: req.body.command,
      target: req.body.target,
      status: 'error',
      lines: [{ type: 'error', text: `Execution failed: ${err.message}` }],
      stats: null,
      pingData: []
    });
  }
});

router.get('/servers', async (req, res) => {
  try {
    const pool = require('../db');
    const [servers] = await pool.query('SELECT id, nama, ip_address, tipe, icon FROM servers WHERE aktif = 1 ORDER BY nama');
    res.json(servers);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data server' });
  }
});

module.exports = router;
