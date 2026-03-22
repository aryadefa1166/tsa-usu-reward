import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { calculateQuarterlyResults, calculateEndOfTermResults } from '../utils/calculator';
import { Trophy, Lock, Zap, Target, ShieldCheck, Crown, Users, Loader2, Star, Sparkles, Building2, Briefcase } from 'lucide-react';

// ==========================================
// KOMPONEN CARD AWARD: "TSA SPLIT-CARD LUXURY"
// ==========================================
const AwardCard = ({ 
  title, description, icon: Icon, isPublished, winner, isGroup, groupPhotoUrl, 
  scoreValue, baseScore 
}) => {
  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : '?';

  // 1. Logika Render Posisi (Hirarki Divisi Format English)
  const renderPosition = (user) => {
    if (!user) return '';
    if (user.division && user.division !== '-' && user.division !== 'General') {
      return `${user.position} • ${user.division}`;
    }
    return user.position;
  };

  // 2. Ekspansi Nama Departemen (Format 3 Baris)
  const renderDeptName = (deptOrName) => {
    if (!deptOrName) return '';
    if (deptOrName === 'MD') return <>{deptOrName}<br /><span className="text-sm font-bold text-gray-500">Media Education</span><br /><span className="text-xs font-bold text-gray-400">Department</span></>;
    if (deptOrName === 'ERBD') return <>{deptOrName}<br /><span className="text-sm font-bold text-gray-500">External Relations and Business Development</span><br /><span className="text-xs font-bold text-gray-400">Department</span></>;
    if (deptOrName === 'STD') return <>{deptOrName}<br /><span className="text-sm font-bold text-gray-500">Staff & Talent Development</span><br /><span className="text-xs font-bold text-gray-400">Department</span></>;
    return deptOrName;
  };

  return (
    // CARD CONTAINER: Background dibuat transparan agar glassmorphism dari bawah (body) bisa terlihat utuh
    <div className="bg-transparent rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-xl hover:border-tsa-green/30 transition-all duration-300 flex flex-col h-full overflow-hidden group">
      
      {/* AREA ATAS: HEADER HIJAU TSA (Tinggi Dikunci agar Selalu Sejajar) */}
      <div className="bg-tsa-green h-[200px] p-6 flex flex-col items-center text-center relative z-10">
         <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Icon size={80} className="text-white"/></div>
         
         <div className="bg-white/20 p-2 rounded-full mb-3 backdrop-blur-sm border border-white/30 shadow-sm shrink-0">
           <Icon size={20} className="text-tsa-gold" />
         </div>
         <h3 className="font-black text-white text-lg uppercase tracking-widest drop-shadow-sm leading-tight mb-2 z-10">
           {title}
         </h3>
         <p className="text-[10px] text-white/80 font-medium max-w-[90%] leading-relaxed z-10 line-clamp-3">
           {description}
         </p>
      </div>

      {/* BODY KARTU: Glassmorphism Penuh & Area Informasi */}
      {/* Background Glassmorphism diletakkan di SINI agar mengisi sisa kartu dari bawah area hijau */}
      <div className="flex flex-col flex-grow relative z-0 bg-gradient-to-br from-green-50/90 via-white/80 to-tsa-gold/10 backdrop-blur-md">
         
         {/* AREA TENGAH: FOTO 1:1 MELAYANG (Margin Proporsional -mt-10) */}
         <div className="relative z-20 flex flex-col items-center justify-start -mt-10 mb-4 px-6">
            
            {/* Bingkai Foto (Ukuran Sedang w-32 h-32) */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-tr from-tsa-green to-tsa-gold p-[3px] shadow-lg group-hover:scale-105 transition-transform duration-500 relative z-20">
               <div className="w-full h-full rounded-[11px] bg-white overflow-hidden flex items-center justify-center relative">
                  {!isPublished ? (
                     <Lock size={32} className="text-gray-300" />
                  ) : !winner ? (
                     <Icon size={32} className="text-gray-300" />
                  ) : isGroup ? (
                     groupPhotoUrl || winner.photo_url ? (
                       <img src={groupPhotoUrl || winner.photo_url} alt="Winner" className="w-full h-full object-cover aspect-square" />
                     ) : (
                       <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                         <Users size={40} className="text-gray-400" />
                       </div>
                     )
                  ) : (
                     winner.photo_url ? (
                       <img src={winner.photo_url} alt={winner.full_name} className="w-full h-full object-cover aspect-square" />
                     ) : (
                       <div className="w-full h-full bg-tsa-green flex items-center justify-center">
                           <span className="text-5xl font-serif font-bold text-white">
                             {getInitials(winner.full_name)}
                           </span>
                       </div>
                     )
                  )}
               </div>
            </div>
            
            {/* Efek Gradasi Bayangan Realistis (Menempel persis di bawah bingkai foto) */}
            <div className="w-24 h-6 bg-gradient-to-b from-black/15 to-transparent blur-md rounded-b-full -mt-2 z-10 pointer-events-none"></div>
         </div>

         {/* AREA INFORMASI & SKOR */}
         <div className="flex flex-col flex-grow px-6 pb-6 text-center">
            {!isPublished ? (
               <div className="mt-2 flex-grow flex items-center justify-center">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-dashed border-gray-300/50 px-4 py-2 rounded-md bg-white/50 backdrop-blur-sm">To be announced</p>
               </div>
            ) : !winner ? (
               <div className="mt-2 flex-grow flex items-center justify-center">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100/30 px-4 py-2 rounded-md border border-gray-200/50 backdrop-blur-sm">Data Not Available</p>
               </div>
            ) : (
               <div className="flex flex-col flex-grow items-center justify-between">
                 
                 <div className="flex flex-col items-center w-full mb-4">
                   {/* Nama Pemenang / Departemen (Format 3 Baris) */}
                   <h2 className="font-black text-tsa-dark text-xl sm:text-2xl leading-tight mb-2 px-2 mt-1">
                     {isGroup ? renderDeptName(winner.dept || winner.name) : winner.full_name}
                   </h2>
                   
                   {/* Label Posisi & Cohort (Kompak & Rapi) */}
                   {!isGroup && (
                     <div className="flex flex-col items-center justify-center gap-1">
                       <span className="px-3 py-1 bg-white/60 text-tsa-green border border-tsa-green/10 shadow-sm rounded-md text-[9px] font-bold uppercase tracking-widest backdrop-blur-md">
                         {renderPosition(winner)} • {winner.dept}
                       </span>
                       {winner.cohort && (
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-2 py-0.5">
                            {winner.cohort}
                          </span>
                       )}
                     </div>
                   )}
                 </div>

                 {/* Skor Akhir (Menempel, Rapi, Transparent Glass) */}
                 <div className={`pt-3 border-t border-tsa-green/10 flex items-center ${baseScore ? 'justify-between' : 'justify-center'} w-full bg-white/40 rounded-xl p-3 backdrop-blur-sm shadow-[0_2px_10px_rgba(0,103,73,0.03)]`}>
                    <div className={baseScore ? 'text-left' : 'text-center'}>
                       <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-0.5">Final Score</p>
                       <p className="text-xl font-black text-tsa-green leading-none drop-shadow-sm">
                         {scoreValue ? scoreValue.toFixed(1) : '0.0'} <span className="text-xs text-gray-400/70">/ 100</span>
                       </p>
                    </div>
                    
                    {baseScore && (
                      <div className="text-right">
                         <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Base MVP</p>
                         <p className="text-sm font-bold text-gray-500 leading-none">{baseScore.toFixed(1)}</p>
                      </div>
                    )}
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
      
      <main className="max-w-6xl mx-auto px-6 mt-8">
        
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-tsa-dark tracking-tight">Dashboard Awards</h1>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-8 pb-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                  isActive
                    ? 'bg-tsa-green text-white shadow-md'
                    : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-100'
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
            <div className="bg-white border border-gray-200 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                <Lock size={24} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-black text-tsa-dark mb-2">Period Locked</h2>
              <p className="text-sm text-gray-500 max-w-sm">The evaluation period for <span className="font-bold text-gray-700">{activeTab}</span> has not yet started or is currently closed.</p>
            </div>
          ) : activeTab === 'End of Term' ? (
            
            /* ========================================== */
            /* UI END OF TERM (HALL OF FAME) */
            /* ========================================== */
            <div className="space-y-8 animate-fade-in-up">
              
              {/* Header Card Formal */}
              <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-tsa-gold to-tsa-green"></div>
                <div className="ml-2">
                  <h2 className="text-xl font-black text-tsa-dark flex items-center gap-3 tracking-widest uppercase mb-1">
                    <Trophy size={24} className="text-tsa-green" /> Hall of Fame 2026
                  </h2>
                  <p className="text-xs text-gray-500 font-medium max-w-2xl leading-relaxed">The most prestigious awards based on Q1-Q4 aggregation, Executive Evaluation, and Ranked Choice Voting.</p>
                </div>
                <div className="flex flex-col items-start md:items-end mt-4 md:mt-0">
                  <span className={`text-[10px] font-black px-4 py-2 rounded-md uppercase tracking-widest border ${isPublished ? 'bg-green-50 text-tsa-green border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {isPublished ? '🏆 Results Published' : '🟢 Voting Active'}
                  </span>
                  {isPrivilegedView && <span className="text-[9px] font-bold text-red-500 mt-2 uppercase tracking-widest">Privileged View</span>}
                </div>
              </div>

              {/* FORMASI 2: MVP & BEST DEPT DI ATAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AwardCard 
                  title="The Ultimate MVP of the Year" 
                  description="The absolute highest honor for the most consistent, agile, and impactful officer."
                  icon={Crown} isPublished={showWinners} winner={activeData?.mvpOfYear}
                  scoreValue={activeData?.mvpOfYear?.mvpFinal}
                />
                <AwardCard 
                  title="Best Department of the Year" description="Outstanding bureaucratic execution and solid teamwork."
                  icon={Building2} isPublished={showWinners} winner={activeData?.bestDeptOfYear} isGroup={true} groupPhotoUrl={activeData?.bestDeptOfYear ? deptPhotos[activeData.bestDeptOfYear.dept] : null}
                  scoreValue={activeData?.bestDeptOfYear?.finalScore}
                />
              </div>

              {/* FORMASI 3: AWARD SISANYA DI BAWAH */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AwardCard 
                  title="Best Project of the Year" description="The most impactful work program chosen by the masses."
                  icon={Briefcase} isPublished={showWinners} winner={activeData?.bestProjectOfYear} isGroup={true}
                  scoreValue={activeData?.bestProjectOfYear?.finalScore}
                />
                <AwardCard 
                  title="Rookie of the Year" description="The most progressive and adaptive talent from the youngest generation."
                  icon={Sparkles} isPublished={showWinners} winner={activeData?.rookieOfYear}
                  scoreValue={activeData?.rookieOfYear?.rookieFinal} baseScore={activeData?.rookieOfYear?.sysAvg}
                />
                <AwardCard 
                  title="Most Favorite EB" description="The most inspiring and supportive leader chosen 100% by the Staffs."
                  icon={Star} isPublished={showWinners} winner={activeData?.favEb}
                  scoreValue={activeData?.favEb?.favEbFinal}
                />
              </div>
            </div>

          ) : (
            
            /* ========================================== */
            /* UI QUARTERLY AWARDS (Q1-Q4) */
            /* ========================================== */
            <div className="space-y-8 animate-fade-in-up">
              
              {/* Header Card Formal */}
              <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-tsa-gold to-tsa-green"></div>
                <div className="ml-2">
                  <h2 className="text-xl font-black text-tsa-dark flex items-center gap-3 tracking-widest uppercase mb-1">
                    <Trophy size={24} className="text-tsa-green" /> {activeTab} Quarterly Awards
                  </h2>
                  <p className="text-xs text-gray-500 font-medium max-w-2xl leading-relaxed">Based on automated calculation of performance metrics and real-field attendance.</p>
                </div>
                <div className="flex flex-col items-start md:items-end mt-4 md:mt-0">
                  <span className={`text-[10px] font-black px-4 py-2 rounded-md uppercase tracking-widest border ${isPublished ? 'bg-green-50 text-tsa-green border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {isPublished ? '🏆 Results Published' : '🟢 Live Evaluation'}
                  </span>
                  {isPrivilegedView && <span className="text-[9px] font-bold text-red-500 mt-2 uppercase tracking-widest">Privileged View Active</span>}
                </div>
              </div>

              {/* FORMASI 2: MVP & BEST DEPT DI ATAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AwardCard 
                  title="The Ultimate MVP" description="The most balanced performance across 5 qualitative aspects and real-field attendance."
                  icon={Crown} isPublished={showWinners} winner={activeData?.mvp}
                  scoreValue={activeData?.mvp?.theUltimateMVP}
                />
                <AwardCard 
                  title="Best Department" description="The department with the highest average MVP score per capita."
                  icon={Building2} isPublished={showWinners} winner={activeData?.bestDept} isGroup={true} groupPhotoUrl={activeData?.bestDept ? deptPhotos[activeData.bestDept.dept] : null}
                  scoreValue={activeData?.bestDept?.score}
                />
              </div>

              {/* FORMASI 3: AWARD SISANYA DI BAWAH */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AwardCard 
                  title="The Reliable One" description="The highest SOP compliance (Discipline) and attendance consistency."
                  icon={ShieldCheck} isPublished={showWinners} winner={activeData?.reliable}
                  scoreValue={activeData?.reliable?.theReliableOne} baseScore={activeData?.reliable?.theUltimateMVP}
                />
                <AwardCard 
                  title="The High Achiever" description="Superior execution quality (Agility) and rapid-response initiative (Active)."
                  icon={Target} isPublished={showWinners} winner={activeData?.achiever}
                  scoreValue={activeData?.achiever?.theHighAchiever} baseScore={activeData?.achiever?.theUltimateMVP}
                />
                <AwardCard 
                  title="The Spark" description="Highly communicative and friendly (Cheerful) with outstanding manners (Attitude)."
                  icon={Zap} isPublished={showWinners} winner={activeData?.spark}
                  scoreValue={activeData?.spark?.theSpark} baseScore={activeData?.spark?.theUltimateMVP}
                />
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default Dashboard;