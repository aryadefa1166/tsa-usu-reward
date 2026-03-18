import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { calculateQuarterlyResults } from '../utils/calculator';
import { 
  Trash2, Plus, Search, UserPlus, Pencil, X, Save, Loader2, 
  Users, CalendarDays, Activity, ShieldCheck, Download, ImagePlus, UploadCloud, Briefcase,
  AlertTriangle, CheckCircle2, Copy, Crown, Clock
} from 'lucide-react';

const ShieldIcon = () => (
  <div className="w-10 h-10 bg-tsa-green rounded-xl flex items-center justify-center shadow-md">
    <ShieldCheck size={20} className="text-white" />
  </div>
);

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users'); 
  
  // State User Database
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State Form User
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    id: null, username: '', password: '', full_name: '', 
    role: 5, dept: '-', division: '-', cohort: '-', 
    position: 'Staff', photo_url: '', is_active: true
  });

  // State Pengaturan Periode
  const [appSettings, setAppSettings] = useState({ 
    q1_status: 'LOCKED', q2_status: 'LOCKED', q3_status: 'LOCKED', q4_status: 'LOCKED', voting_status: 'LOCKED' 
  });
  const [savingPeriod, setSavingPeriod] = useState(false);

  // State Organization Assets
  const [assetsList, setAssetsList] = useState([]);
  const [uploadingAsset, setUploadingAsset] = useState(null);

  // State Project Nominations
  const [projectsList, setProjectsList] = useState([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [uploadingProjectPhoto, setUploadingProjectPhoto] = useState(false);
  const [projectFormData, setProjectFormData] = useState({
    id: null, name: '', description: '', event_date: '', pct: '', photo_url: ''
  });

  // State Evaluation Tracker
  const [trackerData, setTrackerData] = useState([]);
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [activeTrackerName, setActiveTrackerName] = useState('');

  const adminTabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'projects', label: 'Project Nominations', icon: Briefcase },
    { id: 'periods', label: 'Period Settings & Export', icon: CalendarDays },
    { id: 'assets', label: 'Organization Assets', icon: ImagePlus },
    { id: 'tracker', label: 'Evaluation Tracker', icon: Activity },
  ];

  useEffect(() => {
    fetchUsers();
    fetchSettings();
    fetchAssets();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (activeTab === 'tracker') fetchTrackerData();
  }, [activeTab, appSettings]);

  // ==========================================
  // FETCHING LOGIC
  // ==========================================
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('users').select('*').order('sort_order', { ascending: true });
    if (!error) setUsersList(data);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
    if (!error && data) setAppSettings(data);
  };

  const fetchAssets = async () => {
    const { data, error } = await supabase.from('organization_assets').select('*').order('entity_name', { ascending: true });
    if (!error && data) setAssetsList(data);
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (!error && data) setProjectsList(data);
  };

  // ==========================================
  // TRACKER LOGIC (DIPERBAIKI JADI BINER & MENDUKUNG READ_ONLY)
  // ==========================================
  const fetchTrackerData = async () => {
    setTrackerLoading(true);
    try {
      let activeQuarter = null;
      if (['ACTIVE', 'READ_ONLY'].includes(appSettings.q1_status)) activeQuarter = 'Q1';
      else if (['ACTIVE', 'READ_ONLY'].includes(appSettings.q2_status)) activeQuarter = 'Q2';
      else if (['ACTIVE', 'READ_ONLY'].includes(appSettings.q3_status)) activeQuarter = 'Q3';
      else if (['ACTIVE', 'READ_ONLY'].includes(appSettings.q4_status)) activeQuarter = 'Q4';

      if (['ACTIVE', 'READ_ONLY'].includes(appSettings.voting_status)) {
        setActiveTrackerName('End of Term Evaluation'); 
        
        // Tarik HANYA kolom voter_id agar ringan
        const { data: votes } = await supabase.from('end_of_term_votes').select('voter_id');
        
        // Target: Semua Pengurus Aktif KECUALI Admin
        const votersTarget = usersList.filter(u => u.role !== 1 && u.is_active === true);
        
        // Buat Set (O(1) Lookup) berisi daftar unik ID pengurus yang sudah vote
        const votedSet = new Set(votes?.map(v => v.voter_id) || []);

        const report = votersTarget.map(user => {
          const hasVoted = votedSet.has(user.id);
          return {
            ...user,
            status: hasVoted ? 'COMPLETED' : 'PENDING',
            detail: hasVoted ? 'Votes submitted successfully' : 'Has not participated yet'
          };
        });
        
        const sortOrder = { 'PENDING': 1, 'COMPLETED': 2 };
        setTrackerData(report.sort((a, b) => sortOrder[a.status] - sortOrder[b.status]));
      } 
      else if (activeQuarter) {
        setActiveTrackerName(`${activeQuarter} Assessment`);
        const { data: assessments } = await supabase.from('assessments').select('assessor_id').eq('quarter', activeQuarter);
        
        const assessorTarget = usersList.filter(u => u.role >= 2 && u.role <= 4 && u.is_active === true);
        
        const assessCount = {};
        assessments?.forEach(a => {
          assessCount[a.assessor_id] = (assessCount[a.assessor_id] || 0) + 1;
        });

        const report = assessorTarget.map(user => {
          const count = assessCount[user.id] || 0;
          return {
            ...user,
            status: count > 0 ? 'COMPLETED' : 'PENDING', 
            detail: count > 0 ? `Assessed ${count} members` : 'No assessments yet'
          };
        });

        const sortOrder = { 'PENDING': 1, 'COMPLETED': 2 };
        setTrackerData(report.sort((a, b) => sortOrder[a.status] - sortOrder[b.status]));
      } 
      else {
        setActiveTrackerName('');
        setTrackerData([]);
      }
    } catch (error) {
      console.error("Error fetching tracker data:", error);
    } finally {
      setTrackerLoading(false);
    }
  };

  const handleCopyReminder = (name, type) => {
    let text = "";
    if (type === 'End of Term Evaluation') {
      text = `Hello ${name}, please kindly check the TSA USU R.E.W.A.R.D portal and complete your required End of Term evaluation forms. Thank you! 🙏`;
    } else {
      text = `Hello ${name}, a gentle reminder to complete your quarterly assessments for your team members on the TSA USU R.E.W.A.R.D portal. Thank you! 🙏`;
    }
    navigator.clipboard.writeText(text);
    alert(`Reminder message for ${name} copied to clipboard!`);
  };

  // ==========================================
  // PROJECT CRUD LOGIC 
  // ==========================================
  const handleProjectPhotoUpload = async (e) => {
    try {
      setUploadingProjectPhoto(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `project_${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('photos').getPublicUrl(fileName);
      setProjectFormData({ ...projectFormData, photo_url: data.publicUrl });
    } catch (error) {
      alert('Error uploading photo: ' + error.message);
    } finally {
      setUploadingProjectPhoto(false);
    }
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!projectFormData.name) return alert('Project Name is required!');

    let error;
    if (isEditingProject) {
      const { error: updateError } = await supabase.from('projects').update({
        name: projectFormData.name,
        description: projectFormData.description,
        event_date: projectFormData.event_date,
        pct: projectFormData.pct,
        photo_url: projectFormData.photo_url
      }).eq('id', projectFormData.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('projects').insert([{
        name: projectFormData.name,
        description: projectFormData.description,
        event_date: projectFormData.event_date,
        pct: projectFormData.pct,
        photo_url: projectFormData.photo_url
      }]);
      error = insertError;
    }

    if (error) {
      alert('Failed to save project: ' + error.message);
    } else {
      alert(isEditingProject ? 'Project updated!' : 'Project added successfully!');
      resetProjectForm();
      fetchProjects();
    }
  };

  const handleEditProject = (proj) => {
    setProjectFormData({
      id: proj.id, name: proj.name, description: proj.description, 
      event_date: proj.event_date || '', pct: proj.pct, photo_url: proj.photo_url || ''
    });
    setIsEditingProject(true);
    setShowProjectForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm('Delete this project nomination?')) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) alert(error.message);
      else fetchProjects();
    }
  };

  const resetProjectForm = () => {
    setProjectFormData({ id: null, name: '', description: '', event_date: '', pct: '', photo_url: '' });
    setShowProjectForm(false);
    setIsEditingProject(false);
  };


  // ==========================================
  // ASSET UPLOAD LOGIC
  // ==========================================
  const handleAssetUpload = async (e, entityName) => {
    try {
      setUploadingAsset(entityName);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `asset_${entityName.toLowerCase().replace(/\s+/g, '_')}_${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('photos').getPublicUrl(fileName);
      
      const { error: dbError } = await supabase.from('organization_assets').update({ photo_url: data.publicUrl }).eq('entity_name', entityName);
      if (dbError) throw dbError;

      alert(`Foto untuk ${entityName} berhasil diperbarui!`);
      fetchAssets(); 
    } catch (error) {
      alert('Error uploading asset: ' + error.message);
    } finally {
      setUploadingAsset(null);
    }
  };

  // ==========================================
  // PERIOD & CSV LOGIC
  // ==========================================
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
          `"${u.full_name || '-'}"`, `"${u.dept || '-'}"`, `"${u.position || '-'}"`,
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

  // ==========================================
  // USER CRUD LOGIC
  // ==========================================
  const handleFileUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('photos').getPublicUrl(fileName);
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
      ...formData, 
      role: parseInt(formData.role),
      is_active: formData.is_active.toString() === 'true'
    };

    let error;

    if (isEditing) {
        if (!payload.password) delete payload.password; 
        const { error: updateError } = await supabase.from('users').update(payload).eq('id', formData.id);
        error = updateError;
    } else {
        if (!formData.password) return alert('Password is required for new user!');
        const lastOrder = usersList.length > 0 ? Math.max(...usersList.map(u => u.sort_order || 0)) : 0;
        payload.sort_order = lastOrder + 1;
        
        const { error: insertError } = await supabase.from('users').insert([payload]);
        error = insertError;
    }

    if (error) {
      alert('Operation failed: ' + error.message);
    } else {
      alert(isEditing ? 'User updated successfully!' : 'User added successfully!');
      resetUserForm();
      fetchUsers();
    }
  };

  const handleEdit = (user) => {
      setFormData({
          id: user.id, username: user.username, password: '', full_name: user.full_name,
          role: user.role, dept: user.dept, division: user.division, cohort: user.cohort,
          position: user.position, photo_url: user.photo_url || '', is_active: user.is_active !== false
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

  const resetUserForm = () => {
      setFormData({ id: null, username: '', password: '', full_name: '', role: 5, dept: '-', division: '-', cohort: '-', position: 'Staff', photo_url: '', is_active: true });
      setShowForm(false);
      setIsEditing(false);
  };

  const filteredUsers = usersList.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    u.dept.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalManagement = usersList.filter(u => u.role !== 1).length;

  const getDeptColor = (deptName) => {
      const dept = deptName?.toUpperCase();
      if (dept === 'BPH') return 'bg-pink-100 text-pink-700 border-pink-200';
      if (dept === 'ADV') return 'bg-orange-100 text-orange-800 border-orange-200'; 
      if (dept === 'MD') return 'bg-purple-100 text-purple-700 border-purple-200'; 
      if (dept === 'STD') return 'bg-blue-100 text-blue-700 border-blue-200'; 
      if (dept === 'ERBD') return 'bg-emerald-100 text-emerald-700 border-emerald-200'; 
      return 'bg-gray-100 text-gray-600 border-gray-200';
  };

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
          <p className="text-sm text-gray-500 mt-1 font-medium">Control panel for database, periods, assets, and tracking.</p>
        </div>

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

        {/* TAB 1: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-tsa-dark flex items-center gap-2"><Users size={20} className="text-tsa-green"/> User Database</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Total Officers: <span className="font-bold text-tsa-green">{totalManagement} Personnel</span> (Admin Excluded)
                </p>
              </div>
              <button 
                onClick={() => { resetUserForm(); setShowForm(!showForm); }}
                className={`px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-md ${showForm ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-tsa-green text-white hover:bg-emerald-900'}`}
              >
                {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add User</>}
              </button>
            </div>

            {showForm && (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl mb-8">
                <h3 className="font-bold text-xl text-tsa-dark mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                  {isEditing ? <Pencil size={20} className="text-tsa-green" /> : <UserPlus size={20} className="text-tsa-green" />} 
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
                        <option value={5}>Staff / Team Leader</option>
                        <option value={4}>Kadiv</option>
                        <option value={3}>Kadep / Wakadep</option>
                        <option value={2}>BPH / ADV</option>
                        <option value={1}>Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-tsa-green uppercase">Status</label>
                    <select className="w-full border border-gray-300 p-3 rounded-lg text-sm outline-none font-bold" value={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.value})}>
                        <option value="true" className="text-tsa-green">Active</option>
                        <option value="false" className="text-red-500">Inactive</option>
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
                  
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-tsa-green uppercase">Upload Photo</label>
                    <div className="flex gap-2 items-center">
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-tsa-green/10 file:text-tsa-green hover:file:bg-tsa-green/20" />
                        {uploading && <Loader2 className="animate-spin text-tsa-green" />}
                    </div>
                    {formData.photo_url && <p className="text-[10px] text-green-600 mt-1 truncate">File uploaded: {formData.photo_url}</p>}
                  </div>

                  <div className="md:col-span-4 flex justify-end gap-3 mt-4 border-t border-gray-100 pt-6">
                    <button type="button" onClick={resetUserForm} className="px-6 py-3 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all">Cancel</button>
                    <button type="submit" className="px-8 py-3 rounded-lg text-sm font-bold bg-tsa-green text-white hover:bg-emerald-800 transition-all shadow-md flex items-center gap-2">
                        <Save size={18} /> {isEditing ? 'Save Changes' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            )}

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
                        <th className="p-5 font-bold text-tsa-green text-xs uppercase">Position</th>
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
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-5 text-gray-400 font-mono text-xs">{index + 1}</td>
                            <td className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex-shrink-0 overflow-hidden border ${u.is_active === false ? 'bg-gray-100 border-gray-200 opacity-50' : 'bg-gray-100 border-gray-200'}`}>
                                        {u.photo_url ? (
                                            <img src={u.photo_url} alt={u.username} className={`w-full h-full object-cover ${u.is_active === false ? 'grayscale' : ''}`} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">
                                                {u.full_name ? u.full_name.charAt(0) : '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className={`font-bold ${u.is_active === false ? 'text-gray-400' : 'text-tsa-dark'}`}>{u.full_name || u.username}</div>
                                        <div className="text-xs text-gray-400">@{u.username}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-5">
                                <div className={`text-xs font-bold uppercase ${['President', 'Vice President', 'Secretary', 'Treasurer', 'Head of Department', 'Vice Head of Dept', 'Vice Head of Department', 'Head of Division', 'Steering Committee'].includes(u.position) ? 'text-tsa-gold' : 'text-tsa-green'}`}>
                                    {u.position}
                                </div>
                                <div className="mt-1">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase inline-block border ${u.is_active !== false ? 'bg-green-50 text-tsa-green border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                                      {u.is_active !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
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

        {/* TAB 2: PROJECT NOMINATIONS */}
        {activeTab === 'projects' && (
          <div className="animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-tsa-dark flex items-center gap-2"><Briefcase size={20} className="text-tsa-green"/> Project Nominations</h2>
                <p className="text-sm text-gray-500 mt-1">Manage TSA USU work programs for End of Term Awards.</p>
              </div>
              <button 
                onClick={() => { resetProjectForm(); setShowProjectForm(!showProjectForm); }}
                className={`px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-md ${showProjectForm ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-tsa-green text-white hover:bg-emerald-900'}`}
              >
                {showProjectForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add Project</>}
              </button>
            </div>

            {showProjectForm && (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl mb-8">
                <h3 className="font-bold text-xl text-tsa-dark mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                  {isEditingProject ? 'Edit Project Data' : 'Add New Project'}
                </h3>
                
                <form onSubmit={handleSaveProject} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-tsa-green uppercase">Project Name</label>
                    <input type="text" className="w-full border border-gray-300 p-3 rounded-lg text-sm outline-none" value={projectFormData.name} onChange={e => setProjectFormData({...projectFormData, name: e.target.value})} required placeholder="e.g. Welcoming Party 2026" />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-tsa-green uppercase">Event Date</label>
                    <input type="date" className="w-full border border-gray-300 p-3 rounded-lg text-sm outline-none" value={projectFormData.event_date} onChange={e => setProjectFormData({...projectFormData, event_date: e.target.value})} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-tsa-green uppercase">Project Core Team (PCT)</label>
                    <input type="text" className="w-full border border-gray-300 p-3 rounded-lg text-sm outline-none" value={projectFormData.pct} onChange={e => setProjectFormData({...projectFormData, pct: e.target.value})} placeholder="e.g. Budi (Ketua), Siti, dkk" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-tsa-green uppercase">Upload Cover Photo</label>
                    <div className="flex gap-2 items-center">
                        <input type="file" accept="image/*" onChange={handleProjectPhotoUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-tsa-green hover:file:bg-green-100" />
                        {uploadingProjectPhoto && <Loader2 className="animate-spin text-tsa-green" />}
                    </div>
                    {projectFormData.photo_url && <p className="text-[10px] text-green-600 mt-1 truncate">File: {projectFormData.photo_url}</p>}
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-tsa-green uppercase">Description</label>
                    <textarea rows="3" className="w-full border border-gray-300 p-3 rounded-lg text-sm outline-none resize-none" value={projectFormData.description} onChange={e => setProjectFormData({...projectFormData, description: e.target.value})} placeholder="Singkat, padat, dan jelas mengenai project ini..."></textarea>
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t border-gray-100 pt-6">
                    <button type="submit" className="px-8 py-3 rounded-lg text-sm font-bold bg-tsa-green text-white shadow-md flex items-center gap-2 hover:bg-emerald-800">
                        <Save size={18} /> Save Project
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectsList.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-400 font-medium">No projects added yet.</div>
              ) : (
                projectsList.map(proj => (
                  <div key={proj.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                    <div className="h-32 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                      {proj.photo_url ? (
                        <img src={proj.photo_url} alt={proj.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <Briefcase size={32} className="text-gray-300" />
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button onClick={() => handleEditProject(proj)} className="p-1.5 bg-white/90 text-blue-600 rounded-lg shadow-sm hover:bg-white backdrop-blur-sm"><Pencil size={14}/></button>
                        <button onClick={() => handleDeleteProject(proj.id)} className="p-1.5 bg-white/90 text-red-600 rounded-lg shadow-sm hover:bg-white backdrop-blur-sm"><Trash2 size={14}/></button>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-black text-tsa-dark text-lg leading-tight mb-1 truncate">{proj.name}</h3>
                      <p className="text-[10px] font-bold text-tsa-gold uppercase tracking-widest mb-3">{proj.event_date || 'Date TBD'}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">{proj.description || 'No description provided.'}</p>
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Core Team (PCT)</p>
                        <p className="text-xs font-bold text-tsa-dark truncate mt-0.5">{proj.pct || '-'}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PERIOD SETTINGS & EXPORT CSV */}
        {activeTab === 'periods' && (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm animate-fade-in-up">
            <div className="flex items-center gap-2 mb-6">
                <CalendarDays size={20} className="text-tsa-green"/>
                <h2 className="text-lg font-black text-tsa-dark">Period Lifecycle Control & Export</h2>
            </div>
            
            <div className="space-y-4">
              {periodsConfig.map(p => (
                <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border border-gray-200 bg-white hover:border-tsa-green transition-all gap-4">
                  <div>
                    <h3 className="font-bold text-tsa-dark text-base">{p.label}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Current Status: <span className={`font-bold uppercase ${p.value === 'ACTIVE' ? 'text-tsa-green' : p.value === 'PUBLISHED' ? 'text-blue-500' : p.value === 'READ_ONLY' ? 'text-amber-500' : 'text-gray-500'}`}>{p.value}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* PERBAIKAN: Menambahkan opsi READ_ONLY */}
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

              {/* END OF TERM SECTION */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border border-yellow-200/50 bg-white shadow-sm transition-all gap-4 mt-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-tsa-gold to-tsa-green"></div>
                  <div className="ml-2">
                    <h3 className="font-bold text-tsa-dark text-base flex items-center gap-2"><Crown size={16} className="text-tsa-gold"/> End of Term</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Status: <span className={`font-bold uppercase ${appSettings.voting_status === 'ACTIVE' ? 'text-tsa-green' : appSettings.voting_status === 'PUBLISHED' ? 'text-blue-500' : appSettings.voting_status === 'READ_ONLY' ? 'text-amber-500' : 'text-gray-500'}`}>{appSettings.voting_status}</span>
                    </p>
                  </div>
                  {/* PERBAIKAN: Menambahkan opsi READ_ONLY */}
                  <select 
                      value={appSettings.voting_status}
                      onChange={(e) => handleUpdatePeriod('voting_status', e.target.value)}
                      disabled={savingPeriod}
                      className="bg-white border border-gray-200 text-sm font-bold text-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-tsa-gold shadow-sm"
                  >
                      <option value="LOCKED">🔒 Locked</option>
                      <option value="ACTIVE">🟢 Active</option>
                      <option value="READ_ONLY">👀 Read-Only</option>
                      <option value="PUBLISHED">🏆 Published</option>
                  </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ORGANIZATION ASSETS */}
        {activeTab === 'assets' && (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm animate-fade-in-up">
            <div className="flex items-center gap-2 mb-2">
                <ImagePlus size={20} className="text-tsa-green"/>
                <h2 className="text-lg font-black text-tsa-dark">Organization Assets</h2>
            </div>
            <p className="text-sm text-gray-500 mb-8">Upload department photos to be displayed on the Dashboard Awards.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assetsList.map((asset) => (
                <div key={asset.entity_name} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:border-tsa-green transition-all">
                  
                  <div className="aspect-video bg-gray-100 relative group flex items-center justify-center">
                    {asset.photo_url ? (
                      <img src={asset.photo_url} alt={asset.entity_name} className="w-full h-full object-cover" />
                    ) : (
                      <ImagePlus size={40} className="text-gray-300" />
                    )}
                    
                    <div className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center transition-opacity ${uploadingAsset === asset.entity_name ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {uploadingAsset === asset.entity_name ? (
                        <Loader2 className="animate-spin text-white" size={30} />
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-2 text-white">
                          <UploadCloud size={30} />
                          <span className="text-xs font-bold tracking-widest uppercase">Upload Photo</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleAssetUpload(e, asset.entity_name)}
                            disabled={uploadingAsset !== null}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-tsa-dark">{asset.entity_name}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{asset.entity_type}</p>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: EVALUATION TRACKER */}
        {activeTab === 'tracker' && (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm animate-fade-in-up">
             <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <Activity size={20} className="text-tsa-green"/>
                    <h2 className="text-lg font-black text-tsa-dark">Live Evaluation Progress</h2>
                </div>
                <p className="text-sm text-gray-500">Track officer participation during <span className="font-bold text-tsa-green">{activeTrackerName || 'active'}</span> periods.</p>
             </div>

             {trackerLoading ? (
               <div className="flex justify-center py-20"><Loader2 className="animate-spin text-tsa-green" size={32} /></div>
             ) : !activeTrackerName ? (
               <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
                 <Clock size={40} className="text-gray-300 mx-auto mb-3" />
                 <p className="text-sm font-bold text-gray-400">No active Quarter or End of Term periods at the moment.</p>
               </div>
             ) : (
               <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-gray-50 border-b border-gray-100">
                     <tr>
                       <th className="p-4 font-bold text-tsa-green text-xs uppercase">Target Name</th>
                       <th className="p-4 font-bold text-tsa-green text-xs uppercase">Status</th>
                       <th className="p-4 font-bold text-tsa-green text-xs uppercase">Detail</th>
                       <th className="p-4 font-bold text-tsa-green text-xs uppercase text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {trackerData.map(user => (
                       <tr key={user.id} className="hover:bg-gray-50/50">
                         <td className="p-4">
                           <div className="font-bold text-tsa-dark">{user.full_name}</div>
                           <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{user.position} • {user.dept}</div>
                         </td>
                         <td className="p-4">
                           {user.status === 'PENDING' ? (
                             <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider border border-red-100">
                               <AlertTriangle size={12} /> Pending
                             </span>
                           ) : (
                             <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                               <CheckCircle2 size={12} /> Completed
                             </span>
                           )}
                         </td>
                         <td className="p-4 text-xs font-medium text-gray-500">
                           {user.detail}
                         </td>
                         <td className="p-4 text-right">
                           {user.status === 'PENDING' && (
                             <button 
                               onClick={() => handleCopyReminder(user.full_name, activeTrackerName)}
                               className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-xs font-bold"
                             >
                               <Copy size={14} /> Remind
                             </button>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminPanel;