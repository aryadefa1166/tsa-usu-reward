import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { calculateQuarterlyResults, calculateEndOfTermResults } from '../utils/calculator';
import { Trophy, Lock, Zap, Target, ShieldCheck, Crown, Users, Loader2, Star, Sparkles, Building2, Briefcase } from 'lucide-react';

// ==========================================
// KOMPONEN CARD AWARD (KUARTALAN & END OF TERM)
// ==========================================
const AwardCard = ({ title, description, icon: Icon, isPublished, winner, bgClass, iconColor, isGroup, groupPhotoUrl, isEndOfTerm = false }) => {
  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : '?';

  // PERBAIKAN: Jika EOT, gunakan background gradasi hijau tipis. Jika Kuartalan, gunakan putih.
  const cardBackground = isEndOfTerm ? 'bg-gradient-to-br from-green-50/50 to-white' : 'bg-white';

  return (
    <div className={`p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden ${cardBackground} hover:-translate-y-1 transition-all duration-300 flex flex-col h-full`}>
      {/* Aksen Pinggir Khusus Hall of Fame */}
      {isEndOfTerm && <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-tsa-gold to-tsa-green"></div>}

      {/* Watermark Icon */}
      <div className={`absolute top-0 right-0 p-6 opacity-10 ${isEndOfTerm ? 'text-tsa-green' : 'text-gray-300'}`}>
        <Icon size={100} />
      </div>
      
      <div className={`relative z-10 flex flex-col flex-grow ${isEndOfTerm ? 'ml-2' : ''}`}>
        <div className="flex items-center gap-3 mb-2">
          {/* Ikon Card */}
          <div className={`p-2 rounded-xl shadow-sm ${isEndOfTerm ? 'bg-green-50 text-tsa-green' : `bg-white ${iconColor}`}`}>
            <Icon size={20} />
          </div>
          <h3 className="font-black text-lg tracking-tight text-tsa-dark">{title}</h3>
        </div>
        <p className="text-xs font-medium leading-relaxed mb-6 max-w-[90%] text-gray-500">
          {description}
        </p>
        
        <div className="mt-auto pt-4 border-t border-gray-100/70">
          {!isPublished ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-white/50 border-dashed border-gray-300 w-full">
              <Lock size={14} className="text-gray-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">To be announced</p>
            </div>
          ) : !winner ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border w-full bg-gray-50 border-gray-200">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Data Not Available</p>
            </div>
          ) : isGroup ? (
            /* --- RENDER UNTUK BEST DEPARTMENT / PROJECT --- */
            <div>
              <div className="w-full h-32 rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-gray-100 mb-3 relative flex items-center justify-center">
                {groupPhotoUrl || winner.photo_url ? (
                  <img src={groupPhotoUrl || winner.photo_url} alt="Group/Project" className="w-full h-full object-cover" />
                ) : (
                  <Users size={32} className="text-gray-300" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                <p className="absolute bottom-3 left-4 text-white font-black text-lg tracking-widest uppercase shadow-sm pr-4 truncate w-full">
                  {winner.name || `${winner.dept} DEPT`}
                </p>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl border shadow-sm bg-white border-gray-100">
                <span className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-green-50 text-tsa-green border border-green-100">Total Score</span>
                <span className="text-sm font-black text-tsa-dark">{winner.score?.toFixed(1) || winner.finalScore?.toFixed(1)} / 100</span>
              </div>
            </div>
          ) : (
            /* --- RENDER UNTUK INDIVIDU --- */
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full border shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center border-gray-200 bg-gray-100">
                {winner.photo_url ? (
                  <img src={winner.photo_url} alt={winner.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className={`text-lg font-black text-tsa-green`}>{getInitials(winner.full_name)}</span>
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black leading-tight truncate text-tsa-dark">{winner.full_name}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 border border-gray-200">
                    {winner.cohort}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border truncate max-w-[200px] bg-green-50 text-tsa-green border-green-100`}>
                    {winner.position} • {winner.dept}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN DASHBOARD COMPONENT
// ==========================================
const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Q1');
  const [loading, setLoading] = useState(true);
  
  // State Data
  const [periodStatus, setPeriodStatus] = useState({
    Q1: 'LOCKED', Q2: 'LOCKED', Q3: 'LOCKED', Q4: 'LOCKED', 'End of Term': 'LOCKED'
  });
  const [winners, setWinners] = useState(null);
  const [hofWinners, setHofWinners] = useState(null); // Hall of Fame State
  const [deptPhotos, setDeptPhotos] = useState({});

  const tabs = ['Q1', 'Q2', 'Q3', 'Q4', 'End of Term'];

  useEffect(() => {
    fetchAdminSettings();
    fetchOrganizationAssets();
  }, []);

  useEffect(() => {
    fetchWinnersData(activeTab);
  }, [activeTab]);

  const fetchAdminSettings = async () => {
    try {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
      if (!error && data) {
        setPeriodStatus({ Q1: data.q1_status, Q2: data.q2_status, Q3: data.q3_status, Q4: data.q4_status, 'End of Term': data.voting_status });
      }
    } catch (error) { console.error("Error fetching settings:", error); }
  };

  const fetchOrganizationAssets = async () => {
    try {
      const { data, error } = await supabase.from('organization_assets').select('*').eq('entity_type', 'department');
      if (!error && data) {
        const photoMap = {};
        data.forEach(item => photoMap[item.entity_name] = item.photo_url);
        setDeptPhotos(photoMap);
      }
    } catch (error) { console.error("Error fetching dept photos:", error); }
  };

  const fetchWinnersData = async (tabName) => {
    setLoading(true);
    if (tabName === 'End of Term') {
      const result = await calculateEndOfTermResults();
      setHofWinners(result);
    } else {
      const result = await calculateQuarterlyResults(tabName);
      setWinners(result);
    }
    setLoading(false);
  };

  const currentStatus = periodStatus[activeTab];
  const isPublished = currentStatus === 'PUBLISHED';
  const isPrivilegedView = (currentStatus === 'ACTIVE' || currentStatus === 'READ_ONLY') && (user?.role === 1 || user?.role === 2);
  const showWinners = isPublished || isPrivilegedView;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* HEADER DIBERSIHKAN (Tanpa Welcome Back) */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-5xl font-black text-tsa-dark tracking-tight">Dashboard Awards</h1>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-8 pb-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            const isEndOfTerm = tab === 'End of Term';
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                  isActive
                    ? 'bg-tsa-green text-white shadow-md transform scale-105'
                    : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
                }`}
              >
                {tab === 'End of Term' ? <span className="flex items-center gap-2"><Trophy size={14}/> {tab}</span> : tab}
              </button>
            );
          })}
        </div>

        {/* DYNAMIC CONTENT AREA */}
        <div className="transition-all duration-500">
          {currentStatus === 'LOCKED' ? (
            <div className="bg-white border border-gray-100 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Lock size={24} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-black text-tsa-dark mb-2">Period Locked</h2>
              <p className="text-sm text-gray-500 max-w-sm">The evaluation period for <span className="font-bold text-gray-700">{activeTab}</span> has not yet started or is currently closed.</p>
            </div>
          ) : loading ? (
             <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-tsa-green" size={40} /></div>
          ) : activeTab === 'End of Term' ? (
            
            /* ========================================== */
            /* UI CLEAN WHITE HALL OF FAME 2026 */
            /* ========================================== */
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex items-center justify-between mb-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-tsa-gold to-tsa-green"></div>
                <div className="ml-2">
                  <h2 className="text-2xl font-black text-tsa-dark flex items-center gap-3 tracking-widest uppercase">
                    {/* PERBAIKAN: Ikon Trophy jadi hijau */}
                    <Trophy size={28} className="text-tsa-green" /> Hall of Fame 2026
                  </h2>
                  <p className="text-xs text-gray-500 mt-2 font-medium max-w-2xl">The most prestigious awards based on Q1-Q4 aggregation, BPH Evaluation, and Ranked Choice Voting.</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm border ${isPublished ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-tsa-green border-green-100'}`}>
                    {isPublished ? '🏆 Results Published' : '🟢 Voting Active'}
                  </span>
                  {isPrivilegedView && <span className="text-[9px] font-bold text-red-500 mt-2 uppercase tracking-widest animate-pulse">Privileged View</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                {/* BARIS 1: BEST DEPT & BEST PROJECT (Kategori Entitas) */}
                <div className="md:col-span-3">
                  <AwardCard 
                    isEndOfTerm={true} title="Best Department of the Year" 
                    description="Outstanding bureaucratic execution and solid teamwork, validated by the Executive Board."
                    icon={Building2} iconColor="text-tsa-gold"
                    isPublished={showWinners} winner={hofWinners?.bestDeptOfYear} isGroup={true} groupPhotoUrl={hofWinners?.bestDeptOfYear ? deptPhotos[hofWinners.bestDeptOfYear.dept] : null}
                  />
                </div>
                <div className="md:col-span-3">
                  <AwardCard 
                    isEndOfTerm={true} title="Best Project of the Year" 
                    description="The most impactful work program chosen by the masses and validated by the Executive Board."
                    icon={Briefcase} iconColor="text-tsa-gold"
                    isPublished={showWinners} winner={hofWinners?.bestProjectOfYear} isGroup={true}
                  />
                </div>

                {/* BARIS 2: MVP, ROOKIE, & FAV EB (Kategori Individu) */}
                <div className="md:col-span-2">
                  <AwardCard 
                    isEndOfTerm={true} title="The Ultimate MVP of the Year" 
                    description="The absolute highest honor for the most consistent, agile, and impactful officer."
                    icon={Crown} iconColor="text-tsa-gold"
                    isPublished={showWinners} winner={hofWinners?.mvpOfYear}
                  />
                </div>
                <div className="md:col-span-2">
                  <AwardCard 
                    isEndOfTerm={true} title="Rookie of the Year" 
                    description="The most progressive and adaptive talent from the youngest generation (TLD 26)."
                    icon={Sparkles} iconColor="text-tsa-gold"
                    isPublished={showWinners} winner={hofWinners?.rookieOfYear}
                  />
                </div>
                <div className="md:col-span-2">
                  <AwardCard 
                    isEndOfTerm={true} title="Most Favorite EB" 
                    description="The most inspiring and supportive leader chosen 100% by the Staffs."
                    icon={Star} iconColor="text-tsa-gold"
                    isPublished={showWinners} winner={hofWinners?.favEb}
                  />
                </div>
              </div>
            </div>

          ) : (
            
            /* ========================================== */
            /* UI QUARTERLY AWARDS (Q1-Q4) */
            /* ========================================== */
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black text-tsa-dark flex items-center gap-2">
                    {/* PERBAIKAN: Ikon Trophy jadi hijau */}
                    <Trophy size={20} className="text-tsa-green" /> {activeTab} Quarterly Awards
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Based on automated calculation of performance metrics and attendance.</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm border ${isPublished ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-tsa-green border-green-100'}`}>
                    {isPublished ? '🏆 Results Published' : '🟢 Live Evaluation'}
                  </span>
                  {isPrivilegedView && <span className="text-[9px] font-bold text-red-500 mt-1 uppercase tracking-widest animate-pulse">Privileged View Active</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                <div className="md:col-span-3">
                  <AwardCard 
                    title="The Ultimate MVP" description="The most balanced performance across 5 qualitative aspects and real-field attendance."
                    icon={Crown} iconColor="text-blue-500" isPublished={showWinners} winner={winners?.mvp}
                  />
                </div>
                <div className="md:col-span-3">
                  <AwardCard 
                    title="Best Department" description="The department with the highest average MVP score per capita."
                    icon={Building2} iconColor="text-tsa-gold" isPublished={showWinners} winner={winners?.bestDept} isGroup={true} groupPhotoUrl={winners?.bestDept ? deptPhotos[winners.bestDept.dept] : null}
                  />
                </div>
                <div className="md:col-span-2">
                  <AwardCard 
                    title="The Reliable One" description="The highest SOP compliance (Discipline) and attendance consistency."
                    icon={ShieldCheck} iconColor="text-emerald-500" isPublished={showWinners} winner={winners?.reliable}
                  />
                </div>
                <div className="md:col-span-2">
                  <AwardCard 
                    title="The High Achiever" description="Superior execution quality (Agility) and rapid-response initiative (Active)."
                    icon={Target} iconColor="text-red-500" isPublished={showWinners} winner={winners?.achiever}
                  />
                </div>
                <div className="md:col-span-2">
                  <AwardCard 
                    title="The Spark" description="Highly communicative and friendly (Cheerful) with outstanding manners (Attitude)."
                    icon={Zap} iconColor="text-amber-500" isPublished={showWinners} winner={winners?.spark}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default Dashboard;