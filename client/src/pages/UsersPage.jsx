import { useState, useEffect } from 'react';
import axios from 'axios';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', nama: '', role: 'teknisi' });
  const [error, setError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => { try { const r = await axios.get('/api/users'); setUsers(r.data); } catch {} };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editing) await axios.put(`/api/users/${editing.id}`, form);
      else await axios.post('/api/users', form);
      setShowModal(false); setEditing(null); setForm({ username: '', password: '', nama: '', role: 'teknisi' }); fetchUsers();
    } catch (err) { setError(err.response?.data?.error || 'Gagal'); }
  };

  const handleEdit = (u) => { setEditing(u); setForm({ username: u.username, password: '', nama: u.nama, role: u.role }); setShowModal(true); };
  const handleDelete = async (id) => { if (!confirm('Hapus user ini?')) return; await axios.delete(`/api/users/${id}`); fetchUsers(); };

  const inputClass = "w-full h-8 px-md bg-surface-container-low/70 font-body-md text-body-md text-on-surface rounded-lg focus:outline-none focus:bg-surface-container-lowest transition-colors";

  return (
    <div className="flex flex-col gap-2xl">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-xs">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Manage User</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Kelola akun pengguna</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ username: '', password: '', nama: '', role: 'teknisi' }); setShowModal(true); }}
          className="flex items-center gap-xs h-8 px-md bg-primary hover:bg-primary-container text-on-primary rounded font-label-md text-label-md transition-colors shadow-sm cursor-pointer">
          <span className="material-symbols-outlined text-lg">add</span>
          Tambah User
        </button>
      </div>

      <div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/70 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider select-none">
                <th className="py-md px-xl font-semibold">User</th>
                <th className="py-md px-lg font-semibold">Username</th>
                <th className="py-md px-lg font-semibold text-center">Role</th>
                <th className="py-md px-xl font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="hover:bg-surface-container-low/60 transition-colors group cursor-default">
                  <td className="py-md px-xl">
                    <div className="flex items-center gap-md">
                      <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline-sm text-headline-sm">{u.nama?.charAt(0)}</div>
                      <span className="font-headline-sm text-headline-sm text-on-surface">{u.nama}</span>
                    </div>
                  </td>
                  <td className="py-md px-lg font-body-md text-body-md text-on-surface-variant">{u.username}</td>
                  <td className="py-md px-lg text-center">
                    <span className={`px-sm py-2xs rounded font-label-sm text-label-sm font-semibold capitalize ${u.role === 'admin' ? 'bg-primary-container/20 text-primary' : 'bg-tertiary-container/20 text-tertiary'}`}>{u.role}</span>
                  </td>
                  <td className="py-md px-xl text-right">
                    <div className="flex items-center justify-end gap-xs">
                      <button onClick={() => handleEdit(u)} className="p-xs text-on-surface-variant hover:text-primary hover:bg-primary-container/20 rounded-lg transition-colors cursor-pointer"><span className="material-symbols-outlined text-lg">edit</span></button>
                      <button onClick={() => handleDelete(u.id)} className="p-xs text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-lg transition-colors cursor-pointer"><span className="material-symbols-outlined text-lg">delete</span></button>
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
              <h2 className="font-headline-md text-headline-md text-on-surface">{editing ? 'Edit User' : 'Tambah User'}</h2>
              <button onClick={() => setShowModal(false)} className="p-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg cursor-pointer"><span className="material-symbols-outlined text-lg">close</span></button>
            </div>
            <form onSubmit={handleSubmit} className="p-xl flex flex-col gap-md">
              {error && <div className="p-md bg-error-container/40 rounded-lg text-error font-body-md text-body-md">{error}</div>}
              <div className="flex flex-col gap-xs"><label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Nama</label><input className={inputClass} value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required /></div>
              <div className="flex flex-col gap-xs"><label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Username</label><input className={inputClass} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required /></div>
              <div className="flex flex-col gap-xs"><label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Password {editing && '(kosongkan jika tidak diubah)'}</label><input type="password" className={inputClass} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editing} /></div>
              <div className="flex flex-col gap-xs"><label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Role</label>
                <select className={inputClass + ' appearance-none cursor-pointer'} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="teknisi">Teknisi</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
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
