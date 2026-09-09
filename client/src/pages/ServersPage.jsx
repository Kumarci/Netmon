import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ServersPage() {
  const [servers, setServers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nama: '', ip_address: '', mac_address: '', port: '', tipe: '', icon: 'dns', lokasi: '', keterangan: '', aktif: true });
  const [error, setError] = useState('');

  useEffect(() => { fetchServers(); }, []);

  const fetchServers = async () => { try { const r = await axios.get('/api/servers'); setServers(r.data); } catch {} };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editing) await axios.put(`/api/servers/${editing.id}`, form);
      else await axios.post('/api/servers', form);
      setShowModal(false); setEditing(null); resetForm(); fetchServers();
    } catch (err) { setError(err.response?.data?.error || 'Gagal'); }
  };

  const handleEdit = (s) => { setEditing(s); setForm({ nama: s.nama, ip_address: s.ip_address, mac_address: s.mac_address || '', port: s.port || '', tipe: s.tipe || '', icon: s.icon || 'dns', lokasi: s.lokasi || '', keterangan: s.keterangan || '', aktif: s.aktif === 1 }); setShowModal(true); };
  const handleDelete = async (id) => { if (!confirm('Hapus server ini?')) return; await axios.delete(`/api/servers/${id}`); fetchServers(); };
  const resetForm = () => { setForm({ nama: '', ip_address: '', mac_address: '', port: '', tipe: '', icon: 'dns', lokasi: '', keterangan: '', aktif: true }); };

  const inputClass = "w-full h-8 px-md bg-surface-container-low/70 font-body-md text-body-md text-on-surface rounded-lg focus:outline-none focus:bg-surface-container-lowest transition-colors";

  return (
    <div className="flex flex-col gap-2xl">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-xs">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Manage Server</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Kelola server yang dipantau</p>
        </div>
        <button onClick={() => { setEditing(null); resetForm(); setShowModal(true); }}
          className="flex items-center gap-xs h-8 px-md bg-primary hover:bg-primary-container text-on-primary rounded font-label-md text-label-md transition-colors shadow-sm cursor-pointer">
          <span className="material-symbols-outlined text-lg">add</span>
          Tambah Server
        </button>
      </div>

      <div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/70 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider select-none">
                <th className="py-md px-xl font-semibold">Server</th>
                <th className="py-md px-lg font-semibold">IP Address</th>
                <th className="py-md px-lg font-semibold">MAC Address</th>
                <th className="py-md px-lg font-semibold text-center">Port</th>
                <th className="py-md px-lg font-semibold">Type</th>
                <th className="py-md px-lg font-semibold">Lokasi</th>
                <th className="py-md px-lg font-semibold text-center">Status</th>
                <th className="py-md px-xl font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {servers.map(s => (
                <tr key={s.id} className="hover:bg-surface-container-low/60 transition-colors group cursor-default">
                  <td className="py-md px-xl">
                    <div className="flex items-center gap-md">
                      <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-lg">{s.icon || 'dns'}</span>
                      </div>
                      <span className="font-headline-sm text-headline-sm text-on-surface">{s.nama}</span>
                    </div>
                  </td>
                  <td className="py-md px-lg font-code-metric text-code-metric text-on-surface">{s.ip_address}</td>
                  <td className="py-md px-lg font-code-metric text-code-metric-sm text-on-surface-variant">{s.mac_address || '-'}</td>
                  <td className="py-md px-lg text-center font-code-metric text-code-metric text-on-surface-variant">{s.port || '-'}</td>
                  <td className="py-md px-lg font-body-md text-body-md text-on-surface-variant">{s.tipe || '-'}</td>
                  <td className="py-md px-lg font-body-md text-body-md text-on-surface-variant">{s.lokasi || '-'}</td>
                  <td className="py-md px-lg text-center">
                    <span className={`px-sm py-2xs rounded font-label-sm text-label-sm font-semibold ${s.aktif ? 'bg-tertiary-container/20 text-tertiary' : 'bg-error-container/40 text-error'}`}>
                      {s.aktif ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </td>
                  <td className="py-md px-xl text-right">
                    <div className="flex items-center justify-end gap-xs">
                      <button onClick={() => handleEdit(s)} className="p-xs text-on-surface-variant hover:text-primary hover:bg-primary-container/20 rounded-lg transition-colors cursor-pointer"><span className="material-symbols-outlined text-lg">edit</span></button>
                      <button onClick={() => handleDelete(s.id)} className="p-xs text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-lg transition-colors cursor-pointer"><span className="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-container-lowest rounded-xl w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between p-xl border-b border-outline-variant/30">
              <h2 className="font-headline-md text-headline-md text-on-surface">{editing ? 'Edit Server' : 'Tambah Server'}</h2>
              <button onClick={() => setShowModal(false)} className="p-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg cursor-pointer"><span className="material-symbols-outlined text-lg">close</span></button>
            </div>
            <form onSubmit={handleSubmit} className="p-xl flex flex-col gap-md">
              {error && <div className="p-md bg-error-container/40 rounded-lg text-error font-body-md text-body-md">{error}</div>}
              <div className="flex flex-col gap-xs"><label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Nama Server</label><input className={inputClass} value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required /></div>
              <div className="flex flex-col gap-xs"><label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">IP Address</label><input className={inputClass} value={form.ip_address} onChange={e => setForm({ ...form, ip_address: e.target.value })} required /></div>
              <div className="flex flex-col gap-xs"><label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">MAC Address <span className="text-on-surface-variant/60">(untuk auto-detect DHCP)</span></label><input className={inputClass} value={form.mac_address} onChange={e => setForm({ ...form, mac_address: e.target.value })} placeholder="aa:bb:cc:dd:ee:ff" /></div>
              <div className="grid grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs"><label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Port</label><input type="number" className={inputClass} value={form.port} onChange={e => setForm({ ...form, port: e.target.value })} /></div>
                <div className="flex flex-col gap-xs"><label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Type</label><input className={inputClass} value={form.tipe} onChange={e => setForm({ ...form, tipe: e.target.value })} placeholder="e.g. Web Server" /></div>
              </div>
              <div className="flex flex-col gap-xs"><label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Icon (Material)</label><input className={inputClass} value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="dns, router, database..." /></div>
              <div className="flex flex-col gap-xs"><label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Lokasi</label><input className={inputClass} value={form.lokasi} onChange={e => setForm({ ...form, lokasi: e.target.value })} /></div>
              <div className="flex flex-col gap-xs"><label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Keterangan</label><textarea className={inputClass + ' h-16 resize-none'} value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} /></div>
              <label className="flex items-center gap-md font-body-md text-body-md text-on-surface-variant cursor-pointer">
                <input type="checkbox" checked={form.aktif} onChange={e => setForm({ ...form, aktif: e.target.checked })} className="w-4 h-4 rounded" /> Aktif
              </label>
              <div className="flex gap-md pt-sm">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-8 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg transition-colors cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 h-8 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md rounded-lg transition-colors shadow-sm cursor-pointer">{editing ? 'Update' : 'Tambah'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
