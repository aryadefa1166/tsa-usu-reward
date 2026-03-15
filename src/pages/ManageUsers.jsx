import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { calculateQuarterlyResults } from '../utils/calculator';
import { 
  Trash2, Plus, Search, UserPlus, Pencil, X, Save, Loader2, 
  Users, CalendarDays, Activity, Eye, CheckCircle2, AlertCircle, ShieldCheck, Download 
} from 'lucide-react';

// --- KOMPONEN BANTUAN UNTUK TRACKER TAB ---
const TrackerRow = ({ name, position, dept, progress, total }) => {
  const percentage = total > 0 ? (progress / total) * 100 : 0;
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition-all">
      <div>
        <h4 className="font-bold text-sm text-tsa-dark">{name}</h4>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
          {position} • {dept}
        </p>
      </div>
      <div className="flex items-center gap-4 w-1/3">
        <div className="flex-grow bg-gray-100 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${percentage === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="flex items-center gap-1 min-w-[60px] justify-end">
          <span className="text-xs font-black text-tsa-dark">{progress}/{total}</span>
          {percentage === 100 ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-amber-500" />}
        </div>
      </div>
    </div>
  );
};

const ShieldIcon = () => (
  <div className="w-10 h-10 bg-tsa-dark rounded-xl flex items-center justify-center shadow-md">
    <ShieldCheck size={20} className="text-tsa-gold" />
  </div>
);

// --- KOMPONEN UTAMA ---
const ManageUsers = () => {
  // State Navigasi Tab
  const [activeTab, setActiveTab] = useState('periods'); // Di-set default ke periods untuk testing

  // State Bawaan Databasemu (CRUD User)
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State Form Databasemu
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null, username: '', password: '', full_name: '', 
    role: 'member', dept: '-', division: '-', cohort: '-', 
    position: 'Staff', photo_url: ''
  });

  // State Pengaturan Admin (Backend Tahap 3)
  const [appSettings, setAppSettings] = useState({ 
    q1_status: 'LOCKED', q2_status: 'LOCKED', q3_status: 'LOCKED', q4_status: 'LOCKED', voting_status: 'LOCKED' 
  });
  const [savingPeriod, setSavingPeriod] = useState(false);

  const adminTabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'periods', label: 'Period Settings & Export', icon: CalendarDays },
    { id: 'tracker', label: 'Evaluation Tracker', icon: Activity },
  ];

  useEffect(() => {
    fetchUsers();
    fetchSettings();
  }, []);

  // --- LOGIKA FETCHING ---
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) console.error(error);
    else setUsers(data);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
    if (!error && data) setAppSettings(data);
  };

  // --- LOGIKA UPDATE STATUS PERIODE (SYNC DATABASE) ---
  const handleUpdatePeriod = async (column, value) => {
    setSavingPeriod(true);
    try {
      const { error } = await supabase.from('app_settings').update({ [column]: value }).eq('id', 1);
      if (error) throw error;
      setAppSettings(prev => ({ ...prev, [column]: value }));
    } catch (error) {
      alert("Gagal memperbarui status: " + error.message);
    } finally {
      setSavingPeriod(false);
    }
  };

  // --- LOGIKA EXPORT CSV (OTAK KALKULATOR) ---
  const handleExportCSV = async (quarter) => {
    try {
      const result = await calculateQuarterlyResults(quarter);
      if (!result || !result.allScores || result.allScores.length === 0) {
        return alert("Data kalkulasi masih kosong atau gagal ditarik.");
      }

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Nama Lengkap,Departemen,Posisi,Kehadiran (%),Skor Kualitatif (Rata-rata),The Reliable One,The High Achiever,The Spark,The Ultimate MVP\n";
      
      result.allScores.forEach(u => {
        const row = [
          `"${u.full_name || '-'}"`, 
          `"${u.dept || '-'}"`, 
          `"${u.position || '-'}"`,
          u.attendanceScore?.toFixed(1) || 0,
          u.qualitativeScore?.toFixed(1) || 0,
          u.theReliableOne?.toFixed(1) || 0,
          u.theHighAchiever?.toFixed(1) || 0,
          u.theSpark?.toFixed(1) || 0,
          u.theUltimateMVP?.toFixed(1) || 0
        ].join(",");
        csvContent += row + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `TSA_REWARD_${quarter}_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      alert("Gagal melakukan export: " + error.message);
    }
  };

  // --- LOGIKA CRUD USER (ASLI MILIKMU) ---
  const handleFileUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('photos').upload(filePath, file);
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
        const { error: updateError } = await supabase.from('users').update(payload).eq('id', formData.id);
        error = updateError;
    } else {
        if (!formData.password) return alert('Password is required for new user!');
        payload.password = formData.password;
        
        const lastOrder = users.length > 0 ? Math.max(...users.map(u => u.sort_order || 0)) : 0;
        payload.sort_order = lastOrder + 1;

        const { error: insertError } = await supabase.from('users').insert([payload]);
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
          id: user.id, username: user.username, password: '', full_name: user.full_name,
          role: user.role, dept: user.dept, division: user.division, cohort: user.cohort,
          position: user.position, photo_url: user.photo_url || ''
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
      setFormData({ id: null, username: '', password: '', full_name: '', role: 'member', dept: '-', division: '-', cohort: '-', position: 'Staff', photo_url: '' });
      setShowForm(false);
      setIsEditing(false);
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    u.dept.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalManagement = users.filter(u => u.role !== 'admin').length;

  const getDeptColor = (deptName) => {
      const dept = deptName?.toUpperCase();
      if (dept === 'BPH') return 'bg-pink-100 text-pink-700 border-pink-200';
      if (dept === 'ADV') return 'bg-[#795548]/10 text-[#795548] border-[#795548]/20';
      if (dept === 'MD') return 'bg-purple-100 text-purple-700 border-purple-200'; 
      if (dept === 'STD') return 'bg-blue-100 text-blue-700 border-blue-200'; 
      if (dept === 'ERBD') return 'bg-emerald-100 text-emerald-700 border-emerald-200'; 
      return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  // Konfigurasi Array untuk Rendering Tab Periods
  const periodsConfig = [
    { id: 'q1_status', label: 'Quarter 1', value: appSettings.q1_status, q: 'Q1' },
    { id: 'q2_status', label: 'Quarter 2', value: appSettings.q2_status, q: 'Q2' },
    { id: 'q3_status', label: 'Quarter 3', value: appSettings.q3_status, q: 'Q3' },
    { id: 'q4_status', label: 'Quarter 4', value: appSettings.q4_status, q: 'Q4' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 mt-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-tsa-dark tracking-tight flex items-center gap-3">
            <ShieldIcon /> Admin Center
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Control panel for database, periods, and tracking.</p>
        </div>

        {/* TAB NAVIGATION ADMIN */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm inline-flex">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive ? 'bg-tsa-green text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-tsa-dark'
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                <span className="hidden sm:block">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================== */}
        {/* TAB 1: USER MANAGEMENT (ASLI MILIKMU 100%) */}
        {/* ========================================== */}
        {activeTab === 'users' && (
          <div className="animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-tsa-dark">User Database</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Total Officers: <span className="font-bold text-tsa-green">{totalManagement} Staff</span> (Admin Excluded)
                </p>
              </div>
              <button 
                onClick={() => { resetForm(); setShowForm(!showForm); }}
                className={`px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-md ${showForm ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-tsa-green text-white hover:bg-emerald-900'}`}
              >
                {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add User</>}
              </button>
            </div>

            {/* FORM INPUT */}
            {showForm && (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl mb-8">
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
                        <option value="member">Staff (Member)</option>
                        <option value="kadiv">Kadiv / Team Leader</option>
                        <option value="kadep">Kadep</option>
                        <option value="bph">BPH</option>
                        <option value="adv">Advisory</option>
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
                    <button type="submit" className="px-8 py-3 rounded-lg text-sm font-bold bg-tsa-green text-white hover:bg-emerald-800 transition-all shadow-md flex items-center gap-2">
                        <Save size={18} /> {isEditing ? 'Save Changes' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SEARCH BAR & TABEL */}
            <div className="relative mb-6">
                <Search size={20} className="absolute left-4 top-3.5 text-gray-400" />
                <input 
                    type="text" placeholder="Search users..." 
                    className="w-full pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-tsa-green shadow-sm"
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="p-5 font-bold text-tsa-green text-xs uppercase w-12">#</th>
                        <th className="p-5 font-bold text-tsa-green text-xs uppercase">Profile</th>
                        <th className="p-5 font-bold text-tsa-green text-xs uppercase">Position & Role</th>
                        <th className="p-5 font-bold text-tsa-green text-xs uppercase">Dept / Div</th>
                        <th className="p-5 font-bold text-tsa-green text-xs uppercase">Cohort</th>
                        <th className="p-5 font-bold text-tsa-green text-xs uppercase text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                    {loading ? (
                        <tr><td colSpan="6" className="p-8 text-center text-gray-400">Loading database...</td></tr>
                    ) : filteredUsers.length === 0 ? (
                        <tr><td colSpan="6" className="p-8 text-center text-gray-400">No users found.</td></tr>
                    ) : (
                        filteredUsers.map((u, index) => (
                        <tr key={u.id} className="hover:bg-green-50/30 transition-colors">
                            <td className="p-5 text-gray-400 font-mono text-xs">{index + 1}</td>
                            <td className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                                        {u.photo_url ? (
                                            <img src={u.photo_url} alt={u.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">
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
                                <div className={`text-xs font-bold uppercase ${['President', 'Vice President', 'Secretary', 'Treasurer', 'Head of Department', 'Vice Head of Department', 'Head of Division'].includes(u.position) ? 'text-tsa-gold' : 'text-tsa-green'}`}>
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
                                {u.division !== '-' && <div className="text-xs text-gray-400 mt-1 ml-1 font-medium">{u.division}</div>}
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
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: PERIOD SETTINGS & EXPORT CSV */}
        {/* ========================================== */}
        {activeTab === 'periods' && (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm animate-fade-in-up">
            <h2 className="text-lg font-black text-tsa-dark mb-6">Period Lifecycle Control & Export</h2>
            
            <div className="space-y-4">
              {periodsConfig.map(p => (
                <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border border-gray-200 bg-white hover:border-tsa-green transition-all gap-4">
                  <div>
                    <h3 className="font-bold text-tsa-dark text-base">{p.label}</h3>
                    <p className="text-xs text-gray-500 mt-1">Current Status: <span className={`font-bold uppercase ${p.value === 'ACTIVE' ? 'text-tsa-green' : p.value === 'PUBLISHED' ? 'text-blue-500' : 'text-gray-500'}`}>{p.value}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select 
                      value={p.value}
                      onChange={(e) => handleUpdatePeriod(p.id, e.target.value)}
                      disabled={savingPeriod}
                      className="bg-white border border-gray-200 text-sm font-bold text-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-tsa-green shadow-sm disabled:opacity-50"
                    >
                      <option value="LOCKED">🔒 Locked</option>
                      <option value="ACTIVE">🟢 Active</option>
                      <option value="READ_ONLY">👀 Read-Only</option>
                      <option value="PUBLISHED">🏆 Published</option>
                    </select>
                    
                    <button 
                      onClick={() => handleExportCSV(p.q)}
                      className="bg-gray-100 text-tsa-dark px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center gap-2 shadow-sm border border-gray-200"
                    >
                      <Download size={14} /> CSV
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border border-gray-800 bg-gray-900 transition-all gap-4 mt-8 shadow-md">
                  <div>
                    <h3 className="font-bold text-tsa-gold text-base">End of Term (Voting)</h3>
                    <p className="text-xs text-gray-400 mt-1">Status: <span className="font-bold text-white uppercase">{appSettings.voting_status}</span></p>
                  </div>
                  <select 
                      value={appSettings.voting_status}
                      onChange={(e) => handleUpdatePeriod('voting_status', e.target.value)}
                      disabled={savingPeriod}
                      className="bg-gray-800 border border-gray-700 text-sm font-bold text-white rounded-xl px-4 py-2 focus:outline-none focus:border-tsa-gold shadow-sm"
                  >
                      <option value="LOCKED">🔒 Locked</option>
                      <option value="ACTIVE">🟢 Active</option>
                      <option value="PUBLISHED">🏆 Published</option>
                  </select>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
              <Eye className="text-blue-500 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                <strong>Logika Sync:</strong> Apabila Anda merubah status menjadi <span className="bg-white px-1.5 py-0.5 rounded border border-blue-200">🏆 Published</span>, sistem akan otomatis melakukan kalkulasi akhir dan membuka gembok nama pemenang di layar Dashboard seluruh pengurus.
              </p>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: EVALUATION TRACKER */}
        {/* ========================================== */}
        {activeTab === 'tracker' && (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm animate-fade-in-up">
             <h2 className="text-lg font-black text-tsa-dark mb-6">Live Evaluation Progress</h2>
             <TrackerRow name="Rafael Royto" position="Head of ERBD" dept="ERBD" progress={5} total={5} />
             <TrackerRow name="Ilyas Ramadana" position="Team Leader" dept="Product Partnership" progress={1} total={2} />
          </div>
        )}

      </main>
    </div>
  );
};

export default ManageUsers;