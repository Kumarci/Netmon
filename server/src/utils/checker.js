const net = require('net');
const { execSync } = require('child_process');
const os = require('os');

const isWindows = os.platform() === 'win32';

function pingCmd(host) {
  return isWindows ? `ping -n 1 -w 2000 ${host}` : `ping -c 1 -W 2 ${host}`;
}

function checkTcp(host, port, timeout = 2000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      const latency = Date.now() - start;
      socket.destroy();
      resolve({ status: 'online', ms: latency });
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ status: 'offline', ms: null });
    });
    socket.on('error', () => {
      socket.destroy();
      resolve({ status: 'offline', ms: null });
    });
    socket.connect(port, host);
  });
}

function checkPing(host) {
  try {
    const start = Date.now();
    execSync(pingCmd(host), { timeout: 3000 });
    const latency = Date.now() - start;
    return { status: 'online', ms: latency };
  } catch {
    return { status: 'offline', ms: null };
  }
}

function singlePing(host) {
  try {
    const output = execSync(pingCmd(host), { timeout: 3000 }).toString();
    const match = output.match(/time[=<](\d+)ms/i);
    if (match) return { success: true, ms: parseInt(match[1]) };
    return { success: true, ms: null };
  } catch {
    return { success: false, ms: null };
  }
}

function checkLatency(host, count = 5) {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(singlePing(host));
  }

  const successes = results.filter(r => r.success && r.ms !== null);
  const failures = results.filter(r => !r.success);
  const packetLoss = (failures.length / count) * 100;

  if (successes.length === 0) {
    return {
      status: 'offline',
      latency: null,
      avg: null,
      min: null,
      max: null,
      jitter: null,
      packetLoss: 100,
      current: null
    };
  }

  const latencies = successes.map(r => r.ms);
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const min = Math.min(...latencies);
  const max = Math.max(...latencies);
  const current = latencies[latencies.length - 1];

  let jitter = 0;
  if (latencies.length > 1) {
    const diffs = [];
    for (let i = 1; i < latencies.length; i++) {
      diffs.push(Math.abs(latencies[i] - latencies[i - 1]));
    }
    jitter = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  }

  return {
    status: 'online',
    latency: current,
    avg: Math.round(avg),
    min,
    max,
    jitter: Math.round(jitter * 10) / 10,
    packetLoss: Math.round(packetLoss * 10) / 10,
    current
  };
}

async function checkServer(host, port) {
  const portInt = parseInt(port) || 0;
  if (portInt > 0) {
    const result = await checkTcp(host, portInt);
    if (result.status === 'online') return result;
  }
  return checkPing(host);
}

module.exports = { checkServer, checkTcp, checkPing, checkLatency, singlePing };
