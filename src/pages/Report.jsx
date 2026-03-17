import { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { calculateQuarterlyResults } from '../utils/calculator';
import { BarChart2, TrendingUp, Users, Loader2, CalendarDays, ChevronRight, ArrowLeft, Lock, Crown, Activity, Navigation, FolderTree, Globe } from 'lucide-react';

// ==========================================
// 1. KOMPONEN VISUAL: PROGRESS BAR (TSA Green)
// ==========================================
const ScoreBar = ({ label, score, colorClass = "from-emerald-400 to-tsa-green" }) => (
  <div className="mb-5">
    <div className="flex justify-between items-end mb-1.5">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-black text-tsa-dark">{score ? score.toFixed(1) : '0'} <span className="text-gray-300 text-xs">/ 100</span></span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden relative">
      <div 
        className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out`}
        style={{ width: `${score || 0}%` }}
      ></div>
    </div>
  </div>
);

// ==========================================
// 2. KOMPONEN: PERSONAL REPORT VIEW (DINAMIS Q1-Q4)
// ==========================================
const PersonalReportView = ({ targetUser, onBack, publishedQuarters }) => {
  const [activeQuarter, setActiveQuarter] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    if (publishedQuarters.length > 0 && !activeQuarter) {
      setActiveQuarter(publishedQuarters[0]);
    }
  }, [publishedQuarters, activeQuarter]);

  useEffect(() => {
    if (targetUser && activeQuarter) {
      fetchMyData(activeQuarter);
    }
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
          setReportData({ ...avgAssess, attendance: myData.attendanceScore || 0, mvpScore: myData.theUltimateMVP || 0 });
        } else {
          setReportData(null); 
        }
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  if (publishedQuarters.length === 0) {
    return (
      <div className="animate-fade-in-up">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-tsa-green transition-colors mb-6">
            <ArrowLeft size={16} /> Back to Directory
          </button>
        )}
        <div className="bg-white p-16 rounded-3xl border border-gray-100 border-dashed text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4"><Lock size={24} className="text-gray-400" /></div>
          <h3 className="text-lg font-black text-tsa-dark mb-1">Reports Locked</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">No quarterly reports have been published by the Administrator yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-tsa-green transition-colors mb-6 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
          <ArrowLeft size={16} /> Back to Analytics
        </button>
      )}

      {/* HEADER IDENTITAS */}
      <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
         <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-tsa-gold to-tsa-green"></div>
         <div className="flex items-center gap-4 ml-2">
            <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center overflow-hidden flex-shrink-0">
               {targetUser.photo_url ? <img src={targetUser.photo_url} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-xl font-black text-tsa-green">{targetUser.full_name?.charAt(0) || '?'}</span>}
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

      <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-6 pb-2">
        {publishedQuarters.map((q) => (
          <button key={q} onClick={() => setActiveQuarter(q)} className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeQuarter === q ? 'bg-tsa-green text-white shadow-md transform scale-105' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}>
            <span className="flex items-center gap-2"><CalendarDays size={14}/> {q}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-tsa-green" size={40} /></div>
      ) : !reportData ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 border-dashed text-center">
           <BarChart2 size={40} className="text-gray-300 mx-auto mb-4" />
           <h3 className="text-lg font-black text-tsa-dark">No Data Available</h3>
           <p className="text-sm text-gray-500 mt-1">There is no evaluation data recorded for {targetUser.full_name} in {activeQuarter}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-full">
            <h3 className="text-lg font-black text-tsa-dark mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-tsa-green" /> Qualitative Breakdown</h3>
            <ScoreBar label="Attitude (Manners & Ethics)" score={reportData.attitude} />
            <ScoreBar label="Discipline (SOP & Deadlines)" score={reportData.discipline} />
            <ScoreBar label="Active (Initiative & Response)" score={reportData.active} />
            <ScoreBar label="Agility (Execution & Problem Solving)" score={reportData.agility} />
            <ScoreBar label="Cheerful (Positivity & Friendliness)" score={reportData.cheerful} />
          </div>

          <div className="flex flex-col gap-6 h-full">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-2"><Users size={16} className="text-blue-500" /></div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Attendance Rate</h3>
              <div className="text-3xl font-black text-tsa-dark mb-1">{reportData.attendance.toFixed(1)}<span className="text-lg text-gray-400">%</span></div>
              <p className="text-[9px] text-gray-400 font-medium">Validated real-field presence.</p>
            </div>

            <div className="bg-gradient-to-br from-green-50/50 to-white p-8 flex-grow rounded-3xl border border-green-100 shadow-sm relative overflow-hidden flex flex-col justify-center items-center text-center min-h-[200px]">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-tsa-gold to-tsa-green"></div>
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-tsa-green"><Crown size={120} /></div>
              <h3 className="text-xs font-black text-tsa-green uppercase tracking-widest mb-2 mt-2 relative z-10">The Ultimate MVP</h3>
              <p className="text-[10px] text-gray-400 font-medium mb-3 relative z-10">Aggregated Final Score</p>
              <div className="text-6xl font-black text-tsa-dark tracking-tighter relative z-10">{reportData.mvpScore.toFixed(1)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. KOMPONEN: MANAGER VIEW (DRILL-DOWN ANALYTICS)
// ==========================================
const ManagerReportView = ({ currentUser, onSelectUser, publishedQuarters }) => {
  const [activeQuarter, setActiveQuarter] = useState('');
  const [loading, setLoading] = useState(true);
  const [rawStaffData, setRawStaffData] = useState([]);
  
  // Drill-Down Nav State
  const [viewMode, setViewMode] = useState('hierarchy'); // 'hierarchy' | 'global'
  const [navState, setNavState] = useState({ dept: null, div: null });

  // Inisialisasi Akses Default Berdasarkan Wewenang
  useEffect(() => {
    if (currentUser.role === 3) setNavState({ dept: currentUser.dept, div: null });
    if (currentUser.role === 4) setNavState({ dept: currentUser.dept, div: currentUser.division });
  }, [currentUser]);

  useEffect(() => {
    if (publishedQuarters.length > 0 && !activeQuarter) setActiveQuarter(publishedQuarters[0]);
  }, [publishedQuarters, activeQuarter]);

  useEffect(() => {
    if (activeQuarter) fetchAnalytics(activeQuarter);
  }, [activeQuarter]);

  const fetchAnalytics = async (quarter) => {
    setLoading(true);
    try {
      let query = supabase.from('users').select('*').eq('role', 5).eq('is_active', true);
      if (currentUser.role === 3) query = query.eq('dept', currentUser.dept);
      if (currentUser.role === 4) query = query.eq('dept', currentUser.dept).eq('division', currentUser.division);

      const { data: allowedStaff } = await query;
      if (!allowedStaff || allowedStaff.length === 0) { setRawStaffData([]); return; }
      const staffIds = allowedStaff.map(s => s.id);

      const result = await calculateQuarterlyResults(quarter);
      const scoresMap = {};
      if (result && result.allScores) { result.allScores.forEach(s => { scoresMap[s.id] = s; }); }

      const { data: assessData } = await supabase.from('assessments').select('*').in('target_id', staffIds).eq('quarter', quarter);
      const traitsMap = {};
      assessData?.forEach(a => {
        if (!traitsMap[a.target_id]) traitsMap[a.target_id] = { attitude: 0, discipline: 0, active: 0, agility: 0, cheerful: 0, count: 0 };
        traitsMap[a.target_id].attitude += a.attitude; traitsMap[a.target_id].discipline += a.discipline;
        traitsMap[a.target_id].active += a.active; traitsMap[a.target_id].agility += a.agility; traitsMap[a.target_id].cheerful += a.cheerful;
        traitsMap[a.target_id].count += 1;
      });

      const combined = allowedStaff.map(staff => {
        const sCore = scoresMap[staff.id];
        const tScore = traitsMap[staff.id];
        return {
          ...staff,
          mvp: sCore?.theUltimateMVP || 0,
          attendance: sCore?.attendanceScore || 0,
          traits: tScore ? {
            attitude: tScore.attitude / tScore.count, discipline: tScore.discipline / tScore.count,
            active: tScore.active / tScore.count, agility: tScore.agility / tScore.count, cheerful: tScore.cheerful / tScore.count,
          } : { attitude: 0, discipline: 0, active: 0, agility: 0, cheerful: 0 }
        };
      });

      setRawStaffData(combined);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  // =========================================
  // CORE ENGINE: THE SMART DATA AGGREGATOR
  // =========================================
  const dashboardData = useMemo(() => {
    if (!rawStaffData || rawStaffData.length === 0) return null;

    let activeStaff = rawStaffData;
    let currentScopeName = 'TSA Overall';

    if (viewMode === 'hierarchy') {
      if (navState.div) {
        activeStaff = rawStaffData.filter(s => {
          const sDiv = s.division && s.division !== '-' ? s.division : 'General';
          return s.dept === navState.dept && sDiv === navState.div;
        });
        currentScopeName = navState.div === '-' || navState.div === 'General' ? `${navState.dept} Staff` : `${navState.div} Div`;
      } else if (navState.dept) {
        activeStaff = rawStaffData.filter(s => s.dept === navState.dept);
        currentScopeName = `${navState.dept} Dept`;
      }
    } else {
      currentScopeName = 'Global Staff';
    }

    // Averages
    const avgMvp = activeStaff.length ? activeStaff.reduce((acc, s) => acc + s.mvp, 0) / activeStaff.length : 0;
    const avgAtt = activeStaff.length ? activeStaff.reduce((acc, s) => acc + s.attendance, 0) / activeStaff.length : 0;
    
    const avgTraits = { attitude: 0, discipline: 0, active: 0, agility: 0, cheerful: 0 };
    if (activeStaff.length) {
      activeStaff.forEach(s => {
        avgTraits.attitude += s.traits.attitude; avgTraits.discipline += s.traits.discipline;
        avgTraits.active += s.traits.active; avgTraits.agility += s.traits.agility; avgTraits.cheerful += s.traits.cheerful;
      });
      avgTraits.attitude /= activeStaff.length; avgTraits.discipline /= activeStaff.length;
      avgTraits.active /= activeStaff.length; avgTraits.agility /= activeStaff.length; avgTraits.cheerful /= activeStaff.length;
    }

    // List Building
    let list = [];
    if (viewMode === 'global') {
      list = activeStaff.map(s => ({ type: 'staff', id: s.id, name: s.full_name, score: s.mvp, subtext: `${s.position} • ${s.dept}`, obj: s }));
    } else {
      if (navState.div) {
        list = activeStaff.map(s => ({ type: 'staff', id: s.id, name: s.full_name, score: s.mvp, subtext: s.position, obj: s }));
      } else if (navState.dept) {
        const divGroups = activeStaff.reduce((acc, s) => {
          const d = s.division && s.division !== '-' ? s.division : 'General';
          if (!acc[d]) acc[d] = [];
          acc[d].push(s); return acc;
        }, {});
        list = Object.keys(divGroups).map(d => ({ type: 'div', id: d, name: d, score: divGroups[d].reduce((sum, s) => sum + s.mvp, 0) / divGroups[d].length, subtext: `${divGroups[d].length} Staffs` }));
      } else {
        const deptGroups = activeStaff.reduce((acc, s) => {
          if (!acc[s.dept]) acc[s.dept] = [];
          acc[s.dept].push(s); return acc;
        }, {});
        list = Object.keys(deptGroups).map(d => ({ type: 'dept', id: d, name: d, score: deptGroups[d].reduce((sum, s) => sum + s.mvp, 0) / deptGroups[d].length, subtext: `${deptGroups[d].length} Staffs` }));
      }
    }
    list.sort((a,b) => b.score - a.score);

    return { avgMvp, avgAtt, avgTraits, list, currentScopeName };
  }, [rawStaffData, navState, viewMode]);

  // Click Handlers
  const handleItemClick = (item) => {
    if (item.type === 'dept') setNavState({ dept: item.id, div: null });
    else if (item.type === 'div') setNavState({ ...navState, div: item.id });
    else if (item.type === 'staff') onSelectUser(item.obj);
  };

  if (publishedQuarters.length === 0) {
    return (
      <div className="animate-fade-in-up bg-white p-16 rounded-3xl border border-gray-100 border-dashed text-center shadow-sm">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4"><Lock size={24} className="text-gray-400" /></div>
        <h3 className="text-lg font-black text-tsa-dark mb-1">Reports Locked</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">No quarterly reports have been published yet.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* FILTER KUARTAL */}
      <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-6 pb-2">
        {publishedQuarters.map((q) => (
          <button key={q} onClick={() => setActiveQuarter(q)} className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeQuarter === q ? 'bg-tsa-green text-white shadow-md transform scale-105' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}>
            <span className="flex items-center gap-2"><CalendarDays size={14}/> {q}</span>
          </button>
        ))}
      </div>

      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
           <h2 className="text-xl font-black text-tsa-dark flex items-center gap-2">
              <Activity size={20} className="text-tsa-green" /> Team Analytics Overview
           </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-10 bg-white rounded-3xl border border-gray-100 shadow-sm"><Loader2 className="animate-spin text-tsa-green" size={32} /></div>
        ) : !dashboardData ? (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 border-dashed text-center"><p className="text-sm text-gray-500">No analytics data available.</p></div>
        ) : (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* BARIS 1: HIGHLIGHT CARDS (Berubah sesuai level folder) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50/50 to-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-tsa-gold to-tsa-green"></div>
                <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center border border-yellow-100 shrink-0 ml-2">
                  <Crown size={20} className="text-tsa-gold" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Team Avg. MVP</p>
                  <div className="text-2xl font-black text-tsa-dark leading-none">{dashboardData.avgMvp > 0 ? dashboardData.avgMvp.toFixed(1) : '-'}</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50/30 to-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-400"></div>
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0 ml-2">
                  <Users size={20} className="text-blue-500" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Team Avg. Attendance</p>
                  <div className="text-2xl font-black text-tsa-dark leading-none">{dashboardData.avgAtt > 0 ? `${dashboardData.avgAtt.toFixed(1)}%` : '-'}</div>
                </div>
              </div>
            </div>

            {/* BARIS 2: FOLDER LEADERBOARD & TRAIT RADAR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* LEADERBOARD (DRILL DOWN) */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-tsa-dark flex items-center gap-2">
                    <BarChart2 size={18} className="text-tsa-green" /> Leaderboard
                  </h3>
                  
                  {/* Mode Switcher */}
                  <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-100">
                     <button onClick={() => setViewMode('hierarchy')} className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-all ${viewMode === 'hierarchy' ? 'bg-white text-tsa-green shadow-sm' : 'text-gray-400'}`}>
                        <FolderTree size={12}/> Hierarchy
                     </button>
                     <button onClick={() => setViewMode('global')} className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-all ${viewMode === 'global' ? 'bg-white text-tsa-green shadow-sm' : 'text-gray-400'}`}>
                        <Globe size={12}/> Global
                     </button>
                  </div>
                </div>

                {/* BREADCRUMBS (Hanya di Hierarchy Mode) */}
                {viewMode === 'hierarchy' && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 mb-5 bg-gray-50 px-3 py-2 rounded-xl inline-flex self-start border border-gray-100">
                    {currentUser.role <= 2 && (
                        <button onClick={() => setNavState({dept:null, div:null})} className={`uppercase tracking-widest hover:text-tsa-green transition-colors ${!navState.dept ? 'text-tsa-green' : ''}`}>TSA Overall</button>
                    )}
                    {navState.dept && (
                        <>
                          {currentUser.role <= 2 && <ChevronRight size={14} className="text-gray-300" />}
                          <button onClick={() => setNavState({...navState, div:null})} className={`uppercase tracking-widest hover:text-tsa-green transition-colors ${!navState.div ? 'text-tsa-green' : ''}`} disabled={currentUser.role > 3}>{navState.dept}</button>
                        </>
                    )}
                    {navState.div && (
                        <>
                          <ChevronRight size={14} className="text-gray-300" />
                          <span className="uppercase tracking-widest text-tsa-green">{navState.div}</span>
                        </>
                    )}
                  </div>
                )}

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-3 hide-scrollbar flex-grow">
                  {dashboardData.list.length === 0 ? (
                    <div className="text-center text-xs text-gray-400 font-medium py-10 border border-dashed border-gray-100 rounded-xl">No evaluation data yet.</div>
                  ) : (
                    dashboardData.list.map((item, idx) => (
                      <div 
                        key={item.id}
                        onClick={() => handleItemClick(item)} 
                        className="p-4 rounded-2xl border border-gray-100 bg-white hover:border-tsa-green hover:shadow-sm transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pr-2">
                           <ChevronRight size={14} className="text-tsa-green" />
                        </div>
                        <div className="flex justify-between items-end mb-2 relative z-10">
                          <div className="flex flex-col max-w-[80%]">
                            <span className="text-xs font-bold text-gray-700 truncate group-hover:text-tsa-green transition-colors">
                              <span className="text-gray-300 mr-2 font-black">#{idx+1}</span>{item.name}
                            </span>
                            {item.subtext && <span className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wider truncate font-bold">{item.subtext}</span>}
                          </div>
                          <span className="text-xs font-black text-tsa-dark group-hover:text-tsa-green transition-colors">{item.score > 0 ? item.score.toFixed(1) : '0.0'}</span>
                        </div>
                        <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden relative z-10 max-w-[95%]">
                          <div className={`h-full rounded-full transition-all duration-1000 ${idx === 0 && item.score > 0 ? 'bg-tsa-gold' : 'bg-tsa-green'}`} style={{ width: `${item.score}%` }}></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* TRAIT RADAR PANEL (Merespon Level Folder Aktif) */}
              <div className="bg-gradient-to-br from-green-50/30 to-white p-8 rounded-3xl border border-gray-100 shadow-sm h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.02] text-tsa-green pointer-events-none"><Navigation size={120} /></div>
                
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <h3 className="text-base font-black text-tsa-dark flex items-center gap-2">
                    <TrendingUp size={18} className="text-tsa-green" /> Trait Radar
                  </h3>
                  <span className="text-[9px] px-3 py-1.5 rounded-lg bg-green-50 text-tsa-green font-black uppercase tracking-widest border border-green-100 max-w-[140px] truncate text-right shadow-sm">
                    {dashboardData.currentScopeName}
                  </span>
                </div>

                <div className="relative z-10">
                  <ScoreBar label="Attitude" score={dashboardData.avgTraits.attitude} colorClass="from-blue-400 to-blue-600" />
                  <ScoreBar label="Discipline" score={dashboardData.avgTraits.discipline} colorClass="from-emerald-400 to-emerald-600" />
                  <ScoreBar label="Active" score={dashboardData.avgTraits.active} colorClass="from-red-400 to-red-600" />
                  <ScoreBar label="Agility" score={dashboardData.avgTraits.agility} colorClass="from-amber-400 to-amber-600" />
                  <ScoreBar label="Cheerful" score={dashboardData.avgTraits.cheerful} colorClass="from-purple-400 to-purple-600" />
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 4. MAIN ROUTER COMPONENT
// ==========================================
const Report = () => {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [publishedQuarters, setPublishedQuarters] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
        if (!error && data) {
          const published = [];
          if (data.q1_status === 'PUBLISHED') published.push('Q1');
          if (data.q2_status === 'PUBLISHED') published.push('Q2');
          if (data.q3_status === 'PUBLISHED') published.push('Q3');
          if (data.q4_status === 'PUBLISHED') published.push('Q4');
          setPublishedQuarters(published);
        }
      } catch (err) { console.error(err); } finally { setSettingsLoading(false); }
    };
    fetchSettings();
  }, []);

  useEffect(() => { if (user && user.role === 5) setSelectedUser(user); }, [user]);

  if (!user || settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-10 flex flex-col">
        <Navbar />
        <div className="flex-grow flex justify-center items-center"><Loader2 className="animate-spin text-tsa-green" size={40} /></div>
      </div>
    );
  }

  const isManager = user.role >= 1 && user.role <= 4;
  const isViewingPersonal = selectedUser !== null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 mt-8">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-tsa-dark tracking-tight flex items-center gap-3">
            <BarChart2 size={32} className="text-tsa-green" /> 
            {isViewingPersonal ? (user.role === 5 ? 'My Report Card' : 'Performance Report') : 'Manager Report'}
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            {isViewingPersonal ? 'Detailed quarterly assessment and attendance analysis.' : 'Monitor and analyze your team\'s performance metrics.'}
          </p>
        </div>

        {isViewingPersonal ? (
          <PersonalReportView targetUser={selectedUser} onBack={isManager ? () => setSelectedUser(null) : null} publishedQuarters={publishedQuarters} />
        ) : (
          <ManagerReportView currentUser={user} onSelectUser={(u) => setSelectedUser(u)} publishedQuarters={publishedQuarters} />
        )}
      </main>
    </div>
  );
};

export default Report;