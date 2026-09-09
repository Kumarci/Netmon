import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const QUICK_COMMANDS = [
  { cmd: 'ping', label: 'Ping', icon: 'network_check', desc: 'Test server response time and packet loss' },
  { cmd: 'tracert', label: 'Traceroute', icon: 'route', desc: 'Show network path to target' },
  { cmd: 'nslookup', label: 'NSLookup', icon: 'dns', desc: 'Check DNS resolution' },
  { cmd: 'connectivity', label: 'Connectivity', icon: 'cast_connected', desc: 'Check target reachability' },
];

export default function DiagnosticTerminal({ onResult }) {
  const [output, setOutput] = useState([]);
  const [input, setInput] = useState('');
  const [target, setTarget] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState('');
  const outputRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    axios.get('/api/diagnostic/servers').then(r => setServers(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const addOutput = (type, text) => {
    setOutput(prev => [...prev, { type, text, id: Date.now() + Math.random() }]);
  };

  const clearOutput = () => {
    setOutput([]);
    addOutput('system', 'Terminal cleared.');
  };

  const executeCommand = async (cmd, targetHost) => {
    if (!targetHost) {
      addOutput('error', 'No target specified. Enter an IP or hostname.');
      return;
    }

    setIsRunning(true);
    addOutput('command', `admin@monitoring:~$ ${cmd} ${targetHost}`);
    addOutput('system', `Executing ${cmd}...`);

    try {
      const res = await axios.post('/api/diagnostic/run', { command: cmd, target: targetHost });
      const result = res.data;

      for (const line of result.lines) {
        addOutput(line.type, line.text);
      }

      if (onResult) onResult(result);
    } catch (err) {
      addOutput('error', `Command failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parts = input.trim().split(/\s+/);
    if (parts.length === 0) return;

    const cmd = parts[0].toLowerCase();
    const host = parts.slice(1).join(' ');

    if (!ALLOWED_CMD.includes(cmd)) {
      addOutput('error', `Unknown command: ${cmd}. Available: ping, tracert, nslookup, connectivity`);
      setInput('');
      return;
    }

    const targetHost = host || target;
    if (!targetHost) {
      addOutput('error', 'No target specified. Usage: ping <ip/hostname>');
      setInput('');
      return;
    }

    setCommandHistory(prev => [...prev, input]);
    setHistoryIndex(-1);
    setInput('');
    executeCommand(cmd, targetHost);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIdx = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIdx);
        setInput(commandHistory[commandHistory.length - 1 - newIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIdx = historyIndex - 1;
        setHistoryIndex(newIdx);
        setInput(commandHistory[commandHistory.length - 1 - newIdx] || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const handleServerSelect = (e) => {
    const serverId = e.target.value;
    setSelectedServer(serverId);
    if (serverId) {
      const server = servers.find(s => s.id == serverId);
      if (server) setTarget(server.ip_address);
    }
  };

  return (
    <div className="flex flex-col rounded-xl overflow-hidden shadow-sm border border-outline-variant/20">
      {/* Terminal Header */}
      <div className="px-xl py-md bg-surface-container-low flex items-center justify-between">
        <div className="flex items-center gap-md">
          <span className="material-symbols-outlined text-lg text-primary">terminal</span>
          <span className="font-headline-sm text-headline-sm text-on-surface">Network Diagnostic Terminal</span>
          <div className="flex items-center gap-xs">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-tertiary">Connected</span>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <span className="font-code-metric-sm text-code-metric-sm text-on-surface-variant">Administrator privileges required</span>
          <button onClick={clearOutput} className="p-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-lg">delete_sweep</span>
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div ref={outputRef} className="bg-[#0a0e14] p-xl min-h-[200px] max-h-[400px] overflow-y-auto font-code-metric text-code-metric">
        {output.length === 0 && (
          <div className="text-on-surface-variant/60">Ready for network diagnostics.</div>
        )}
        {output.map((line) => (
          <div key={line.id} className={`py-0.5 leading-relaxed ${
            line.type === 'command' ? 'text-primary font-semibold' :
            line.type === 'header' ? 'text-on-surface font-semibold mt-sm' :
            line.type === 'reply' ? 'text-tertiary' :
            line.type === 'success' ? 'text-tertiary' :
            line.type === 'warning' ? 'text-secondary' :
            line.type === 'error' ? 'text-error' :
            line.type === 'timeout' ? 'text-error/70' :
            line.type === 'summary' ? 'text-on-surface-variant' :
            line.type === 'system' ? 'text-on-surface-variant/50 italic' :
            line.type === 'record' ? 'text-primary' :
            line.type === 'hop' ? 'text-on-surface' :
            'text-on-surface-variant'
          }`}>
            {line.type === 'command' && <span className="text-secondary mr-xs">$</span>}
            {line.text}
          </div>
        ))}
        {isRunning && (
          <div className="flex items-center gap-xs text-primary py-0.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span>Processing...</span>
          </div>
        )}
      </div>

      {/* Quick Commands + Input */}
      <div className="bg-surface-container-lowest p-xl flex flex-col gap-md">
        <div className="flex items-center gap-sm flex-wrap">
          {QUICK_COMMANDS.map(qc => (
            <button key={qc.cmd} onClick={() => {
              if (target) executeCommand(qc.cmd, target);
              else addOutput('error', 'Enter a target IP or hostname first.');
            }}
            disabled={isRunning}
            className="flex items-center gap-xs h-7 px-md bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded font-label-sm text-label-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              <span className="material-symbols-outlined text-sm">{qc.icon}</span>
              {qc.label}
            </button>
          ))}
          <div className="flex items-center gap-xs ml-auto">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">dns</span>
            <select value={selectedServer} onChange={handleServerSelect}
              className="h-7 px-md bg-surface-container-low/70 font-body-md text-body-md text-on-surface rounded-lg focus:outline-none appearance-none cursor-pointer text-sm max-w-[160px]">
              <option value="">Select server...</option>
              {servers.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </select>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-md">
          <div className="flex items-center gap-xs flex-shrink-0">
            <span className="material-symbols-outlined text-sm text-primary">shield</span>
            <span className="font-code-metric text-code-metric text-primary font-semibold">admin@monitoring:~$</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={target ? `ping ${target}` : 'Enter command or select a server...'}
            disabled={isRunning}
            className="flex-1 bg-transparent text-on-surface font-code-metric text-code-metric outline-none placeholder:text-on-surface-variant/40 disabled:opacity-50"
            autoFocus
          />
          <button type="submit" disabled={isRunning || !input.trim()}
            className="h-7 px-md bg-primary hover:bg-primary-container text-on-primary rounded font-label-md text-label-md transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-xs">
            <span className="material-symbols-outlined text-sm">play_arrow</span>
            Run
          </button>
        </form>
      </div>
    </div>
  );
}

const ALLOWED_CMD = ['ping', 'tracert', 'nslookup', 'connectivity'];
