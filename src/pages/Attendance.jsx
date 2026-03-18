import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Lock, ShieldAlert, Loader2, Save, CheckCircle2, ClipboardCheck, LayoutList, RefreshCw } from 'lucide-react';

// KONFIGURASI URUTAN MUTLAK (HIERARKI STRUKTURAL)
const DEPT_ORDER = ['BPH', 'ADV', 'ERBD', 'MD', 'STD', 'Other'];
const DIV_ORDER = {
  BPH: ['General'],
  ADV: ['SC', 'MONEV', 'General'],
  ERBD: ['Product Partnership', 'University Network', 'Government Relations', 'Network Relations', 'Alumni & Ext. Outreach', 'General'],
  MD: ['Education', 'Media', 'General'],
  STD: ['Staff Management', 'Talent Management', 'General']
};

const Attendance = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Q1');
  
  const [groupedStaff, setGroupedStaff] = useState({});
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
  }, []);

  // Re-fetch data jika tab berubah atau setelah setting didapat
  useEffect(() => {
    if (isSecretary && periodStatus[activeTab]) {
      if (periodStatus[activeTab] === 'LOCKED') {
        setLoading(false); // Tidak perlu fetch jika terkunci mutlak
      } else {
        fetchStaffAndAttendance();
      }
    }
  }, [user, activeTab, periodStatus]);

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
      // 1. Tarik HANYA target yang role-nya 5 (Staff & TL) yang AKTIF
      const { data: staffData, error: staffError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 5)
        .eq('is_active', true);
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
          isExisting: true,
          id: item.id
        };
      });

      // 3. Gabungkan state form & Grouping
      const initialData = {};
      const grouped = staffData.reduce((acc, staff) => {
        // Pemetaan Data Form
        if (existingMap[staff.id]) {
          initialData[staff.id] = existingMap[staff.id];
        } else {
          initialData[staff.id] = { present: '', total: '', isExisting: false, id: null };
        }

        // Pemetaan Grouping
        const dept = staff.dept || 'Other';
        const div = staff.division && staff.division !== '-' ? staff.division : 'General';
        if (!acc[dept]) acc[dept] = {};
        if (!acc[dept][div]) acc[dept][div] = [];
        acc[dept][div].push(staff);
        
        return acc;
      }, {});

      setGroupedStaff(grouped);
      setAttendanceData(initialData);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (staffId, field, value) => {
    if (periodStatus[activeTab] !== 'ACTIVE') return;
    
    // Hanya izinkan input angka atau kosong
    const numValue = value === '' ? '' : parseInt(value);
    if (value !== '' && isNaN(numValue)) return;

    setAttendanceData(prev => ({
      ...prev,
      [staffId]: { 
        ...prev[staffId], 
        [field]: numValue
      }
    }));
  };

  const handleSubmitScore = async (staffId) => {
    const data = attendanceData[staffId];
    
    // Validasi Mutlak
    if (data.present === '' || data.total === '') {
      return alert('Please fill in both columns (Present and Total Events)!');
    }
    if (data.present > data.total) {
      return alert('Logic Error: Total Present cannot be greater than Total Events.');
    }
    if (data.total === 0) {
      return alert('Total Events cannot be zero.');
    }

    setSubmittingId(staffId);
    const payload = {
      target_id: staffId,
      quarter: activeTab,
      total_present: data.present,
      total_events: data.total
    };

    try {
      if (data.isExisting && data.id) {
        // UPDATE JIKA SUDAH ADA
        const { error } = await supabase.from('attendance').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        // INSERT JIKA BARU
        const { data: resData, error } = await supabase.from('attendance').insert(payload).select().single();
        if (error) throw error;
        
        // Update Local State (Anti-Jumping UI)
        setAttendanceData(prev => ({
          ...prev,
          [staffId]: { ...prev[staffId], id: resData.id, isExisting: true }
        }));
      }
    } catch (error) {
      alert("Failed to save record: " + error.message);
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

  // Fungsi Pengurutan Ganda (Cohort -> Abjad)
  const sortStaff = (a, b) => {
    const getCohortNum = (cohortStr) => {
      const num = parseInt((cohortStr || '').replace(/\D/g, ''));
      return isNaN(num) ? 999 : num; 
    };
    const cohortA = getCohortNum(a.cohort);
    const cohortB = getCohortNum(b.cohort);
    if (cohortA !== cohortB) return cohortA - cohortB; 
    return (a.full_name || '').localeCompare(b.full_name || '');
  };

  const getDivWeight = (dept, div) => {
    const order = DIV_ORDER[dept] || [];
    const index = order.indexOf(div);
    return index !== -1 ? index : 999;
  };

  const currentStatus = periodStatus[activeTab];
  const isReadOnly = currentStatus !== 'ACTIVE';

  // Jika bukan sekretaris, blokir UI
  if (!isSecretary && user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 mt-20 flex justify-center">
          <div className="bg-red-50 border border-red-100 rounded-3xl p-10 flex flex-col items-center justify-center text-center max-w-lg shadow-sm">
            <ShieldAlert size={40} className="text-red-400 mb-4" />
            <h2 className="text-xl font-black text-tsa-dark mb-2">Access Denied</h2>
            <p className="text-sm text-gray-500 font-medium">This page is strictly restricted and can only be accessed by the TSA USU Secretary.</p>
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
            Quantitative entry of real-field staff attendance for R.E.W.A.R.D calculation.
          </p>
        </div>

        {/* TAB NAVIGATION KUARTAL (Konsisten Desain TSA Green) */}
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
                    : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50 hover:text-tsa-dark'
                }`}
              >
                {status === 'LOCKED' && <Lock size={14} className={isActive ? 'text-white' : 'text-gray-300'} />}
                {tab}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-32"><Loader2 className="animate-spin text-tsa-green" size={40} /></div>
        ) : currentStatus === 'LOCKED' ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-3xl p-20 flex flex-col items-center justify-center text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6"><Lock size={32} className="text-gray-400" /></div>
            <h2 className="text-2xl font-black text-tsa-dark mb-2 tracking-tight">Period Locked</h2>
            <p className="text-sm text-gray-500 max-w-md">The attendance entry form for <strong>{activeTab}</strong> is currently closed by the Administrator.</p>
          </div>
        ) : Object.keys(groupedStaff).length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-20 flex flex-col items-center justify-center text-center shadow-sm">
            <ShieldAlert size={40} className="text-gray-300 mb-4" />
            <h2 className="text-xl font-black text-gray-500 mb-2">No Active Staff Found</h2>
            <p className="text-sm text-gray-400 max-w-sm">There are currently no active staff members in the database.</p>
          </div>
        ) : (
          <div className="space-y-10 animate-fade-in-up">
            
            {/* Indikator Mode Read Only */}
            {isReadOnly && (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3 text-blue-700 shadow-sm">
                 <ShieldAlert size={20} />
                 <p className="text-sm font-bold">Read-Only Mode: The <strong>{activeTab}</strong> period is closed. You can only view previously recorded attendance data.</p>
              </div>
            )}

            {DEPT_ORDER.filter(dept => groupedStaff[dept]).map((dept) => (
              <section key={dept} className="animate-fade-in-up">
                <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
                  <LayoutList size={20} className="text-tsa-green" />
                  <h2 className="text-lg font-black text-tsa-dark uppercase tracking-widest">{dept} DEPARTMENT</h2>
                </div>
                
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-gray-50 bg-gray-50/50">
                        <tr>
                          <th className="p-4 pl-6 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Staff Profile</th>
                          <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest text-center w-32">Total Present</th>
                          <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest text-center w-32">Total Events</th>
                          <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest text-center w-24">Rate</th>
                          <th className="p-4 pr-6 font-bold text-gray-400 text-[10px] uppercase tracking-widest text-right w-40">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {Object.keys(groupedStaff[dept])
                          .sort((a, b) => getDivWeight(dept, a) - getDivWeight(dept, b))
                          .flatMap(div => {
                             return [...groupedStaff[dept][div]].sort(sortStaff).map(staff => {
                                const data = attendanceData[staff.id];
                                const pct = getPercentage(data.present, data.total);
                                const hasSubmitted = data.isExisting;

                                return (
                                  <tr key={staff.id} className="hover:bg-green-50/30 transition-colors group">
                                    {/* 1. PROFILE */}
                                    <td className="p-4 pl-6">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center">
                                          {staff.photo_url ? (
                                            <img src={staff.photo_url} alt={staff.full_name} className="w-full h-full object-cover" />
                                          ) : (
                                            <span className="font-black text-tsa-green text-xs">{staff.full_name?.charAt(0) || '?'}</span>
                                          )}
                                        </div>
                                        <div>
                                          <div className="font-bold text-tsa-dark text-xs">{staff.full_name}</div>
                                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                            {staff.position} {staff.division !== '-' ? `• ${staff.division}` : ''}
                                          </div>
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
                                        className="w-full text-center py-2 px-1 rounded-xl border border-gray-200 text-sm font-black text-tsa-dark focus:border-tsa-green focus:outline-none focus:ring-1 focus:ring-tsa-green transition-all disabled:bg-gray-50 disabled:text-gray-500"
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
                                        className="w-full text-center py-2 px-1 rounded-xl border border-gray-200 text-sm font-black text-tsa-dark focus:border-tsa-green focus:outline-none focus:ring-1 focus:ring-tsa-green transition-all disabled:bg-gray-50 disabled:text-gray-500"
                                        placeholder="0"
                                      />
                                    </td>

                                    {/* 4. PERCENTAGE BADGE */}
                                    <td className="p-4 text-center">
                                      <span className={`px-2 py-1 rounded-md text-[10px] font-black border inline-block min-w-[3rem] shadow-sm ${getBadgeColor(pct)}`}>
                                        {pct}%
                                      </span>
                                    </td>

                                    {/* 5. SMART ACTION BUTTON */}
                                    <td className="p-4 pr-6 text-right">
                                      {isReadOnly ? (
                                        <button disabled className="w-full bg-gray-100 text-gray-500 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-not-allowed">
                                          <Lock size={14} /> View
                                        </button>
                                      ) : hasSubmitted ? (
                                        <button 
                                          onClick={() => handleSubmitScore(staff.id)}
                                          disabled={submittingId === staff.id}
                                          className="w-full bg-blue-50 text-blue-600 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-1 border border-blue-200 disabled:opacity-70"
                                        >
                                          {submittingId === staff.id ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />} 
                                          Update
                                        </button>
                                      ) : (
                                        <button 
                                          onClick={() => handleSubmitScore(staff.id)}
                                          disabled={submittingId === staff.id}
                                          className="w-full bg-tsa-green text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-sm flex items-center justify-center gap-1 disabled:opacity-70"
                                        >
                                          {submittingId === staff.id ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} 
                                          Save
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                             });
                          })
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Attendance;