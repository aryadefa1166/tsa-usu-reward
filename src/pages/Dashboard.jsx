import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { calculateQuarterlyResults, calculateEndOfTermResults } from '../utils/calculator';
import { Trophy, Lock, Zap, Target, ShieldCheck, Crown, Users, Loader2, Star, Sparkles, Building2, Briefcase } from 'lucide-react';

// ==========================================
// KOMPONEN CARD AWARD: "TSA SYSTEM DESIGN" (Clean & Formal)
// ==========================================
const AwardCard = ({ 
  title, description, icon: Icon, isPublished, winner, isGroup, groupPhotoUrl, 
  layout = 'landscape', // 'landscape' (horizontal compact) atau 'portrait' (MVP vertikal)
  scoreValue, baseScore 
}) => {
  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : '?';

  const isPortrait = layout === 'portrait';

  return (
    <div className={`bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-md hover:border-tsa-green/30 transition-all duration-300 flex overflow-hidden ${isPortrait ? 'flex-col h-full' : 'flex-col sm:flex-row h-full'}`}>
      
      {!isPublished ? (
        // STATE: LOCKED (BELUM PENGUMUMAN)
        <div className="flex flex-col items-center justify-center w-full p-8 text-center bg-gray-50/50 min-h-[200px]">
           <Lock size={32} className="text-gray-300 mb-3" />
           <h3 className="font-black text-sm text-gray-400 uppercase tracking-widest">{title}</h3>
           <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest border border-dashed border-gray-300 px-3 py-1.5 rounded-md bg-white">To be announced</p>
        </div>
      ) : !winner ? (
        // STATE: NO DATA
        <div className="flex flex-col items-center justify-center w-full p-8 text-center bg-gray-50/50 min-h-[200px]">
           <Icon size={32} className="text-gray-200 mb-3" />
           <h3 className="font-black text-sm text-gray-400 uppercase tracking-widest">{title}</h3>
           <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">Data Not Available</p>
        </div>
      ) : (
        // STATE: PEMENANG (FORMAL & CLEAN)
        <>
          {/* AREA FOTO / MONOGRAM SERIF */}
          <div className={`p-4 shrink-0 flex flex-col justify-center ${isPortrait ? 'w-full h-64 pb-0' : 'w-full sm:w-48 h-56 sm:h-full pr-0'}`}>
            <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative bg-gray-50 flex items-center justify-center">
               {isGroup ? (
                  groupPhotoUrl || winner.photo_url ? (
                    <img src={groupPhotoUrl || winner.photo_url} alt="Winner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-tsa-green flex items-center justify-center">
                      <Users size={40} className="text-white/80" />
                    </div>
                  )
               ) : (
                  winner.photo_url ? (
                    <img src={winner.photo_url} alt={winner.full_name} className="w-full h-full object-cover" />
                  ) : (
                    // FORMAL SERIF MONOGRAM (Fallback Elegan)
                    <div className="w-full h-full bg-tsa-green flex items-center justify-center">
                        <span className="text-6xl font-serif font-bold text-white tracking-tighter">
                          {getInitials(winner.full_name)}
                        </span>
                    </div>
                  )
               )}
            </div>
          </div>

          {/* AREA INFORMASI (Putih, Rapi, Terstruktur) */}
          <div className={`flex flex-col flex-grow p-5 ${isPortrait ? 'items-center text-center' : 'justify-center'}`}>
             
             {/* Judul Award */}
             <div className={`flex items-center gap-2 mb-2 ${isPortrait ? 'justify-center' : ''}`}>
                <Icon size={14} className="text-tsa-gold" />
                <span className="text-[9px] font-black uppercase tracking-widest text-tsa-green">
                  {title}
                </span>
             </div>
             
             {/* Nama Pemenang */}
             <h2 className={`font-black text-tsa-dark leading-tight mb-2 ${isPortrait ? 'text-2xl' : 'text-lg line-clamp-2'}`}>
               {isGroup ? (winner.name || `${winner.dept} DEPT`) : winner.full_name}
             </h2>
             
             {/* Label Identitas */}
             {!isGroup && (
               <div className={`flex flex-wrap gap-1 mb-3 ${isPortrait ? 'justify-center' : ''}`}>
                 <span className="px-2 py-1 bg-green-50 text-tsa-green border border-green-100 rounded-md text-[9px] font-bold uppercase tracking-widest">
                   {winner.position} • {winner.dept}
                 </span>
                 {winner.cohort && (
                    <span className="px-2 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-md text-[9px] font-bold uppercase tracking-widest">
                      {winner.cohort}
                    </span>
                 )}
               </div>
             )}

             {/* Deskripsi (Hanya di Portrait agar Landscape lebih hemat tempat) */}
             {isPortrait && (
               <p className="text-[10px] font-medium text-gray-500 leading-relaxed mb-4">
                 {description}
               </p>
             )}

             {/* Area Skor Akhir */}
             <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-end w-full">
                <div>
                   <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Final Score</p>
                   <p className="text-lg font-black text-tsa-green leading-none">
                     {scoreValue ? scoreValue.toFixed(1) : '0.0'} <span className="text-[10px] text-gray-400">/ 100</span>
                   </p>
                </div>
                
                {baseScore && (
                  <div className="text-right">
                     <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Base MVP</p>
                     <p className="text-xs font-bold text-gray-500 leading-none">{baseScore.toFixed(1)}</p>
                  </div>
                )}
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
            <div className="space-y-6 animate-fade-in-up">
              
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

              {/* MVP TERPISAH DI ATAS (PORTRAIT) */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                <div className="md:col-span-2 md:col-start-3 md:col-end-5">
                  <AwardCard 
                    title="The Ultimate MVP of the Year" 
                    description="The absolute highest honor for the most consistent, agile, and impactful officer."
                    icon={Crown} isPublished={showWinners} winner={activeData?.mvpOfYear}
                    layout="portrait" scoreValue={activeData?.mvpOfYear?.mvpFinal}
                  />
                </div>
              </div>

              {/* AWARD LAINNYA (COMPACT/LANDSCAPE) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AwardCard 
                  title="Best Department of the Year" description="Outstanding bureaucratic execution and solid teamwork."
                  icon={Building2} isPublished={showWinners} winner={activeData?.bestDeptOfYear} isGroup={true} groupPhotoUrl={activeData?.bestDeptOfYear ? deptPhotos[activeData.bestDeptOfYear.dept] : null}
                  layout="landscape" scoreValue={activeData?.bestDeptOfYear?.finalScore}
                />
                <AwardCard 
                  title="Best Project of the Year" description="The most impactful work program chosen by the masses."
                  icon={Briefcase} isPublished={showWinners} winner={activeData?.bestProjectOfYear} isGroup={true}
                  layout="landscape" scoreValue={activeData?.bestProjectOfYear?.finalScore}
                />
                <AwardCard 
                  title="Rookie of the Year" description="The most progressive and adaptive talent from the youngest generation."
                  icon={Sparkles} isPublished={showWinners} winner={activeData?.rookieOfYear}
                  layout="landscape" scoreValue={activeData?.rookieOfYear?.rookieFinal} baseScore={activeData?.rookieOfYear?.sysAvg}
                />
                <AwardCard 
                  title="Most Favorite EB" description="The most inspiring and supportive leader chosen 100% by the Staffs."
                  icon={Star} isPublished={showWinners} winner={activeData?.favEb}
                  layout="landscape" scoreValue={activeData?.favEb?.favEbFinal}
                />
              </div>
            </div>

          ) : (
            
            /* ========================================== */
            /* UI QUARTERLY AWARDS (Q1-Q4) */
            /* ========================================== */
            <div className="space-y-6 animate-fade-in-up">
              
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

              {/* MVP KUARTAL TERPISAH (PORTRAIT) */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                <div className="md:col-span-2 md:col-start-3 md:col-end-5">
                  <AwardCard 
                    title="The Ultimate MVP" description="The most balanced performance across 5 qualitative aspects and real-field attendance."
                    icon={Crown} isPublished={showWinners} winner={activeData?.mvp}
                    layout="portrait" scoreValue={activeData?.mvp?.theUltimateMVP}
                  />
                </div>
              </div>

              {/* AWARD KUARTAL LAINNYA (COMPACT/LANDSCAPE) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AwardCard 
                  title="Best Department" description="The department with the highest average MVP score per capita."
                  icon={Building2} isPublished={showWinners} winner={activeData?.bestDept} isGroup={true} groupPhotoUrl={activeData?.bestDept ? deptPhotos[activeData.bestDept.dept] : null}
                  layout="landscape" scoreValue={activeData?.bestDept?.score}
                />
                <AwardCard 
                  title="The Reliable One" description="The highest SOP compliance (Discipline) and attendance consistency."
                  icon={ShieldCheck} isPublished={showWinners} winner={activeData?.reliable}
                  layout="landscape" scoreValue={activeData?.reliable?.theReliableOne} baseScore={activeData?.reliable?.theUltimateMVP}
                />
                <AwardCard 
                  title="The High Achiever" description="Superior execution quality (Agility) and rapid-response initiative (Active)."
                  icon={Target} isPublished={showWinners} winner={activeData?.achiever}
                  layout="landscape" scoreValue={activeData?.achiever?.theHighAchiever} baseScore={activeData?.achiever?.theUltimateMVP}
                />
                <AwardCard 
                  title="The Spark" description="Highly communicative and friendly (Cheerful) with outstanding manners (Attitude)."
                  icon={Zap} isPublished={showWinners} winner={activeData?.spark}
                  layout="landscape" scoreValue={activeData?.spark?.theSpark} baseScore={activeData?.spark?.theUltimateMVP}
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