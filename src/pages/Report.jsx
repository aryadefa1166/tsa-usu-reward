import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { calculateQuarterlyResults } from '../utils/calculator';
import { BarChart2, TrendingUp, Users, Loader2, CalendarDays, ChevronRight, ArrowLeft } from 'lucide-react';

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
      // Kita pakai mesin kalkulator yang sama dengan Dashboard agar nilainya 100% sinkron
      const result = await calculateQuarterlyResults(quarter);
      
      if (result && result.allScores) {
        // Cari data spesifik milik user ini
        const myData = result.allScores.find(u => u.id === targetUser.id);
        
        if (myData) {
          // Tarik data kualitatif mentah dari database untuk progress bar
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
          setReportData(null); // Data tidak ditemukan / belum dinilai
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
          <ArrowLeft size={16} /> Back to Manager View
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
// 3. KOMPONEN: MANAGER VIEW (TABEL BAWAHAN)
// ==========================================
const ManagerReportView = ({ currentUser, onSelectUser }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTeam(); }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      let query = supabase.from('users').select('*').eq('is_active', true).order('full_name', { ascending: true });

      // LOGIKA PEMBATASAN AKSES:
      // Jika BPH/ADV/Admin (Role 1 & 2): Bebas lihat semua, kecuali Admin & diri sendiri
      if (currentUser.role === 1 || currentUser.role === 2) {
        query = query.neq('role', 1).neq('id', currentUser.id);
      } 
      // Jika Kadep (Role 3): Hanya lihat departemennya
      else if (currentUser.role === 3) {
        query = query.eq('dept', currentUser.dept).neq('id', currentUser.id);
      }
      // Jika Kadiv (Role 4): Hanya lihat divisinya
      else if (currentUser.role === 4) {
        query = query.eq('dept', currentUser.dept).eq('division', currentUser.division).neq('id', currentUser.id);
      }

      const { data, error } = await query;
      if (!error && data) setTeamMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <h2 className="text-xl font-black text-tsa-dark">Team Members</h2>
        <p className="text-sm text-gray-500 mt-1">Select a member to view their detailed performance report.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-tsa-green" size={40} /></div>
      ) : teamMembers.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center">
          <Users size={40} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-black text-gray-500">No team members found.</h3>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-5 font-bold text-tsa-green text-xs uppercase">Profile</th>
                <th className="p-5 font-bold text-tsa-green text-xs uppercase hidden md:table-cell">Position</th>
                <th className="p-5 font-bold text-tsa-green text-xs uppercase hidden sm:table-cell">Cohort</th>
                <th className="p-5 font-bold text-tsa-green text-xs uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer group" onClick={() => onSelectUser(member)}>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                        {member.photo_url ? (
                          <img src={member.photo_url} alt="pic" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-tsa-green">{member.full_name?.charAt(0) || '?'}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-tsa-dark group-hover:text-tsa-green transition-colors">{member.full_name}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider md:hidden">{member.position} • {member.dept}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 hidden md:table-cell">
                    <span className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200">
                      {member.position} • {member.dept}
                    </span>
                  </td>
                  <td className="p-5 hidden sm:table-cell text-gray-500 font-medium text-xs">{member.cohort}</td>
                  <td className="p-5 text-right">
                    <button className="p-2 bg-green-50 text-tsa-green rounded-xl group-hover:bg-tsa-green group-hover:text-white transition-all shadow-sm">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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