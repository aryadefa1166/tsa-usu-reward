import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { calculateQuarterlyResults } from '../utils/calculator';
import { BarChart2, TrendingUp, Users, Loader2, CalendarDays, ChevronRight, ArrowLeft, LayoutList, Lock, Crown, Trophy, Activity } from 'lucide-react';

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

  useEffect(() => {
    if (publishedQuarters.length > 0 && !activeQuarter) {
      setActiveQuarter(publishedQuarters[0]);
    }
  }, [publishedQuarters, activeQuarter]);

  useEffect(() => { 
    fetchStaffList(); 
  }, []);

  // Tarik metrik agregasi saat data staf dan kuartal siap
  useEffect(() => {
    if (activeQuarter && Object.keys(groupedStaff).length > 0) {
      fetchAnalytics(activeQuarter);
    }
  }, [activeQuarter, groupedStaff]);

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

      // Kumpulkan ID Staf yang ada di bawah wewenang Manajer
      const myStaffList = [];
      Object.values(groupedStaff).forEach(divObj => {
        Object.values(divObj).forEach(arr => myStaffList.push(...arr));
      });
      const myStaffIds = myStaffList.map(s => s.id);

      // Filter Skor Mutlak
      const myScores = result.allScores.filter(s => myStaffIds.includes(s.id));
      if (myScores.length === 0) {
        setAnalytics(null); return;
      }

      // 1. Hitung Rata-rata Tim
      const avgMvp = myScores.reduce((acc, curr) => acc + (curr.theUltimateMVP || 0), 0) / myScores.length;
      const avgAtt = myScores.reduce((acc, curr) => acc + (curr.attendanceScore || 0), 0) / myScores.length;

      // 2. Hitung Peringkat Hierarki (Leaderboard)
      let leaderboard = [];
      let unitLabel = '';

      if (currentUser.role <= 2) {
        unitLabel = 'Department';
        const deptMap = {};
        myScores.forEach(s => {
          if (!deptMap[s.dept]) deptMap[s.dept] = { total: 0, count: 0 };
          deptMap[s.dept].total += s.theUltimateMVP || 0;
          deptMap[s.dept].count += 1;
        });
        leaderboard = Object.keys(deptMap).map(d => ({ name: d, score: deptMap[d].total / deptMap[d].count }));
      } else if (currentUser.role === 3) {
        unitLabel = 'Division';
        const divMap = {};
        myScores.forEach(s => {
          const div = s.division && s.division !== '-' ? s.division : 'General';
          if (!divMap[div]) divMap[div] = { total: 0, count: 0 };
          divMap[div].total += s.theUltimateMVP || 0;
          divMap[div].count += 1;
        });
        leaderboard = Object.keys(divMap).map(d => ({ name: d, score: divMap[d].total / divMap[d].count }));
      } else {
        unitLabel = 'Staff';
        leaderboard = myScores.map(s => ({ name: s.full_name, score: s.theUltimateMVP || 0 }));
      }

      leaderboard.sort((a, b) => b.score - a.score);
      const topUnit = leaderboard.length > 0 ? leaderboard[0] : null;

      // 3. Hitung Radar Kualitatif Tim
      const { data: assessData } = await supabase
          .from('assessments')
          .select('attitude, discipline, active, agility, cheerful')
          .in('target_id', myStaffIds)
          .eq('quarter', quarter);

      let traits = { attitude: 0, discipline: 0, active: 0, agility: 0, cheerful: 0 };
      if (assessData && assessData.length > 0) {
          assessData.forEach(item => {
            traits.attitude += item.attitude; traits.discipline += item.discipline;
            traits.active += item.active; traits.agility += item.agility; traits.cheerful += item.cheerful;
          });
          const count = assessData.length;
          traits.attitude /= count; traits.discipline /= count;
          traits.active /= count; traits.agility /= count; traits.cheerful /= count;
      }

      setAnalytics({ avgMvp, avgAtt, topUnit, unitLabel, leaderboard, traits });

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
            {/* BARIS 1: 3 EXECUTIVE HIGHLIGHTS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Team MVP */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center border border-yellow-100 shrink-0">
                  <Crown size={20} className="text-tsa-gold" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Team Avg. MVP</p>
                  <div className="text-2xl font-black text-tsa-dark">{analytics.avgMvp.toFixed(1)}</div>
                </div>
              </div>

              {/* Card 2: Team Attendance */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
                  <Users size={20} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Avg. Attendance</p>
                  <div className="text-2xl font-black text-tsa-dark">{analytics.avgAtt.toFixed(1)}%</div>
                </div>
              </div>

              {/* Card 3: Top Unit */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-[0.03] text-tsa-green"><Trophy size={80} /></div>
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center border border-green-100 shrink-0 relative z-10">
                  <Trophy size={20} className="text-tsa-green" />
                </div>
                <div className="relative z-10 overflow-hidden">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Top {analytics.unitLabel}</p>
                  <div className="text-lg font-black text-tsa-dark truncate leading-tight">{analytics.topUnit ? analytics.topUnit.name : '-'}</div>
                </div>
              </div>
            </div>

            {/* BARIS 2: LEADERBOARD & QUALITATIVE RADAR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Leaderboard */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-base font-black text-tsa-dark mb-6 flex items-center gap-2">
                  <BarChart2 size={18} className="text-tsa-green" /> {analytics.unitLabel} Leaderboard
                </h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 hide-scrollbar">
                  {analytics.leaderboard.map((item, idx) => (
                    <div key={item.name}>
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="text-xs font-bold text-gray-700 truncate max-w-[70%]">
                           <span className="text-gray-400 mr-2">#{idx+1}</span>{item.name}
                        </span>
                        <span className="text-xs font-black text-tsa-dark">{item.score.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-gray-50 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${idx === 0 ? 'bg-tsa-gold' : 'bg-gray-300'}`}
                          style={{ width: `${item.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trait Radar */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-base font-black text-tsa-dark mb-6 flex items-center gap-2">
                  <TrendingUp size={18} className="text-tsa-green" /> Team Trait Radar
                </h3>
                <ScoreBar label="Attitude" score={analytics.traits.attitude} colorClass="from-blue-400 to-blue-600" />
                <ScoreBar label="Discipline" score={analytics.traits.discipline} colorClass="from-emerald-400 to-emerald-600" />
                <ScoreBar label="Active" score={analytics.traits.active} colorClass="from-red-400 to-red-600" />
                <ScoreBar label="Agility" score={analytics.traits.agility} colorClass="from-amber-400 to-amber-600" />
                <ScoreBar label="Cheerful" score={analytics.traits.cheerful} colorClass="from-purple-400 to-purple-600" />
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