import { useState } from 'react';
import axios from 'axios';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      if (res.data.success) onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-lg">
      <div className="w-full max-w-md">
        <div className="text-center mb-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary mb-md shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-3xl font-fill-1 text-on-primary">radar</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">NetMon</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">NOC Telemetry System</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-xl shadow-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-xl">Masuk ke Akun</h2>
          {error && <div className="mb-md p-md bg-error-container/40 border border-error/20 rounded-lg text-error font-body-md text-body-md">{error}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full h-8 px-md bg-surface-container-low/70 font-body-md text-body-md text-on-surface rounded-lg focus:outline-none focus:bg-surface-container-lowest transition-colors"
                placeholder="Masukkan username" required />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-8 px-md bg-surface-container-low/70 font-body-md text-body-md text-on-surface rounded-lg focus:outline-none focus:bg-surface-container-lowest transition-colors"
                  placeholder="Masukkan password" required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer">
                  <span className="material-symbols-outlined text-lg">{showPw ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-8 bg-primary hover:bg-primary-container text-on-primary rounded font-label-md text-label-md flex items-center justify-center gap-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50">
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
