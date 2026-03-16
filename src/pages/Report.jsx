import { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { calculateQuarterlyResults } from '../utils/calculator';
import { BarChart2, TrendingUp, Users, Loader2, CalendarDays, ChevronRight, ArrowLeft, LayoutList, Lock, Crown, Activity, Navigation } from 'lucide-react';

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

          setReportData({
            ...avgAssess,
            attendance: myData.attendanceScore || 0,
            mvpScore: myData.theUltimateMVP || 0,
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

  if (publishedQuarters.length === 0) {
    return (
      <div className="animate-fade-in-up">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-tsa-green transition-colors mb-6">
            <ArrowLeft size={16} /> Back to Directory
          </button>
        )}
        <div className="bg-white p-16 rounded-3xl border border-gray-100 border-dashed text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-black text-tsa-dark mb-1">Reports Locked</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">No quarterly reports have been published by the Administrator yet.</p>
        </div>
      </div>
    );
  }

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

      {/* TAB NAVIGATION */}
      <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-6 pb-2">
        {publishedQuarters.map((q) => (
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* KIRI: QUALITATIVE METRICS */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-full">
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
          <div className="flex flex-col gap-6 h-full">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                <Users size={16} className="text-blue-500" />
              </div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Attendance Rate</h3>
              <div className="text-3xl font-black text-tsa-dark mb-1">{reportData.attendance.toFixed(1)}<span className="text-lg text-gray-400">%</span></div>
              <p className="text-[9px] text-gray-400 font-medium">Validated real-field presence.</p>
            </div>

            <div className="bg-white p-8 flex-grow rounded-3xl border border-yellow-200/60 shadow-md relative overflow-hidden flex flex-col justify-center items-center text-center min-h-[200px]">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-tsa-gold to-tsa-green"></div>
              <h3 className="text-xs font-black text-tsa-gold uppercase tracking-widest mb-2 mt-2">The Ultimate MVP</h3>
              <p className="text-[10px] text-gray-400 font-medium mb-3">Aggregated Final Score</p>
              <div className="text-6xl font-black text-tsa-dark tracking-tighter">{reportData.mvpScore.toFixed(1)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. KOMPONEN: MANAGER VIEW (ANALYTICS & DIRECTORY)
// ==========================================

const DEPT_ORDER = ['BPH', 'ADV', 'ERBD', 'MD', 'STD', 'Other'];
const DIV_ORDER = {
  BPH: ['General'],
  ADV: ['SC', 'MONEV', 'General'],
  ERBD: ['Product Partnership', 'University Network', 'Government Relations', 'Network Relations', 'Alumni & Ext. Outreach', 'General'],
  MD: ['Education', 'Media', 'General'],
  STD: ['Staff Management', 'Talent Management', 'General']
};

const ManagerReportView = ({ currentUser, onSelectUser, publishedQuarters }) => {
  const [activeQuarter, setActiveQuarter] = useState('');
  const [groupedStaff, setGroupedStaff] = useState({});
  const [loadingDir, setLoadingDir] = useState(true);

  // States untuk Analytics Dashboard
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  
  // State untuk Multi-level Tab Leaderboard & Selected Entity (Master-Detail Radar)
  const [leaderboardTab, setLeaderboardTab] = useState('Staff');
  const [availableTabs, setAvailableTabs] = useState([]);
  const [selectedEntityId, setSelectedEntityId] = useState(null);

  useEffect(() => {
    const tabs = [];
    if (currentUser.role <= 2) {
      tabs.push('Department', 'Division', 'Staff');
      setLeaderboardTab('Department');
    } else if (currentUser.role === 3) {
      tabs.push('Division', 'Staff');
      setLeaderboardTab('Division');
    } else {
      tabs.push('Staff');
      setLeaderboardTab('Staff');
    }
    setAvailableTabs(tabs);
  }, [currentUser.role]);

  useEffect(() => {
    if (publishedQuarters.length > 0 && !activeQuarter) {
      setActiveQuarter(publishedQuarters[0]);
    }
  }, [publishedQuarters, activeQuarter]);

  useEffect(() => { 
    fetchStaffList(); 
  }, []);

  useEffect(() => {
    if (activeQuarter && Object.keys(groupedStaff).length > 0) {
      fetchAnalytics(activeQuarter);
    }
  }, [activeQuarter, groupedStaff]);

  // Reset selectedEntityId jika Tab berubah, agar otomatis memilih Rank #1 lagi
  useEffect(() => {
    setSelectedEntityId(null);
  }, [leaderboardTab, activeQuarter]);

  const fetchStaffList = async () => {
    setLoadingDir(true);
    try {
      let query = supabase.from('users').select('*').eq('role', 5).eq('is_active', true);

      if (currentUser.role === 3) query = query.eq('dept', currentUser.dept);
      else if (currentUser.role === 4) query = query.eq('dept', currentUser.dept).eq('division', currentUser.division);

      const { data, error } = await query;
      
      if (!error && data) {
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
      setLoadingDir(false);
    }
  };

  const fetchAnalytics = async (quarter) => {
    setMetricsLoading(true);
    try {
      const result = await calculateQuarterlyResults(quarter);
      if (!result || !result.allScores) {
        setAnalytics(null);
        return;
      }

      const myStaffList = [];
      Object.values(groupedStaff).forEach(divObj => {
        Object.values(divObj).forEach(arr => myStaffList.push(...arr));
      });
      const myStaffIds = myStaffList.map(s => s.id);

      const myScores = result.allScores.filter(s => myStaffIds.includes(s.id));
      if (myScores.length === 0) {
        setAnalytics(null); return;
      }

      // 1. Rata-rata Skor Global Tim (Highlight Cards)
      const avgMvp = myScores.reduce((acc, curr) => acc + (curr.theUltimateMVP || 0), 0) / myScores.length;
      const avgAtt = myScores.reduce((acc, curr) => acc + (curr.attendanceScore || 0), 0) / myScores.length;

      // 2. Agregasi Multi-Level Leaderboard & Pemetaan Relasi Staf (Untuk sinkronisasi Radar)
      const deptMap = {};
      const divMap = {};
      const staffLeaderboard = [];
      const entityToStaffIds = {
        Department: {},
        Division: {},
        Staff: {}
      };

      myScores.forEach(s => {
        const score = s.theUltimateMVP || 0;
        
        // --- STAFF LEVEL ---
        staffLeaderboard.push({ id: s.id, name: s.full_name, score: score, subtext: `${s.position} • ${s.dept}` });
        entityToStaffIds.Staff[s.id] = [s.id]; // Staf hanya mewakili dirinya sendiri

        // --- DEPT LEVEL ---
        if (!deptMap[s.dept]) {
          deptMap[s.dept] = { total: 0, count: 0 };
          entityToStaffIds.Department[s.dept] = [];
        }
        deptMap[s.dept].total += score;
        deptMap[s.dept].count += 1;
        entityToStaffIds.Department[s.dept].push(s.id); // Kumpulkan ID staf di dept ini

        // --- DIV LEVEL ---
        const divName = s.division && s.division !== '-' ? s.division : 'General';
        const fullDivName = currentUser.role <= 2 ? `${s.dept} - ${divName}` : divName;
        if (!divMap[fullDivName]) {
          divMap[fullDivName] = { total: 0, count: 0 };
          entityToStaffIds.Division[fullDivName] = [];
        }
        divMap[fullDivName].total += score;
        divMap[fullDivName].count += 1;
        entityToStaffIds.Division[fullDivName].push(s.id); // Kumpulkan ID staf di div ini
      });

      const deptLeaderboard = Object.keys(deptMap).map(d => ({ id: d, name: d, score: deptMap[d].total / deptMap[d].count })).sort((a,b) => b.score - a.score);
      const divLeaderboard = Object.keys(divMap).map(d => ({ id: d, name: d, score: divMap[d].total / divMap[d].count })).sort((a,b) => b.score - a.score);
      staffLeaderboard.sort((a,b) => b.score - a.score);

      const leaderboardsData = {
        Department: deptLeaderboard,
        Division: divLeaderboard,
        Staff: staffLeaderboard
      };

      // 3. Tarik SELURUH data kualitatif staf (di-cache untuk Radar dinamis)
      const { data: assessData } = await supabase
          .from('assessments')
          .select('target_id, attitude, discipline, active, agility, cheerful')
          .in('target_id', myStaffIds)
          .eq('quarter', quarter);

      setAnalytics({ 
        avgMvp, 
        avgAtt, 
        leaderboards: leaderboardsData, 
        entityToStaffIds, // Relasi: Entitas mana yang berisi staf siapa saja
        assessDataCache: assessData || [] // Cache data nilai bintang untuk di-kalkulasi dinamis
      });

    } catch (error) {
      console.error(error);
    } finally {
      setMetricsLoading(false);
    }
  };

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

  if (publishedQuarters.length === 0) {
    return (
      <div className="animate-fade-in-up">
        <div className="bg-white p-16 rounded-3xl border border-gray-100 border-dashed text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-black text-tsa-dark mb-1">Reports Locked</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">No quarterly reports have been published by the Administrator yet.</p>
        </div>
      </div>
    );
  }

  const currentList = analytics?.leaderboards?.[leaderboardTab] || [];
  
  // Tentukan Entitas mana yang Radarnya sedang di-render
  // Jika manajer belum mengklik apa-apa, otomatis pilih Rank #1 dari list yang sedang terbuka
  const activeEntityId = selectedEntityId || (currentList.length > 0 ? currentList[0].id : null);
  const activeEntityName = currentList.find(i => i.id === activeEntityId)?.name || 'Team';

  // Kalkulasi Radar secara Dinamis berdasarkan `activeEntityId`
  const radarTraits = useMemo(() => {
    if (!analytics || !activeEntityId) return { attitude: 0, discipline: 0, active: 0, agility: 0, cheerful: 0 };
    
    const staffIdsToCalculate = analytics.entityToStaffIds[leaderboardTab][activeEntityId] || [];
    const relevantAssessments = analytics.assessDataCache.filter(a => staffIdsToCalculate.includes(a.target_id));

    let traits = { attitude: 0, discipline: 0, active: 0, agility: 0, cheerful: 0 };
    if (relevantAssessments.length > 0) {
      relevantAssessments.forEach(item => {
        traits.attitude += item.attitude; traits.discipline += item.discipline;
        traits.active += item.active; traits.agility += item.agility; traits.cheerful += item.cheerful;
      });
      const count = relevantAssessments.length;
      traits.attitude /= count; traits.discipline /= count;
      traits.active /= count; traits.agility /= count; traits.cheerful /= count;
    }
    return traits;
  }, [analytics, leaderboardTab, activeEntityId]);

  return (
    <div className="animate-fade-in-up">
      
      {/* FILTER KUARTAL GLOBAL */}
      <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-6 pb-2">
        {publishedQuarters.map((q) => (
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

      {/* SECTION: MANAGERIAL ANALYTICS DASHBOARD */}
      <div className="mb-12">
        <h2 className="text-xl font-black text-tsa-dark flex items-center gap-2 mb-6">
           <Activity size={20} className="text-tsa-green" /> Team Analytics Overview
        </h2>

        {metricsLoading ? (
          <div className="flex justify-center py-10 bg-white rounded-3xl border border-gray-100 shadow-sm"><Loader2 className="animate-spin text-tsa-green" size={32} /></div>
        ) : !analytics ? (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 border-dashed text-center">
            <p className="text-sm text-gray-500">No analytics data available for your team in this quarter.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* PERBAIKAN: BARIS 1 (2 KARTU 50:50) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center border border-yellow-100 shrink-0">
                  <Crown size={20} className="text-tsa-gold" />
                </div>
                <div>
                  {/* PERBAIKAN: Teks diubah menjadi Team Avg. MVP */}
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Team Avg. MVP</p>
                  <div className="text-2xl font-black text-tsa-dark">{analytics.avgMvp > 0 ? analytics.avgMvp.toFixed(1) : '-'}</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
                  <Users size={20} className="text-blue-500" />
                </div>
                <div>
                  {/* PERBAIKAN: Teks diubah menjadi Team Avg. Attendance */}
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Team Avg. Attendance</p>
                  <div className="text-2xl font-black text-tsa-dark">{analytics.avgAtt > 0 ? `${analytics.avgAtt.toFixed(1)}%` : '-'}</div>
                </div>
              </div>
            </div>

            {/* BARIS 2: MULTI-LEVEL LEADERBOARD & INTERACTIVE RADAR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* LEADERBOARD PANEL */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-tsa-dark flex items-center gap-2">
                    <BarChart2 size={18} className="text-tsa-green" /> Leaderboard
                  </h3>
                </div>

                {/* Smart Tabs */}
                {availableTabs.length > 1 && (
                  <div className="flex gap-2 mb-5 border-b border-gray-100 pb-3 overflow-x-auto hide-scrollbar">
                    {availableTabs.map(tab => (
                      <button 
                        key={tab} 
                        onClick={() => setLeaderboardTab(tab)} 
                        className={`text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest transition-all whitespace-nowrap ${leaderboardTab === tab ? 'bg-green-50 text-tsa-green border border-green-100' : 'bg-white text-gray-400 hover:bg-gray-50 border border-transparent'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-3 hide-scrollbar flex-grow">
                  {currentList.length === 0 ? (
                    <div className="text-center text-xs text-gray-400 font-medium py-10 border border-dashed border-gray-100 rounded-xl">No evaluation data yet.</div>
                  ) : (
                    currentList.map((item, idx) => (
                      <div 
                        key={item.id}
                        // PERBAIKAN: Fungsi onClick untuk Master-Detail Radar
                        onClick={() => setSelectedEntityId(item.id)} 
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${activeEntityId === item.id ? 'bg-green-50/50 border-green-200' : 'bg-white border-transparent hover:bg-gray-50'}`}
                      >
                        <div className="flex justify-between items-end mb-1.5">
                          <div className="flex flex-col max-w-[80%]">
                            <span className={`text-xs font-bold truncate ${activeEntityId === item.id ? 'text-tsa-green' : 'text-gray-700'}`}>
                              <span className="text-gray-400 mr-2">#{idx+1}</span>{item.name}
                            </span>
                            {item.subtext && leaderboardTab === 'Staff' && (
                              <span className="text-[9px] text-gray-400 ml-6 uppercase tracking-wider truncate">{item.subtext}</span>
                            )}
                          </div>
                          <span className="text-xs font-black text-tsa-dark">{item.score > 0 ? item.score.toFixed(1) : '0.0'}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden ml-6 max-w-[calc(100%-1.5rem)]">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${idx === 0 && item.score > 0 ? 'bg-tsa-gold' : 'bg-tsa-green'}`}
                            style={{ width: `${item.score}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* TRAIT RADAR PANEL (MASTER-DETAIL) */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.02] text-tsa-green pointer-events-none"><Navigation size={120} /></div>
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <h3 className="text-base font-black text-tsa-dark flex items-center gap-2">
                    <TrendingUp size={18} className="text-tsa-green" /> Trait Radar
                  </h3>
                  {/* Label Indikator Entitas Aktif */}
                  <span className="text-[9px] px-2 py-1 rounded bg-green-50 text-tsa-green font-black uppercase tracking-widest border border-green-100 max-w-[120px] truncate text-right">
                    {activeEntityName}
                  </span>
                </div>

                <div className="relative z-10">
                  <ScoreBar label="Attitude" score={radarTraits.attitude} colorClass="from-blue-400 to-blue-600" />
                  <ScoreBar label="Discipline" score={radarTraits.discipline} colorClass="from-emerald-400 to-emerald-600" />
                  <ScoreBar label="Active" score={radarTraits.active} colorClass="from-red-400 to-red-600" />
                  <ScoreBar label="Agility" score={radarTraits.agility} colorClass="from-amber-400 to-amber-600" />
                  <ScoreBar label="Cheerful" score={radarTraits.cheerful} colorClass="from-purple-400 to-purple-600" />
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* SECTION: DIRECTORY (EXISTING) */}
      <div className="pt-8 border-t border-gray-200 border-dashed">
        <div className="mb-6">
          <h2 className="text-xl font-black text-tsa-dark flex items-center gap-2">
            <LayoutList size={20} className="text-tsa-green" /> Staff Directory
          </h2>
          <p className="text-sm text-gray-500 mt-1">Select a staff member to view their detailed individual report.</p>
        </div>

        {loadingDir ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-tsa-green" size={32} /></div>
        ) : Object.keys(groupedStaff).length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center shadow-sm">
            <Users size={40} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-black text-gray-500">No staff found.</h3>
          </div>
        ) : (
          <div className="space-y-10">
            {DEPT_ORDER.filter(dept => groupedStaff[dept]).map((dept) => (
              <div key={dept} className="animate-fade-in-up">
                <div className="flex items-center gap-3 mb-4 pl-2">
                  <div className="h-6 w-1.5 bg-tsa-green rounded-full"></div>
                  <h3 className="text-lg font-black text-tsa-dark uppercase tracking-widest">{dept} Department</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.keys(groupedStaff[dept])
                    .sort((a, b) => getDivWeight(dept, a) - getDivWeight(dept, b))
                    .map((div) => (
                    <div key={div} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
                      <div className="bg-gray-50/50 border-b border-gray-100 px-5 py-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {div === 'General' ? 'Staff' : `${div} Division`}
                        </span>
                      </div>
                      
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
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (user && user.role === 5) {
      setSelectedUser(user);
    }
  }, [user]);

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
            onBack={isManager ? () => setSelectedUser(null) : null}
            publishedQuarters={publishedQuarters} 
          />
        ) : (
          <ManagerReportView 
            currentUser={user} 
            onSelectUser={(u) => setSelectedUser(u)} 
            publishedQuarters={publishedQuarters}
          />
        )}

      </main>
    </div>
  );
};

export default Report;