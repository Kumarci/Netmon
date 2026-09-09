import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useMetricsSocket() {
  const [metrics, setMetrics] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io('/metrics', { transports: ['websocket', 'polling'] });
    socket.on('connect', () => { setConnected(true); socket.emit('requestMetrics'); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('metrics', (data) => setMetrics(data));
    return () => socket.disconnect();
  }, []);

  return { metrics, connected };
}

export function useServerStatusSocket() {
  const [servers, setServers] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io('/server-status', { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => { setConnected(true); socket.emit('checkServers'); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('serverStatus', (data) => setServers(data));
    return () => socket.disconnect();
  }, []);

  const refresh = () => socketRef.current?.emit('checkServers');
  return { servers, connected, refresh };
}

export function useLatencySocket() {
  const [latencyData, setLatencyData] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io('/latency', { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => { setConnected(true); socket.emit('requestLatency'); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('latencyUpdate', (data) => setLatencyData(data));
    return () => socket.disconnect();
  }, []);

  const refresh = () => socketRef.current?.emit('requestLatency');
  return { latencyData, connected, refresh };
}
