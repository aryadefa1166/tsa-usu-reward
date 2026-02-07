import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { Trash2, Plus, Search, UserPlus } from 'lucide-react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State untuk Form Tambah User
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '', // NIM
    password: '',
    role: 'member',
    dept: '-'
  });

  // 1. FETCH DATA (Ambil data dari Supabase)
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('role', { ascending: true }); // Urutkan biar rapi
    
    if (error) console.error('Error fetching users:', error);
    else setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. ADD USER (Tambah ke Database)
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return alert('NIM dan Password wajib diisi!');

    const { error } = await supabase.from('users').insert([newUser]);

    if (error) {
      alert('Gagal menambah user: ' + error.message);
    } else {
      alert('User berhasil ditambahkan!');
      setNewUser({ username: '', password: '', role: 'member', dept: '-' }); // Reset form
      setShowForm(false); // Tutup form
      fetchUsers(); // Refresh tabel
    }
  };

  // 3. DELETE USER (Hapus dari Database)
  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus user ini? Data nilai mereka juga akan hilang.')) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) alert('Gagal menghapus: ' + error.message);
      else fetchUsers();
    }
  };

  // Filter Search Logic
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Manajemen Anggota</h1>
            <p className="text-sm text-slate-500">Total User: {users.length}</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-[#064e3b] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-emerald-800 transition-all shadow-md"
          >
            {showForm ? 'Batal' : <><Plus size={16} /> Tambah User</>}
          </button>
        </div>

        {/* --- FORM TAMBAH USER (Muncul jika tombol diklik) --- */}
        {showForm && (
          <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-lg mb-6 animate-fade-in-down">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <UserPlus size={18} className="text-[#d97706]" /> Input Data Baru
            </h3>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input 
                type="text" placeholder="NIM / Username" 
                className="border p-2 rounded text-sm"
                value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})}
              />
              <input 
                type="text" placeholder="Password" 
                className="border p-2 rounded text-sm"
                value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
              />
              <select 
                className="border p-2 rounded text-sm"
                value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="member">Member</option>
                <option value="kadep">Kadep/Wakadep</option>
                <option value="bph">BPH</option>
                <option value="advisory">Advisory</option>
                <option value="admin">Admin</option>
              </select>
              <input 
                type="text" placeholder="Departemen (Opsional)" 
                className="border p-2 rounded text-sm"
                value={newUser.dept} onChange={e => setNewUser({...newUser, dept: e.target.value})}
              />
              <button type="submit" className="bg-[#d97706] text-white font-bold rounded hover:bg-amber-700 transition-colors">
                Simpan
              </button>
            </form>
          </div>
        )}

        {/* --- SEARCH BAR --- */}
        <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            <input 
                type="text" 
                placeholder="Cari berdasarkan NIM atau Role..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#064e3b]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* --- TABEL DATA --- */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
              <tr>
                <th className="p-4 font-semibold">Username (NIM)</th>
                <th className="p-4 font-semibold">Password</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Departemen</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="p-6 text-center text-slate-500">Memuat data...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="p-6 text-center text-slate-500">Data tidak ditemukan.</td></tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-700">{u.username}</td>
                    <td className="p-4 text-slate-400 font-mono">••••••</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        u.role === 'admin' ? 'bg-red-100 text-red-700' :
                        u.role === 'bph' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{u.dept}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                        title="Hapus User"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default ManageUsers;