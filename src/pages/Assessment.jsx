import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Star, Lock, CheckCircle2, ShieldAlert, Loader2, Save, RefreshCw, LayoutList } from 'lucide-react';

// --- KOMPONEN BINTANG (STAR RATING) ---
const StarRating = ({ label, value, onChange, readOnly }) => {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 group">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange(star)}
            className={`transition-all duration-200 ${readOnly ? 'cursor-default opacity-80' : 'hover:scale-110'}`}
          >
            <Star 
              size={18} 
              className={star <= value ? "fill-tsa-gold text-tsa-gold" : "fill-gray-100 text-gray-200 group-hover:text-gray-300"} 
            />
          </button>
        ))}
      </div>
    </div>
  );
};

// KONFIGURASI URUTAN MUTLAK (HIERARKI STRUKTURAL)
const DEPT_ORDER = ['BPH', 'ADV', 'ERBD', 'MD', 'STD', 'Other'];
const DIV_ORDER = {
  BPH: ['General'],
  ADV: ['SC', 'MONEV', 'General'],
  ERBD: ['Product Partnership', 'University Network', 'Government Relations', 'Network Relations', 'Alumni & Ext. Outreach', 'General'],
  MD: ['Education', 'Media', 'General'],
  STD: ['Staff Management', 'Talent Management', 'General']
};

// --- KOMPONEN UTAMA ---
const Assessment = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Q1');
  
  const [groupedStaff, setGroupedStaff] = useState({});
  const [assessments, setAssessments] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  const [periodStatus, setPeriodStatus] = useState({
    Q1: 'LOCKED', Q2: 'LOCKED', Q3: 'LOCKED', Q4: 'LOCKED'
  });

  const tabs = ['Q1', 'Q2', 'Q3', 'Q4'];
  
  // SECURITY: Access Control. Hanya BPH, ADV, KADEP (3), KADIV (4) yang bisa menilai
  const isEvaluator = user?.role >= 2 && user?.role <= 4;

  useEffect(() => {
    fetchAdminSettings();
  }, []);

  // Fetch ulang data staff dan nilainya JIKA user ada dan status periode sudah ditarik
  useEffect(() => {
    if (isEvaluator && periodStatus[activeTab]) {
       // Hemat resource: Jika status LOCKED, tidak perlu query data lengkap
       if (periodStatus[activeTab] === 'LOCKED') {
          setLoading(false);
       } else {
          fetchStaffAndAssessments();
       }
    }
  }, [user, activeTab, periodStatus, isEvaluator]);

  const fetchAdminSettings = async () => {
    try {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
      if (!error && data) {
        setPeriodStatus({ Q1: data.q1_status, Q2: data.q2_status, Q3: data.q3_status, Q4: data.q4_status });
      }
    } catch (error) { console.error("Error fetching settings:", error); }
  };

  const fetchStaffAndAssessments = async () => {
    setLoading(true);
    try {
      // 1. Tarik target Staff (Role 5) yang aktif
      let query = supabase.from('users').select('*').eq('role', 5).eq('is_active', true);
      
      // Filter Wewenang
      if (user.role === 3) query = query.eq('dept', user.dept);
      else if (user.role === 4) query = query.eq('dept', user.dept).eq('division', user.division);

      const { data: staffData, error: staffError } = await query;
      if (staffError) throw staffError;

      // 2. Tarik histori nilai (Auto-fill data lama) jika user sudah pernah menilai
      const { data: assessData, error: assessError } = await supabase
        .from('assessments')
        .select('*')
        .eq('evaluator_id', user.id)
        .eq('quarter', activeTab);
      
      if (assessError) throw assessError;

      // 3. Mapping State Bintang & Histori Database
      const initialAssessments = {};
      staffData.forEach(staff => {
        const existingRecord = assessData?.find(a => a.target_id === staff.id);
        if (existingRecord) {
           initialAssessments[staff.id] = {
             id: existingRecord.id, // Simpan ID untuk fungsi UPDATE (Upsert)
             attitude: existingRecord.attitude / 20, // Konversi 100 ke skala 5 bintang
             discipline: existingRecord.discipline / 20,
             active: existingRecord.active / 20,
             agility: existingRecord.agility / 20,
             cheerful: existingRecord.cheerful / 20,
             isExisting: true
           };
        } else {
           initialAssessments[staff.id] = {
             id: null, attitude: 0, discipline: 0, active: 0, agility: 0, cheerful: 0, isExisting: false
           };
        }
      });
      setAssessments(initialAssessments);

      // 4. Grouping Data (Dept -> Div)
      const grouped = staffData.reduce((acc, staff) => {
        const dept = staff.dept || 'Other';
        const div = staff.division && staff.division !== '-' ? staff.division : 'General';
        if (!acc[dept]) acc[dept] = {};
        if (!acc[dept][div]) acc[dept][div] = [];
        acc[dept][div].push(staff);
        return acc;
      }, {});
      
      setGroupedStaff(grouped);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (staffId, indicator, value) => {
    // Blokir interaksi jika bukan ACTIVE
    if (periodStatus[activeTab] !== 'ACTIVE') return;
    
    setAssessments(prev => ({
      ...prev,
      [staffId]: { ...prev[staffId], [indicator]: value }
    }));
  };

  const handleSubmitScore = async (staffId) => {
    const scores = assessments[staffId];
    
    if (!scores.attitude || !scores.discipline || !scores.active || !scores.agility || !scores.cheerful) {
      return alert('Please complete all 5 evaluation indicators (minimum 1 star)!');
    }

    setSubmittingId(staffId);
    
    const payload = {
      evaluator_id: user.id,
      target_id: staffId,
      quarter: activeTab,
      attitude: scores.attitude * 20, 
      discipline: scores.discipline * 20,
      active: scores.active * 20,
      agility: scores.agility * 20,
      cheerful: scores.cheerful * 20
    };

    try {
      if (scores.isExisting && scores.id) {
         // UPDATE DATA LAMA
         const { error } = await supabase.from('assessments').update(payload).eq('id', scores.id);
         if (error) throw error;
      } else {
         // INSERT DATA BARU
         const { data, error } = await supabase.from('assessments').insert(payload).select().single();
         if (error) throw error;
         
         // Update state lokal agar tombol berubah menjadi Update
         setAssessments(prev => ({
            ...prev,
            [staffId]: { ...prev[staffId], id: data.id, isExisting: true }
         }));
      }
    } catch (error) {
      alert("Failed to save score: " + error.message);
    } finally {
      setSubmittingId(null);
      // Re-fetch untuk sinkronisasi mutlak
      fetchStaffAndAssessments();
    }
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

  // PROTEKSI UI: Jika user bukan Evaluator (BPH/ADV/KADEP/KADIV), cegah render UI Form
  if (!isEvaluator && user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 mt-20 flex justify-center">
          <div className="bg-red-50 border border-red-100 rounded-3xl p-10 flex flex-col items-center justify-center text-center max-w-lg shadow-sm">
            <ShieldAlert size={40} className="text-red-400 mb-4" />
            <h2 className="text-xl font-black text-tsa-dark mb-2">Access Denied</h2>
            <p className="text-sm text-gray-500 font-medium">This page is strictly restricted and can only be accessed by Executive Board members (BPH, ADV, Head/Vice of Dept, Head of Div).</p>
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
          <h1 className="text-3xl md:text-4xl font-black text-tsa-dark tracking-tight">Quarterly Assessment</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Evaluate your staff performance based on a 1-5 star scale.
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

        {/* AREA KONTEN PENILAIAN */}
        {loading ? (
          <div className="flex justify-center items-center py-32">
             <Loader2 className="animate-spin text-tsa-green" size={40} />
          </div>
        ) : currentStatus === 'LOCKED' ? (
          /* UI JIKA TERKUNCI MUTLAK */
          <div className="bg-white border border-gray-200 border-dashed rounded-3xl p-20 flex flex-col items-center justify-center text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Lock size={32} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-black text-tsa-dark mb-2 tracking-tight">Period Locked</h2>
            <p className="text-sm text-gray-500 max-w-md">
              The assessment form for <strong>{activeTab}</strong> is currently closed. Evaluation cannot be performed outside the schedule designated by the Administrator.
            </p>
          </div>
        ) : Object.keys(groupedStaff).length === 0 ? (
          /* UI JIKA TIDAK ADA STAFF AKTIF UNTUK DINILAI */
          <div className="bg-white border border-gray-100 rounded-3xl p-20 flex flex-col items-center justify-center text-center shadow-sm">
            <ShieldAlert size={40} className="text-gray-300 mb-4" />
            <h2 className="text-xl font-black text-gray-500 mb-2">No Active Staff Found</h2>
            <p className="text-sm text-gray-400 max-w-sm">
              You currently do not have any active staff members listed in your department/division to evaluate.
            </p>
          </div>
        ) : (
          /* UI DAFTAR CARD STAFF (Bisa Edit / Bisa Read Only Tergantung Status) */
          <div className="space-y-12 animate-fade-in-up">
            
            {/* Indikator Mode Read Only (Jika Published/Closed) */}
            {isReadOnly && (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3 text-blue-700 shadow-sm">
                 <ShieldAlert size={20} />
                 <p className="text-sm font-bold">Read-Only Mode: The <strong>{activeTab}</strong> evaluation period is closed. You can only view previously submitted scores.</p>
              </div>
            )}

            {DEPT_ORDER.filter(dept => groupedStaff[dept]).map((dept) => (
              <section key={dept} className="animate-fade-in-up">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-3">
                  <LayoutList size={20} className="text-tsa-green" />
                  <h2 className="text-lg font-black text-tsa-dark uppercase tracking-widest">{dept} DEPARTMENT</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Object.keys(groupedStaff[dept])
                    .sort((a, b) => getDivWeight(dept, a) - getDivWeight(dept, b))
                    .flatMap(div => {
                       return [...groupedStaff[dept][div]].sort(sortStaff).map(staff => {
                          const scores = assessments[staff.id];
                          const hasSubmitted = scores?.isExisting;

                          return (
                            <div key={staff.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                              
                              {/* Identitas Target */}
                              <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full border border-gray-200 bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                  {staff.photo_url ? (
                                      <img src={staff.photo_url} alt={staff.full_name} className="w-full h-full object-cover" />
                                  ) : (
                                      <span className="font-black text-sm text-tsa-green">{staff.full_name?.charAt(0) || '?'}</span>
                                  )}
                                </div>
                                <div className="overflow-hidden">
                                  <h3 className="font-bold text-tsa-dark text-sm leading-tight truncate">{staff.full_name}</h3>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 truncate">
                                    {staff.position || 'Staff'} {staff.division !== '-' ? `• ${staff.division}` : ''}
                                  </p>
                                </div>
                              </div>

                              {/* Indikator Bintang */}
                              <div className="flex-grow space-y-1 mb-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                                <StarRating label="Attitude" value={scores?.attitude || 0} readOnly={isReadOnly} onChange={(val) => handleScoreChange(staff.id, 'attitude', val)} />
                                <StarRating label="Discipline" value={scores?.discipline || 0} readOnly={isReadOnly} onChange={(val) => handleScoreChange(staff.id, 'discipline', val)} />
                                <StarRating label="Active" value={scores?.active || 0} readOnly={isReadOnly} onChange={(val) => handleScoreChange(staff.id, 'active', val)} />
                                <StarRating label="Agility" value={scores?.agility || 0} readOnly={isReadOnly} onChange={(val) => handleScoreChange(staff.id, 'agility', val)} />
                                <StarRating label="Cheerful" value={scores?.cheerful || 0} readOnly={isReadOnly} onChange={(val) => handleScoreChange(staff.id, 'cheerful', val)} />
                              </div>

                              {/* Tombol Aksi Cerdas (Smart Button) */}
                              <div className="mt-auto">
                                {isReadOnly ? (
                                   // MODE READ ONLY (PUBLISHED / CLOSED)
                                   <button disabled className="w-full bg-gray-100 text-gray-500 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-not-allowed">
                                     <Lock size={16} /> View Only
                                   </button>
                                ) : hasSubmitted ? (
                                   // MODE EDIT (ACTIVE + SUDAH ADA NILAI)
                                   <button 
                                     onClick={() => handleSubmitScore(staff.id)}
                                     disabled={submittingId === staff.id}
                                     className="w-full bg-blue-50 text-blue-600 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-2 border border-blue-200 disabled:opacity-70"
                                   >
                                     {submittingId === staff.id ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                                     Update Score
                                   </button>
                                ) : (
                                   // MODE INSERT BARU (ACTIVE + BELUM ADA NILAI)
                                   <button 
                                     onClick={() => handleSubmitScore(staff.id)}
                                     disabled={submittingId === staff.id}
                                     className="w-full bg-tsa-green text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
                                   >
                                     {submittingId === staff.id ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                     Submit Score
                                   </button>
                                )}
                              </div>
                            </div>
                          );
                       });
                    })
                  }
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Assessment;