import { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { calculateQuarterlyResults, calculateEndOfTermResults } from '../utils/calculator';
import { Trophy, Lock, Zap, Target, ShieldCheck, Crown, Users, Loader2, Star, Sparkles, Building2, Briefcase } from 'lucide-react';

// ==========================================
// KOMPONEN CARD AWARD: "THE PREMIUM PORTRAIT"
// ==========================================
const AwardCard = ({ title, description, icon: Icon, isPublished, winner, isGroup, groupPhotoUrl, isEndOfTerm = false }) => {
  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : '?';

  // State Card untuk Q1-Q4 (Lebih Compact) vs End of Term (Super Mewah)
  const isSuperPremium = isEndOfTerm && showWinners && winner;

  return (
    <div className={`rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden bg-white hover:-translate-y-1 hover:shadow-xl transition-all duration-500 group flex flex-col h-full ${isEndOfTerm ? 'min-h-[420px]' : 'min-h-[300px]'}`}>
      
      {/* 1. BACKLIGHT SPOTLIGHT (Pendaran Cahaya di Belakang) */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-tsa-gold/10 rounded-full blur-3xl group-hover:bg-tsa-gold/20 transition-all duration-500 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-tsa-green/5 rounded-full blur-3xl group-hover:bg-tsa-green/10 transition-all duration-500 pointer-events-none"></div>
      
      {/* Garis Aksen Kiri Khas End Of Term */}
      {isEndOfTerm && <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-tsa-gold via-tsa-green to-transparent z-20"></div>}

      {!isPublished ? (
        // STATE: LOCKED (BELUM PENGUMUMAN)
        <div className="flex flex-col items-center justify-center flex-grow p-8 text-center z-10 bg-gray-50/50">
           <Lock size={40} className="text-gray-300 mb-4" />
           <h3 className="font-black text-lg text-gray-400 uppercase tracking-widest">{title}</h3>
           <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest border border-dashed border-gray-300 px-3 py-1.5 rounded-lg bg-white/50">To be announced</p>
        </div>
      ) : !winner ? (
        // STATE: NO DATA
        <div className="flex flex-col items-center justify-center flex-grow p-8 text-center z-10">
           <Icon size={40} className="text-gray-200 mb-4" />
           <h3 className="font-black text-lg text-gray-400 uppercase tracking-widest">{title}</h3>
           <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">Data Not Available</p>
        </div>
      ) : (
        // STATE: PEMENANG (THE HALL OF FAME)
        <>
          {/* FOTO PORTRAIT RAKSASA (Dominasi 60%-70% Area Atas) */}
          <div className="w-full relative bg-gray-100 border-b border-gray-100 flex-grow max-h-[60%] flex items-center justify-center overflow-hidden z-0">
             {isGroup ? (
                groupPhotoUrl || winner.photo_url ? (
                  <img src={groupPhotoUrl || winner.photo_url} alt="Winner" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                ) : (
                  <Users size={60} className="text-gray-300" />
                )
             ) : (
                winner.photo_url ? (
                  <img src={winner.photo_url} alt={winner.full_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                ) : (
                  <span className="text-5xl font-black text-gray-300">{getInitials(winner.full_name)}</span>
                )
             )}
             
             {/* Efek Gradasi Pudar (Fade-to-Bottom) agar menyatu dengan area teks */}
             <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
          </div>

          {/* LENCANA/BADGE JUARA (MENGAMBANG) */}
          <div className="absolute top-4 right-4 z-20">
             <div className={`p-2 rounded-xl backdrop-blur-md border shadow-sm flex items-center justify-center ${isEndOfTerm ? 'bg-tsa-gold/90 text-white border-tsa-yellow shadow-tsa-gold-glow' : 'bg-white/90 text-tsa-green border-gray-100'}`}>
                <Icon size={20} className={isEndOfTerm ? 'text-white' : 'text-tsa-green'} />
             </div>
          </div>

          <div className="absolute bottom-[40%] left-0 w-full flex justify-center z-20 -mb-5">
             <span className="px-4 py-1.5 bg-tsa-dark text-tsa-gold border border-tsa-dark/50 text-[10px] font-black uppercase tracking-widest rounded-full shadow-xl">
               {title}
             </span>
          </div>

          {/* AREA TEKS (Premium Glassmorphism & Identity) */}
          <div className="p-6 pt-8 flex flex-col items-center text-center z-10 bg-white relative">
             {/* Nama Pemenang (Massive & Bold) */}
             <h2 className={`font-black tracking-tight leading-none mb-2 ${isEndOfTerm ? 'text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-tsa-green to-emerald-800' : 'text-xl text-tsa-dark'}`}>
               {isGroup ? (winner.name || `${winner.dept} DEPT`) : winner.full_name}
             </h2>
             
             {/* Subtitle Identity (Clean & Spaced) */}
             {!isGroup && (
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                 {winner.position} <span className="text-tsa-gold mx-1">•</span> {winner.dept}
               </p>
             )}

             {/* Skor atau Deskripsi Pendek */}
             <div className="mt-auto w-full pt-4 border-t border-gray-100/50 flex justify-between items-center">
                <p className="text-[9px] font-medium text-gray-400 text-left max-w-[60%] leading-tight pr-2">
                  {description}
                </p>
                <div className="flex flex-col items-end">
                   <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Final Score</span>
                   <span className="text-sm font-black text-tsa-dark bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                     {winner.score?.toFixed(1) || winner.finalScore?.toFixed(1) || winner.mvpFinal?.toFixed(1) || winner.rookieFinal?.toFixed(1) || winner.favEbFinal?.toFixed(1) || winner.theUltimateMVP?.toFixed(1) || winner.theReliableOne?.toFixed(1) || winner.theHighAchiever?.toFixed(1) || winner.theSpark?.toFixed(1)} <span className="text-[10px] text-gray-400">/ 100</span>
                   </span>
                </div>
             </div>
          </div>
        </>
      )}
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
  
  const [periodStatus, setPeriodStatus] = useState({
    Q1: 'LOCKED', Q2: 'LOCKED', Q3: 'LOCKED', Q4: 'LOCKED', 'End of Term': 'LOCKED'
  });
  const [deptPhotos, setDeptPhotos] = useState({});
  const [dataCache, setDataCache] = useState({});

  const tabs = ['Q1', 'Q2', 'Q3', 'Q4', 'End of Term'];

  useEffect(() => {
    fetchAdminSettings();
    fetchOrganizationAssets();
  }, []);

  useEffect(() => {
    if (!dataCache[activeTab]) {
      fetchWinnersData(activeTab);
    }
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
    try {
      let result;
      if (tabName === 'End of Term') result = await calculateEndOfTermResults();
      else result = await calculateQuarterlyResults(tabName);
      
      setDataCache(prev => ({ ...prev, [tabName]: result }));
    } catch (error) {
      console.error(`Error calculating results for ${tabName}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = periodStatus[activeTab];
  const isPublished = currentStatus === 'PUBLISHED';
  const isPrivilegedView = (currentStatus === 'ACTIVE' || currentStatus === 'READ_ONLY') && (user?.role === 1 || user?.role === 2);
  const showWinners = isPublished || isPrivilegedView;
  const activeData = dataCache[activeTab];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 mt-8">
        
        <div className="mb-10">
          <h1 className="text-3xl md:text-5xl font-black text-tsa-dark tracking-tight">Dashboard Awards</h1>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-8 pb-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
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
          {loading && !activeData ? (
             <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-tsa-green" size={40} /></div>
          ) : currentStatus === 'LOCKED' ? (
            <div className="bg-white border border-gray-100 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Lock size={24} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-black text-tsa-dark mb-2">Period Locked</h2>
              <p className="text-sm text-gray-500 max-w-sm">The evaluation period for <span className="font-bold text-gray-700">{activeTab}</span> has not yet started or is currently closed.</p>
            </div>
          ) : activeTab === 'End of Term' ? (
            
            /* ========================================== */
            /* UI CLEAN WHITE HALL OF FAME 2026 */
            /* ========================================== */
            <div className="space-y-8 animate-fade-in-up">
              <div className="flex items-center justify-between mb-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-tsa-gold to-tsa-green"></div>
                <div className="ml-2">
                  <h2 className="text-2xl font-black text-tsa-dark flex items-center gap-3 tracking-widest uppercase">
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
                <div className="md:col-span-2 md:col-start-3 md:col-end-5">
                  <AwardCard 
                    isEndOfTerm={true} title="The Ultimate MVP of the Year" 
                    description="The absolute highest honor for the most consistent, agile, and impactful officer."
                    icon={Crown} isPublished={showWinners} winner={activeData?.mvpOfYear}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                <div className="md:col-span-3">
                  <AwardCard 
                    isEndOfTerm={true} title="Best Department of the Year" 
                    description="Outstanding bureaucratic execution and solid teamwork."
                    icon={Building2} isPublished={showWinners} winner={activeData?.bestDeptOfYear} isGroup={true} groupPhotoUrl={activeData?.bestDeptOfYear ? deptPhotos[activeData.bestDeptOfYear.dept] : null}
                  />
                </div>
                <div className="md:col-span-3">
                  <AwardCard 
                    isEndOfTerm={true} title="Best Project of the Year" 
                    description="The most impactful work program chosen by the masses."
                    icon={Briefcase} isPublished={showWinners} winner={activeData?.bestProjectOfYear} isGroup={true}
                  />
                </div>
                <div className="md:col-span-3">
                  <AwardCard 
                    isEndOfTerm={true} title="Rookie of the Year" 
                    description="The most progressive and adaptive talent from the youngest generation (TLD 26)."
                    icon={Sparkles} isPublished={showWinners} winner={activeData?.rookieOfYear}
                  />
                </div>
                <div className="md:col-span-3">
                  <AwardCard 
                    isEndOfTerm={true} title="Most Favorite EB" 
                    description="The most inspiring and supportive leader chosen 100% by the Staffs."
                    icon={Star} isPublished={showWinners} winner={activeData?.favEb}
                  />
                </div>
              </div>
            </div>

          ) : (
            
            /* ========================================== */
            /* UI QUARTERLY AWARDS (Q1-Q4) */
            /* ========================================== */
            <div className="space-y-8 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black text-tsa-dark flex items-center gap-2">
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
                    icon={Crown} isPublished={showWinners} winner={activeData?.mvp}
                  />
                </div>
                <div className="md:col-span-3">
                  <AwardCard 
                    title="Best Department" description="The department with the highest average MVP score per capita."
                    icon={Building2} isPublished={showWinners} winner={activeData?.bestDept} isGroup={true} groupPhotoUrl={activeData?.bestDept ? deptPhotos[activeData.bestDept.dept] : null}
                  />
                </div>
                <div className="md:col-span-2">
                  <AwardCard 
                    title="The Reliable One" description="The highest SOP compliance (Discipline) and attendance consistency."
                    icon={ShieldCheck} isPublished={showWinners} winner={activeData?.reliable}
                  />
                </div>
                <div className="md:col-span-2">
                  <AwardCard 
                    title="The High Achiever" description="Superior execution quality (Agility) and rapid-response initiative (Active)."
                    icon={Target} isPublished={showWinners} winner={activeData?.achiever}
                  />
                </div>
                <div className="md:col-span-2">
                  <AwardCard 
                    title="The Spark" description="Highly communicative and friendly (Cheerful) with outstanding manners (Attitude)."
                    icon={Zap} isPublished={showWinners} winner={activeData?.spark}
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