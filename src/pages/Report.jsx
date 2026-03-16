import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { calculateQuarterlyResults } from '../utils/calculator';
import { BarChart2, TrendingUp, Users, Loader2, CalendarDays, ChevronRight, ArrowLeft, LayoutList } from 'lucide-react';

// ==========================================
// 1. KOMPONEN VISUAL: PROGRESS BAR (TSA Green)
// ==========================================
const ScoreBar = ({ label, score }) => (
  <div className="mb-5">
    <div className="flex justify-between items-end mb-1.5">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-black text-tsa-dark">{score ? score.toFixed(1) : '0'} <span className="text-gray-300 text-xs">/ 100</span></span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden relative">
      <div 
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-tsa-green transition-all duration-1000 ease-out"
        style={{ width: `${score || 0}%` }}
      ></div>
    </div>
  </div>
);

// ==========================================
// 2. KOMPONEN: PERSONAL REPORT VIEW (LENGKAP Q1-Q4)
// ==========================================
const PersonalReportView = ({ targetUser, onBack }) => {
  const [activeQuarter, setActiveQuarter] = useState('Q1');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  useEffect(() => {
    if (targetUser) fetchMyData(activeQuarter);
  }, [targetUser, activeQuarter]);

  const fetchMyData = async (quarter) => {
    setLoading(true);
    try {
      const result = await calculateQuarterlyResults(quarter);
      
      if (result && result.allScores) {
        const myData = result.allScores.find(u => u.id === targetUser.id);
        
        if (myData) {
          const { data: assessData } = await supabase
            .from('assessments')
            .select('attitude, discipline, active, agility, cheerful')
            .eq('target_id', targetUser.id)
            .eq('quarter', quarter);

          let avgAssess = { attitude: 0, discipline: 0, active: 0, agility: 0, cheerful: 0 };
          if (assessData && assessData.length > 0) {
            assessData.forEach(item => {
              avgAssess.attitude += item.attitude; avgAssess.discipline += item.discipline;
              avgAssess.active += item.active; avgAssess.agility += item.agility; avgAssess.cheerful += item.cheerful;
            });
            const count = assessData.length;
            avgAssess.attitude /= count; avgAssess.discipline /= count;
            avgAssess.active /= count; avgAssess.agility /= count; avgAssess.cheerful /= count;
          }

          setReportData({
            ...avgAssess,
            attendance: myData.attendanceScore || 0,
            mvpScore: myData.theUltimateMVP || 0,
            reliableScore: myData.theReliableOne || 0,
            achieverScore: myData.theHighAchiever || 0,
            sparkScore: myData.theSpark || 0,
          });
        } else {
          setReportData(null); 
        }
      }
    } catch (error) {
      console.error("Error fetching personal report:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-tsa-green transition-colors mb-6">
          <ArrowLeft size={16} /> Back to Directory
        </button>
      )}

      {/* HEADER IDENTITAS */}
      <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center overflow-hidden flex-shrink-0">
               {targetUser.photo_url ? (
                  <img src={targetUser.photo_url} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                  <span className="text-xl font-black text-tsa-green">{targetUser.full_name?.charAt(0) || '?'}</span>
               )}
            </div>
            <div>
               <h2 className="text-xl font-black text-tsa-dark leading-tight">{targetUser.full_name}</h2>
               <div className="flex gap-2 mt-1">
                 <span className="px-2 py-0.5 bg-green-50 text-tsa-green rounded text-[9px] font-black uppercase tracking-widest border border-green-100">
                   {targetUser.position} • {targetUser.dept}
                 </span>
               </div>
            </div>
         </div>
      </div>

      {/* TAB NAVIGATION Q1-Q4 */}
      <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-6 pb-2">
        {quarters.map((q) => (
          <button
            key={q}
            onClick={() => setActiveQuarter(q)}
            className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              activeQuarter === q
                ? 'bg-tsa-green text-white shadow-md transform scale-105'
                : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-2"><CalendarDays size={14}/> {q}</span>
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-tsa-green" size={40} /></div>
      ) : !reportData ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 border-dashed text-center">
           <BarChart2 size={40} className="text-gray-300 mx-auto mb-4" />
           <h3 className="text-lg font-black text-tsa-dark">No Data Available</h3>
           <p className="text-sm text-gray-500 mt-1">There is no evaluation data recorded for {targetUser.full_name} in {activeQuarter}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* KIRI: QUALITATIVE METRICS */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-tsa-dark mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-tsa-green" /> Qualitative Breakdown
            </h3>
            <ScoreBar label="Attitude (Manners & Ethics)" score={reportData.attitude} />
            <ScoreBar label="Discipline (SOP & Deadlines)" score={reportData.discipline} />
            <ScoreBar label="Active (Initiative & Response)" score={reportData.active} />
            <ScoreBar label="Agility (Execution & Problem Solving)" score={reportData.agility} />
            <ScoreBar label="Cheerful (Positivity & Friendliness)" score={reportData.cheerful} />
          </div>

          {/* KANAN: KUANTITATIF & FINAL SCORE */}
          <div className="space-y-6">
            
            {/* Attendance Card - Clean White Design */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                <Users size={20} className="text-blue-500" />
              </div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Attendance Rate</h3>
              <div className="text-4xl font-black text-tsa-dark mb-2">{reportData.attendance.toFixed(1)}<span className="text-xl text-gray-400">%</span></div>
              <p className="text-[10px] text-gray-400 font-medium">Validated real-field presence.</p>
            </div>

            {/* Final Score MVP Card */}
            <div className="bg-white p-8 rounded-3xl border border-yellow-200/60 shadow-md relative overflow-hidden flex flex-col justify-center items-center text-center">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-tsa-gold to-tsa-green"></div>
              <h3 className="text-[10px] font-black text-tsa-gold uppercase tracking-widest mb-1 mt-2">The Ultimate MVP</h3>
              <p className="text-[10px] text-gray-400 font-medium mb-3">Aggregated Final Score</p>
              <div className="text-4xl font-black text-tsa-dark">{reportData.mvpScore.toFixed(1)}</div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. KOMPONEN: MANAGER VIEW (GROUPED LIST)
// ==========================================

// KONFIGURASI URUTAN MUTLAK (HIERARKI STRUKTURAL)
const DEPT_ORDER = ['BPH', 'ADV', 'ERBD', 'MD', 'STD', 'Other'];
const DIV_ORDER = {
  BPH: ['General'],
  ADV: ['SC', 'MONEV', 'General'],
  ERBD: ['Product Partnership', 'University Network', 'Government Relations', 'Network Relations', 'Alumni & Ext. Outreach', 'General'],
  MD: ['Education', 'Media', 'General'],
  STD: ['Staff Management', 'Talent Management', 'General']
};

const ManagerReportView = ({ currentUser, onSelectUser }) => {
  const [groupedStaff, setGroupedStaff] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStaffList(); }, []);

  const fetchStaffList = async () => {
    setLoading(true);
    try {
      // WAJIB: Hanya tarik Role 5 (Staff / TL) yang aktif
      let query = supabase.from('users').select('*').eq('role', 5).eq('is_active', true);

      // Jika Kadep (Role 3): Hanya lihat staff departemennya
      if (currentUser.role === 3) {
        query = query.eq('dept', currentUser.dept);
      }
      // Jika Kadiv (Role 4): Hanya lihat staff divisinya
      else if (currentUser.role === 4) {
        query = query.eq('dept', currentUser.dept).eq('division', currentUser.division);
      }
      // BPH/ADV (Role 1 & 2) akan melihat semua Role 5 tanpa filter tambahan

      const { data, error } = await query;
      
      if (!error && data) {
        // Logika Pengelompokan Data (Grouping by Dept -> Division)
        const grouped = data.reduce((acc, staff) => {
          const dept = staff.dept || 'Other';
          const div = staff.division && staff.division !== '-' ? staff.division : 'General';
          
          if (!acc[dept]) acc[dept] = {};
          if (!acc[dept][div]) acc[dept][div] = [];
          
          acc[dept][div].push(staff);
          return acc;
        }, {});
        
        setGroupedStaff(grouped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Pengurutan Ganda (Cohort Tertua -> Alfabetis Nama)
  const sortStaff = (a, b) => {
    const getCohortNum = (cohortStr) => {
      const num = parseInt((cohortStr || '').replace(/\D/g, ''));
      return isNaN(num) ? 999 : num; // Jika tidak ada angka, taruh paling bawah
    };

    const cohortA = getCohortNum(a.cohort);
    const cohortB = getCohortNum(b.cohort);

    if (cohortA !== cohortB) {
      return cohortA - cohortB; // Angka lebih kecil (senior) diurutkan lebih dulu
    }
    // Jika angkatannya sama, urutkan berdasarkan abjad A-Z
    return (a.full_name || '').localeCompare(b.full_name || '');
  };

  // Helper untuk mendapatkan urutan divisi
  const getDivWeight = (dept, div) => {
    const order = DIV_ORDER[dept] || [];
    const index = order.indexOf(div);
    return index !== -1 ? index : 999;
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-xl font-black text-tsa-dark flex items-center gap-2">
           <LayoutList size={20} className="text-tsa-green" /> Staff Directory
        </h2>
        <p className="text-sm text-gray-500 mt-1">Select a staff member to view their detailed performance report.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-tsa-green" size={40} /></div>
      ) : Object.keys(groupedStaff).length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center">
          <Users size={40} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-black text-gray-500">No staff found.</h3>
        </div>
      ) : (
        <div className="space-y-10">
          {/* URUTAN MUTLAK DEPARTEMEN */}
          {DEPT_ORDER.filter(dept => groupedStaff[dept]).map((dept) => (
            <div key={dept} className="animate-fade-in-up">
              {/* Header Departemen */}
              <div className="flex items-center gap-3 mb-4 pl-2">
                <div className="h-6 w-1.5 bg-tsa-green rounded-full"></div>
                <h3 className="text-lg font-black text-tsa-dark uppercase tracking-widest">{dept} Department</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* URUTAN MUTLAK DIVISI */}
                {Object.keys(groupedStaff[dept])
                  .sort((a, b) => getDivWeight(dept, a) - getDivWeight(dept, b))
                  .map((div) => (
                  <div key={div} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
                    {/* Header Divisi */}
                    <div className="bg-gray-50/50 border-b border-gray-100 px-5 py-3">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {div === 'General' ? 'Staff' : `${div} Division`}
                      </span>
                    </div>
                    
                    {/* URUTAN GANDA STAFF (COHORT -> ALFABETIS) */}
                    <div className="divide-y divide-gray-50 flex-grow">
                      {[...groupedStaff[dept][div]].sort(sortStaff).map((staff) => (
                        <div 
                          key={staff.id} 
                          onClick={() => onSelectUser(staff)}
                          className="p-4 flex items-center justify-between hover:bg-green-50/30 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                              {staff.photo_url ? (
                                <img src={staff.photo_url} alt="pic" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-black text-tsa-green">{staff.full_name?.charAt(0) || '?'}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-tsa-dark group-hover:text-tsa-green transition-colors line-clamp-1">{staff.full_name}</div>
                              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                {staff.position} • {staff.cohort}
                              </div>
                            </div>
                          </div>
                          
                          <button className="p-1.5 text-gray-300 group-hover:text-tsa-green transition-colors flex-shrink-0">
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. MAIN ROUTER COMPONENT
// ==========================================
const Report = () => {
  const { user } = useAuth();
  
  // State navigasi: null = Tampilan Manager, berisi Objek User = Tampilan Personal
  const [selectedUser, setSelectedUser] = useState(null);

  // Set initial view berdasarkan Role
  useEffect(() => {
    if (user && user.role === 5) {
      // Jika Staff biasa (Role 5), langsung tembak ke rapor pribadinya
      setSelectedUser(user);
    }
  }, [user]);

  if (!user) return null;

  const isManager = user.role >= 1 && user.role <= 4;
  const isViewingPersonal = selectedUser !== null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-6 mt-8">
        
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-tsa-dark tracking-tight flex items-center gap-3">
            <BarChart2 size={32} className="text-tsa-green" /> 
            {isViewingPersonal ? (user.role === 5 ? 'My Report Card' : 'Performance Report') : 'Manager Report'}
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            {isViewingPersonal ? 'Detailed quarterly assessment and attendance analysis.' : 'Monitor and analyze your team\'s performance metrics.'}
          </p>
        </div>

        {/* ROUTING VIEW */}
        {isViewingPersonal ? (
          <PersonalReportView 
            targetUser={selectedUser} 
            onBack={isManager ? () => setSelectedUser(null) : null} // Tombol Back hanya muncul untuk Manager
          />
        ) : (
          <ManagerReportView 
            currentUser={user} 
            onSelectUser={(u) => setSelectedUser(u)} 
          />
        )}

      </main>
    </div>
  );
};

export default Report;