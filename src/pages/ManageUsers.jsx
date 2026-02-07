import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { Trash2, Plus, Search, UserPlus, Pencil, X, Save, Upload, Loader2 } from 'lucide-react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State Form
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null,
    username: '', 
    password: '',
    full_name: '', 
    role: 'member',
    dept: '-',
    division: '-', 
    cohort: '-', 
    position: 'Member', // Default English
    photo_url: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    // Fetch user urut berdasarkan sort_order biar Admin di bawah
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) console.error(error);
    else setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // FUNGSI UPLOAD FOTO
  const handleFileUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload ke bucket 'photos'
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('photos').getPublicUrl(filePath);
      
      setFormData({ ...formData, photo_url: data.publicUrl });
      alert('Photo uploaded successfully!');
    } catch (error) {
      alert('Error uploading photo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!formData.username) return alert('Username is required!');

    const payload = {
        username: formData.username,
        ...(formData.password && { password: formData.password }),
        full_name: formData.full_name,
        role: formData.role,
        dept: formData.dept,
        division: formData.division,
        cohort: formData.cohort,
        position: formData.position,
        photo_url: formData.photo_url
    };

    let error;

    if (isEditing) {
        const { error: updateError } = await supabase
            .from('users')
            .update(payload)
            .eq('id', formData.id);
        error = updateError;
    } else {
        if (!formData.password) return alert('Password is required for new user!');
        payload.password = formData.password;
        
        // Auto sort_order paling bawah
        const lastOrder = users.length > 0 ? Math.max(...users.map(u => u.sort_order || 0)) : 0;
        payload.sort_order = lastOrder + 1;

        const { error: insertError } = await supabase
            .from('users')
            .insert([payload]);
        error = insertError;
    }

    if (error) {
      alert('Operation failed: ' + error.message);
    } else {
      alert(isEditing ? 'User updated successfully!' : 'User added successfully!');
      resetForm();
      fetchUsers();
    }
  };

  const handleEdit = (user) => {
      setFormData({
          id: user.id,
          username: user.username,
          password: '',
          full_name: user.full_name,
          role: user.role,
          dept: user.dept,
          division: user.division,
          cohort: user.cohort,
          position: user.position,
          photo_url: user.photo_url || ''
      });
      setIsEditing(true);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) alert(error.message);
      else fetchUsers();
    }
  };

  const resetForm = () => {
      setFormData({ id: null, username: '', password: '', full_name: '', role: 'member', dept: '-', division: '-', cohort: '-', position: 'Member', photo_url: '' });
      setShowForm(false);
      setIsEditing(false);
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    u.dept.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalManagement = users.filter(u => u.role !== 'admin').length;

  // Helper Warna Departemen (Updated: ADV, MD, STD, ERBD, BPH)
  const getDeptColor = (deptName) => {
      const dept = deptName?.toUpperCase();
      if (dept === 'BPH') return 'bg-pink-100 text-pink-700 border-pink-200';
      if (dept === 'ADV') return 'bg-[#795548]/10 text-[#795548] border-[#795548]/20'; // Coklat
      if (dept === 'MD') return 'bg-purple-100 text-purple-700 border-purple-200'; 
      if (dept === 'STD') return 'bg-blue-100 text-blue-700 border-blue-200'; 
      if (dept === 'ERBD') return 'bg-emerald-100 text-emerald-700 border-emerald-200'; 
      return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-tsa-dark">User Management</h1>
            <p className="text-sm text-gray-500 mt-1">
                Total Officers: <span className="font-bold text-tsa-green">{totalManagement} Members</span> (Admin Excluded)
            </p>
          </div>
          <button 
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-lg ${showForm ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-tsa-green text-white hover:bg-emerald-900'}`}
          >
            {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add User</>}
          </button>
        </div>

        {/* FORM INPUT */}
        {showForm && (
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl mb-8 animate-fade-in-down">
            <h3 className="font-bold text-xl text-tsa-dark mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              {isEditing ? <Pencil size={20} className="text-tsa-gold" /> : <UserPlus size={20} className="text-tsa-gold" />} 
              {isEditing ? 'Edit User Data' : 'Add New User'}
            </h3>
            
            <form onSubmit={handleSaveUser} className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-tsa-green uppercase">Username</label>
                <input type="text" className="w-full border border-gray-300 p-3 rounded-lg text-sm outline-none" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-tsa-green uppercase">Password</label>
                <input type="text" placeholder={isEditing ? "Leave blank to keep" : "Required"} className="w-full border border-gray-300 p-3 rounded-lg text-sm outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-tsa-green uppercase">Full Name</label>
                <input type="text" className="w-full border border-gray-300 p-3 rounded-lg text-sm outline-none" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-tsa-green uppercase">Role</label>
                 <select className="w-full border border-gray-300 p-3 rounded-lg text-sm outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="member">Member</option>
                    <option value="kadiv">Kadiv</option>
                    <option value="kadep">Kadep</option>
                    <option value="bph">BPH</option>
                    <option value="advisory">Advisory</option>
                    <option value="admin">Admin</option>
                 </select>
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-tsa-green uppercase">Department</label>
                 <input type="text" className="w-full border border-gray-300 p-3 rounded-lg text-sm outline-none" value={formData.dept} onChange={e => setFormData({...formData, dept: e.target.value})} />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-tsa-green uppercase">Division</label>
                 <input type="text" className="w-full border border-gray-300 p-3 rounded-lg text-sm outline-none" value={formData.division} onChange={e => setFormData({...formData, division: e.target.value})} />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-tsa-green uppercase">Position Title</label>
                 <input type="text" className="w-full border border-gray-300 p-3 rounded-lg text-sm outline-none" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-tsa-green uppercase">Cohort</label>
                 <input type="text" className="w-full border border-gray-300 p-3 rounded-lg text-sm outline-none" value={formData.cohort} onChange={e => setFormData({...formData, cohort: e.target.value})} />
              </div>
              {/* UPLOAD FILE */}
              <div className="space-y-1 md:col-span-3">
                 <label className="text-xs font-bold text-tsa-green uppercase">Upload Photo</label>
                 <div className="flex gap-2 items-center">
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-tsa-green/10 file:text-tsa-green hover:file:bg-tsa-green/20" />
                    {uploading && <Loader2 className="animate-spin text-tsa-green" />}
                 </div>
                 {formData.photo_url && <p className="text-[10px] text-green-600 mt-1 truncate">File uploaded: {formData.photo_url}</p>}
              </div>

              <div className="md:col-span-4 flex justify-end gap-3 mt-4 border-t border-gray-100 pt-6">
                 <button type="button" onClick={resetForm} className="px-6 py-3 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all">Cancel</button>
                 {/* REVISI: Tombol Warna IJO (tsa-green) */}
                 <button type="submit" className="px-8 py-3 rounded-lg text-sm font-bold bg-tsa-green text-white hover:bg-emerald-800 transition-all shadow-md flex items-center gap-2">
                    <Save size={18} /> {isEditing ? 'Save Changes' : 'Create User'}
                 </button>
              </div>
            </form>
          </div>
        )}

        {/* SEARCH BAR */}
        <div className="relative mb-6">
            <Search size={20} className="absolute left-4 top-3.5 text-gray-400" />
            <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-tsa-green focus:ring-1 focus:ring-tsa-green shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* TABEL DATA */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                    <th className="p-5 font-bold text-tsa-green text-xs uppercase w-12">#</th>
                    <th className="p-5 font-bold text-tsa-green text-xs uppercase">Profile</th>
                    <th className="p-5 font-bold text-tsa-green text-xs uppercase">Position & Role</th>
                    <th className="p-5 font-bold text-tsa-green text-xs uppercase">Dept / Div</th>
                    <th className="p-5 font-bold text-tsa-green text-xs uppercase">Cohort</th>
                    <th className="p-5 font-bold text-tsa-green text-xs uppercase text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {loading ? (
                    <tr><td colSpan="6" className="p-8 text-center text-gray-400">Loading...</td></tr>
                ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan="6" className="p-8 text-center text-gray-400">No users found.</td></tr>
                ) : (
                    filteredUsers.map((u, index) => (
                    <tr key={u.id} className="hover:bg-green-50/30 transition-colors">
                        <td className="p-5 text-gray-400 font-mono text-xs">{index + 1}</td>
                        
                        <td className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-300">
                                    {u.photo_url ? (
                                        <img src={u.photo_url} alt={u.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs bg-gray-100">
                                            {u.full_name ? u.full_name.charAt(0) : '?'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-bold text-tsa-dark">{u.full_name || u.username}</div>
                                    <div className="text-xs text-gray-400">@{u.username}</div>
                                </div>
                            </div>
                        </td>

                        <td className="p-5">
                            {/* REVISI: Warna Jabatan (EB & Wakil Kadep jadi Emas) */}
                            <div className={`text-xs font-bold uppercase ${['President', 'Vice President', 'Secretary', 'Treasurer', 'Head of Department', 'Vice Head of Department', 'Head of Division', 'Steering Committee'].includes(u.position) ? 'text-tsa-gold' : 'text-tsa-green'}`}>
                                {u.position}
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 inline-block bg-gray-100 text-gray-500 border border-gray-200">
                                {u.role}
                            </span>
                        </td>

                        <td className="p-5 text-gray-600">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getDeptColor(u.dept)}`}>
                                {u.dept}
                            </span>
                            {u.division !== '-' && <div className="text-xs text-gray-400 mt-1 ml-1">{u.division}</div>}
                        </td>

                        <td className="p-5 text-gray-500 text-xs font-medium">{u.cohort}</td>

                        <td className="p-5 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => handleEdit(u)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Edit">
                                    <Pencil size={16} />
                                </button>
                                <button onClick={() => handleDelete(u.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Delete">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManageUsers;