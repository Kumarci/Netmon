const si = require('systeminformation');

async function getCpuMetrics() {
  const load = await si.currentLoad();
  const cpuInfo = await si.cpu();
  return {
    usage: Math.round(load.currentLoad * 10) / 10,
    cores: cpuInfo.cores,
    model: cpuInfo.brand,
    speed: cpuInfo.speed
  };
}

async function getMemoryMetrics() {
  const mem = await si.mem();
  return {
    total: Math.round(mem.total / (1024 * 1024)),
    used: Math.round(mem.used / (1024 * 1024)),
    free: Math.round(mem.free / (1024 * 1024)),
    percentage: Math.round((mem.used / mem.total) * 1000) / 10
  };
}

async function getDiskMetrics() {
  const fsSize = await si.fsSize();
  const disks = fsSize.filter(d => d.size > 0);
  if (disks.length === 0) return { total: 0, used: 0, free: 0, percentage: 0 };
  const total = disks.reduce((sum, d) => sum + d.size, 0);
  const used = disks.reduce((sum, d) => sum + d.used, 0);
  return {
    total: Math.round(total / (1024 * 1024 * 1024) * 10) / 10,
    used: Math.round(used / (1024 * 1024 * 1024) * 10) / 10,
    free: Math.round((total - used) / (1024 * 1024 * 1024) * 10) / 10,
    percentage: Math.round((used / total) * 1000) / 10
  };
}

async function getNetworkMetrics() {
  const stats = await si.networkStats();
  const primary = stats.find(s => s.iface !== 'lo' && !s.iface.startsWith('Loopback')) || stats[0];
  if (!primary) return { rx: 0, tx: 0, rxSec: 0, txSec: 0, iface: '' };
  return {
    rx: primary.rx_bytes,
    tx: primary.tx_bytes,
    rxSec: primary.rx_sec || 0,
    txSec: primary.tx_sec || 0,
    iface: primary.iface
  };
}

async function getAllMetrics() {
  const [cpu, memory, disk, network] = await Promise.all([
    getCpuMetrics(), getMemoryMetrics(), getDiskMetrics(), getNetworkMetrics()
  ]);
  return { cpu, memory, disk, network, timestamp: new Date().toISOString() };
}

module.exports = { getCpuMetrics, getMemoryMetrics, getDiskMetrics, getNetworkMetrics, getAllMetrics };
