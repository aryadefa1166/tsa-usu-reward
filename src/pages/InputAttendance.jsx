import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Lock, ShieldAlert, Loader2, Save, CheckCircle2, ClipboardCheck } from 'lucide-react';

const InputAttendance = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Q1');
  
  const [staffList, setStaffList] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  const [periodStatus, setPeriodStatus] = useState({
    Q1: 'LOCKED', Q2: 'LOCKED', Q3: 'LOCKED', Q4: 'LOCKED'
  });

  const tabs = ['Q1', 'Q2', 'Q3', 'Q4'];
  const isSecretary = user?.role === 2 && user?.position === 'Secretary';

  useEffect(() => {
    fetchAdminSettings();
    if (isSecretary) fetchStaffAndAttendance();
  }, [user, activeTab]); // Re-fetch data jika tab berubah

  const fetchAdminSettings = async () => {
    try {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
      if (!error && data) {
        setPeriodStatus({ Q1: data.q1_status, Q2: data.q2_status, Q3: data.q3_status, Q4: data.q4_status });
      }
    } catch (error) { console.error("Error fetching settings:", error); }
  };

  const fetchStaffAndAttendance = async () => {
    setLoading(true);
    try {
      // 1. Tarik HANYA target yang role-nya 6 (Staff)
      const { data: staffData, error: staffError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 6)
        .order('sort_order', { ascending: true });
      if (staffError) throw staffError;

      // 2. Tarik data absensi yang SUDAH ADA di kuartal aktif
      const { data: existingData, error: attendError } = await supabase
        .from('attendance')
        .select('*')
        .eq('quarter', activeTab);
      if (attendError) throw attendError;

      const existingMap = {};
      existingData.forEach(item => {
        existingMap[item.target_id] = {
          present: item.total_present,
          total: item.total_events,
          isSubmitted: true,
          id: item.id // Simpan ID baris untuk update
        };
      });

      // 3. Gabungkan state form
      const initialData = {};
      staffData.forEach(staff => {
        if (existingMap[staff.id]) {
          initialData[staff.id] = existingMap[staff.id];
        } else {
          initialData[staff.id] = { present: '', total: '', isSubmitted: false, id: null };
        }
      });

      setStaffList(staffData || []);
      setAttendanceData(initialData);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (staffId, field, value) => {
    if (periodStatus[activeTab] !== 'ACTIVE') return;
    
    // Hanya izinkan angka
    const numValue = value === '' ? '' : parseInt(value);
    if (value !== '' && isNaN(numValue)) return;

    setAttendanceData(prev => ({
      ...prev,
      [staffId]: { 
        ...prev[staffId], 
        [field]: numValue,
        isSubmitted: false // Reset status jika diubah
      }
    }));
  };

  const handleSubmitScore = async (staffId) => {
    const data = attendanceData[staffId];
    
    // Validasi Mutlak
    if (data.present === '' || data.total === '') {
      return alert('Mohon isi kedua kolom (Hadir dan Total Kegiatan)!');
    }
    if (data.present > data.total) {
      return alert('Logika Error: Total Hadir tidak boleh lebih besar dari Total Kegiatan.');
    }
    if (data.total === 0) {
      return alert('Total Kegiatan tidak boleh 0.');
    }

    setSubmittingId(staffId);
    try {
      if (data.id) {
        // UPDATE JIKA SUDAH ADA
        const { error } = await supabase.from('attendance')
          .update({ total_present: data.present, total_events: data.total })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        // INSERT JIKA BARU
        const { error } = await supabase.from('attendance').insert({
          target_id: staffId,
          quarter: activeTab,
          total_present: data.present,
          total_events: data.total
        });
        if (error) throw error;
      }

      // Refresh untuk mendapatkan ID baru jika insert
      fetchStaffAndAttendance(); 
    } catch (error) {
      alert("Gagal menyimpan nilai: " + error.message);
    } finally {
      setSubmittingId(null);
    }
  };

  // Helper Persentase
  const getPercentage = (present, total) => {
    if (!total || total === 0 || present === '') return 0;
    return Math.round((present / total) * 100);
  };

  const getBadgeColor = (pct) => {
    if (pct >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (pct >= 50) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  // Grouping Staff Berdasarkan Departemen
  const groupedStaff = staffList.reduce((acc, staff) => {
    const dept = staff.dept || 'General';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(staff);
    return acc;
  }, {});

  // Jika bukan sekretaris, blokir UI
  if (!isSecretary && user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 mt-20 flex justify-center">
          <div className="bg-red-50 border border-red-100 rounded-3xl p-10 flex flex-col items-center justify-center text-center max-w-lg">
            <ShieldAlert size={40} className="text-red-400 mb-4" />
            <h2 className="text-xl font-black text-tsa-dark mb-2">Akses Terbatas</h2>
            <p className="text-sm text-gray-500">Halaman ini hanya dapat diakses secara eksklusif oleh Sekretaris TSA USU.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 mt-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-tsa-dark tracking-tight flex items-center gap-3">
            <ClipboardCheck className="text-tsa-green" size={36} />
            Attendance Record
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Entri data kuantitatif kehadiran riil Staff untuk kalkulasi R.E.W.A.R.D.
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
                  isActive ? 'bg-tsa-dark text-white shadow-md transform scale-105' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
                }`}
              >
                {status !== 'ACTIVE' && <Lock size={14} className={isActive ? 'text-gray-400' : 'text-gray-300'} />}
                {tab}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-32"><Loader2 className="animate-spin text-tsa-green" size={40} /></div>
        ) : periodStatus[activeTab] !== 'ACTIVE' ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-3xl p-20 flex flex-col items-center justify-center text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6"><Lock size={32} className="text-gray-400" /></div>
            <h2 className="text-2xl font-black text-tsa-dark mb-2 tracking-tight">Period Locked</h2>
            <p className="text-sm text-gray-500 max-w-md">Form entri absensi untuk <strong>{activeTab}</strong> saat ini ditutup.</p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center">
            <p className="text-gray-500">Belum ada data Staff di sistem.</p>
          </div>
        ) : (
          <div className="space-y-10 animate-fade-in-up">
            {Object.entries(groupedStaff).map(([deptName, staffs]) => (
              <section key={deptName} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-black text-tsa-dark uppercase tracking-widest">{deptName} DEPARTMENT</h2>
                  <span className="bg-white border border-gray-200 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full">{staffs.length} Staff</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-50 bg-white">
                      <tr>
                        <th className="p-4 pl-6 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Profile</th>
                        <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest text-center w-40">Total Hadir</th>
                        <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest text-center w-40">Total Kegiatan</th>
                        <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest text-center w-24">Rate</th>
                        <th className="p-4 pr-6 font-bold text-gray-400 text-[10px] uppercase tracking-widest text-right w-32">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {staffs.map(staff => {
                        const data = attendanceData[staff.id];
                        const pct = getPercentage(data.present, data.total);
                        const isReadOnly = periodStatus[activeTab] !== 'ACTIVE';

                        return (
                          <tr key={staff.id} className="hover:bg-green-50/20 transition-colors">
                            {/* 1. PROFILE */}
                            <td className="p-4 pl-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden bg-gray-100 flex-shrink-0">
                                  {staff.photo_url ? (
                                    <img src={staff.photo_url} alt={staff.full_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center font-black text-tsa-green text-xs">
                                      {staff.full_name ? staff.full_name.charAt(0) : '?'}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-tsa-dark text-xs">{staff.full_name}</div>
                                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{staff.position} {staff.division !== '-' ? `• ${staff.division}` : ''}</div>
                                </div>
                              </div>
                            </td>

                            {/* 2. INPUT HADIR */}
                            <td className="p-4">
                              <input 
                                type="number" 
                                min="0"
                                value={data.present}
                                onChange={(e) => handleInputChange(staff.id, 'present', e.target.value)}
                                disabled={isReadOnly}
                                className="w-full text-center p-2 rounded-lg border border-gray-200 text-sm font-black text-tsa-dark focus:border-tsa-green focus:outline-none transition-all disabled:bg-gray-50"
                                placeholder="0"
                              />
                            </td>

                            {/* 3. INPUT TOTAL */}
                            <td className="p-4">
                              <input 
                                type="number" 
                                min="1"
                                value={data.total}
                                onChange={(e) => handleInputChange(staff.id, 'total', e.target.value)}
                                disabled={isReadOnly}
                                className="w-full text-center p-2 rounded-lg border border-gray-200 text-sm font-black text-tsa-dark focus:border-tsa-green focus:outline-none transition-all disabled:bg-gray-50"
                                placeholder="0"
                              />
                            </td>

                            {/* 4. PERCENTAGE BADGE */}
                            <td className="p-4 text-center">
                              <span className={`px-2 py-1 rounded text-[10px] font-black border inline-block min-w-[3rem] ${getBadgeColor(pct)}`}>
                                {pct}%
                              </span>
                            </td>

                            {/* 5. ACTION BUTTON */}
                            <td className="p-4 pr-6 text-right">
                              {data.isSubmitted ? (
                                <button className="w-full bg-emerald-50 text-emerald-600 p-2 rounded-lg text-xs font-black border border-emerald-100 cursor-default flex items-center justify-center gap-1">
                                  <CheckCircle2 size={14} /> Saved
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleSubmitScore(staff.id)}
                                  disabled={submittingId === staff.id || isReadOnly}
                                  className="w-full bg-tsa-green text-white p-2 rounded-lg text-xs font-black hover:bg-emerald-800 transition-all shadow-sm flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                  {submittingId === staff.id ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} 
                                  Save
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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