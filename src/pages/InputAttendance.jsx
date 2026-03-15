import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { CalendarDays, Save, CheckCircle2, AlertCircle, Lock, Loader2, ShieldAlert } from 'lucide-react';

const InputAttendance = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Q1');
  
  const [usersList, setUsersList] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  // Filter Akses Super Ketat: Hanya Sekretaris atau Admin yang boleh buka form ini
  const isAuthorized = user?.position?.toLowerCase() === 'secretary' || user?.role === 'admin';

  // Simulasi Status Periode (Disinkronkan dengan Admin Center)
  const periodStatus = {
    Q1: 'ACTIVE',
    Q2: 'LOCKED',
    Q3: 'LOCKED',
    Q4: 'LOCKED'
  };

  const tabs = ['Q1', 'Q2', 'Q3', 'Q4'];

  useEffect(() => {
    if (isAuthorized) fetchAllUsers();
  }, [isAuthorized]);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      // Ambil seluruh pengurus kecuali Admin, urutkan presisi
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'admin')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      setUsersList(data || []);

      // Inisialisasi State Form dengan Big O(N) untuk setup, O(1) untuk akses
      const initialData = {};
      data.forEach(u => {
        initialData[u.id] = { total_hadir: '', total_kegiatan: '', isSubmitted: false };
      });
      setAttendanceData(initialData);

    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (userId, field, value) => {
    if (periodStatus[activeTab] !== 'ACTIVE') return;
    
    // Cegah input non-angka atau negatif
    const numericValue = value.replace(/[^0-9]/g, '');
    
    setAttendanceData(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: numericValue }
    }));
  };

  const handleSubmitAttendance = async (userId) => {
    const data = attendanceData[userId];
    const hadir = parseInt(data.total_hadir);
    const kegiatan = parseInt(data.total_kegiatan);
    
    // Validasi Logika Matematika Absolut
    if (!data.total_hadir || !data.total_kegiatan) {
      return alert('Mohon isi Total Hadir dan Total Kegiatan!');
    }
    if (hadir > kegiatan) {
      return alert('Logika Error: Total Hadir tidak boleh lebih besar dari Total Kegiatan!');
    }

    setSubmittingId(userId);
    
    try {
      // LOGIKA DATABASE (Asumsi tabel attendance sudah disiapkan)
      /*
      const percentage = (hadir / kegiatan) * 100;
      const { error } = await supabase.from('attendance').upsert({
        target_id: userId,
        quarter: activeTab,
        total_present: hadir,
        total_events: kegiatan,
        percentage_score: percentage,
        updated_by: user.id,
        updated_at: new Date()
      });
      if (error) throw error;
      */

      // Simulasi eksekusi backend
      await new Promise(resolve => setTimeout(resolve, 800));

      setAttendanceData(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isSubmitted: true }
      }));

    } catch (error) {
      alert("Gagal menyimpan data absensi: " + error.message);
    } finally {
      setSubmittingId(null);
    }
  };

  // Grouping UI berdasarkan Departemen agar Sekretaris mudah mencari nama
  const groupedUsers = usersList.reduce((acc, u) => {
    const dept = u.dept || 'General';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(u);
    return acc;
  }, {});

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 mt-20 flex justify-center">
          <div className="bg-red-50 border border-red-100 rounded-3xl p-10 flex flex-col items-center justify-center text-center max-w-lg">
            <ShieldAlert size={48} className="text-red-500 mb-4" />
            <h2 className="text-xl font-black text-tsa-dark mb-2">Akses Terlarang</h2>
            <p className="text-sm text-gray-500">Halaman ini adalah form metrik kuantitatif eksklusif. Hanya akun dengan jabatan <strong>Secretary</strong> yang diizinkan mengakses halaman ini.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 mt-8">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-tsa-dark tracking-tight flex items-center gap-3">
            <CalendarDays className="text-tsa-green" size={36} />
            Attendance Metrics
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Form input kehadiran absolut. Harap perhatikan akurasi data sebelum menekan tombol Submit.
          </p>
        </div>

        {/* TAB NAVIGATION KUARTAL */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-8 pb-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            const status = periodStatus[tab];
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                  isActive
                    ? 'bg-tsa-green text-white shadow-md transform scale-105'
                    : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
                }`}
              >
                {status === 'LOCKED' && <Lock size={14} className={isActive ? 'text-gray-100' : 'text-gray-300'} />}
                {tab}
              </button>
            );
          })}
        </div>

        {/* AREA KONTEN ABSENSI */}
        {loading ? (
          <div className="flex justify-center items-center py-32">
             <Loader2 className="animate-spin text-tsa-green" size={40} />
          </div>
        ) : periodStatus[activeTab] === 'LOCKED' ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-3xl p-20 flex flex-col items-center justify-center text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Lock size={32} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-black text-tsa-dark mb-2 tracking-tight">Period Locked</h2>
            <p className="text-sm text-gray-500 max-w-md">Input absensi untuk <strong>{activeTab}</strong> saat ini ditutup atau belum dimulai.</p>
          </div>
        ) : (
          <div className="space-y-10 animate-fade-in-up">
            {Object.entries(groupedUsers).map(([deptName, users]) => (
              <section key={deptName} className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                  <h2 className="text-lg font-black text-tsa-dark uppercase tracking-widest">{deptName}</h2>
                  <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full">{users.length} Personnel</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {users.map(u => {
                    const data = attendanceData[u.id];
                    const isReadOnly = periodStatus[activeTab] !== 'ACTIVE' || data?.isSubmitted;
                    
                    // Live Calculation UX
                    const hadir = parseInt(data?.total_hadir) || 0;
                    const kegiatan = parseInt(data?.total_kegiatan) || 0;
                    const percentage = kegiatan > 0 ? ((hadir / kegiatan) * 100).toFixed(1) : 0;
                    let colorClass = 'text-gray-400';
                    if (kegiatan > 0) {
                        if (percentage >= 80) colorClass = 'text-emerald-500';
                        else if (percentage >= 50) colorClass = 'text-amber-500';
                        else colorClass = 'text-red-500';
                    }

                    return (
                      <div key={u.id} className="border border-gray-100 rounded-2xl p-5 hover:border-tsa-green hover:shadow-md transition-all">
                        {/* Header Card */}
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                            {u.photo_url ? (
                                <img src={u.photo_url} alt={u.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full text-tsa-green flex items-center justify-center font-black text-xs">
                                  {u.full_name ? u.full_name.charAt(0) : '?'}
                                </div>
                            )}
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-bold text-tsa-dark text-sm truncate">{u.full_name}</h3>
                            <p className="text-[9px] font-bold text-tsa-green uppercase tracking-widest">{u.position} {u.division !== '-' ? `• ${u.division}` : ''}</p>
                          </div>
                          {/* Live Percentage Indicator */}
                          <div className={`text-sm font-black ${colorClass}`}>
                            {percentage}%
                          </div>
                        </div>

                        {/* Input Fields */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Hadir</label>
                            <input 
                              type="text" 
                              value={data?.total_hadir || ''}
                              onChange={(e) => handleInputChange(u.id, 'total_hadir', e.target.value)}
                              disabled={isReadOnly}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-tsa-dark focus:outline-none focus:border-tsa-green text-center"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Kegiatan</label>
                            <input 
                              type="text" 
                              value={data?.total_kegiatan || ''}
                              onChange={(e) => handleInputChange(u.id, 'total_kegiatan', e.target.value)}
                              disabled={isReadOnly}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-tsa-dark focus:outline-none focus:border-tsa-green text-center"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {/* Submit Action */}
                        {data?.isSubmitted ? (
                          <div className="w-full bg-emerald-50 text-emerald-600 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 border border-emerald-100">
                            <CheckCircle2 size={16} /> Data Terkunci
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleSubmitAttendance(u.id)}
                            disabled={submittingId === u.id || isReadOnly}
                            className="w-full bg-tsa-dark text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                          >
                            {submittingId === u.id ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Simpan Data
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default InputAttendance;