import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { calculateQuarterlyResults } from '../utils/calculator';
import { Trophy, Lock, Zap, Target, ShieldCheck, Crown, Users, Loader2 } from 'lucide-react';

// ==========================================
// KOMPONEN CARD AWARD (DENGAN IDENTITAS LENGKAP & FOTO)
// ==========================================
const AwardCard = ({ title, description, icon: Icon, isPublished, winner, bgClass, iconColor, isGroup, groupPhotoUrl }) => {
  
  // Helper untuk mendapatkan inisial jika tidak ada foto
  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className={`relative p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full ${bgClass}`}>
      <div className="absolute top-0 right-0 p-6 opacity-10">
        <Icon size={100} />
      </div>
      
      <div className="relative z-10 flex flex-col flex-grow">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-xl bg-white shadow-sm ${iconColor}`}>
            <Icon size={20} />
          </div>
          <h3 className="font-black text-tsa-dark text-lg tracking-tight">{title}</h3>
        </div>
        <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6 max-w-[90%]">
          {description}
        </p>
        
        <div className="mt-auto pt-4 border-t border-gray-100/70">
          {!isPublished ? (
            <div className="flex items-center gap-2 bg-white/50 px-4 py-3 rounded-xl border border-dashed border-gray-300 w-full">
              <Lock size={14} className="text-gray-400" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">To be announced</p>
            </div>
          ) : !winner ? (
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 w-full">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data Not Available</p>
            </div>
          ) : isGroup ? (
            /* --- RENDER UNTUK BEST DEPARTMENT (LANDSCAPE PHOTO) --- */
            <div>
              <div className="w-full h-32 rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-gray-100 mb-3 relative flex items-center justify-center">
                {groupPhotoUrl ? (
                  <img src={groupPhotoUrl} alt="Department" className="w-full h-full object-cover" />
                ) : (
                  <Users size={32} className="text-gray-300" />
                )}
                {/* Gradient Overlay agar tulisan Dept terbaca */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <p className="absolute bottom-3 left-4 text-white font-black text-lg tracking-widest uppercase shadow-sm">
                  {winner.dept} DEPT
                </p>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <span className="px-2 py-1 bg-yellow-50 text-tsa-gold rounded text-[10px] font-black uppercase tracking-widest">Average Score</span>
                <span className="text-sm font-black text-tsa-dark">{winner.score?.toFixed(1)} / 100</span>
              </div>
            </div>
          ) : (
            /* --- RENDER UNTUK INDIVIDU (MVP, RELIABLE, DLL) --- */
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full border border-gray-200 shadow-sm overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                {winner.photo_url ? (
                  <img src={winner.photo_url} alt={winner.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-black text-tsa-green">{getInitials(winner.full_name)}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-black text-tsa-dark leading-tight">{winner.full_name}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-black uppercase tracking-widest">
                    {winner.cohort}
                  </span>
                  <span className="px-2 py-0.5 bg-green-50 text-tsa-green border border-green-100 rounded text-[9px] font-black uppercase tracking-widest">
                    {winner.position} • {winner.dept}{winner.division !== '-' ? ` / ${winner.division}` : ''}
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
  const [deptPhotos, setDeptPhotos] = useState({}); // Menyimpan foto departemen

  const tabs = ['Q1', 'Q2', 'Q3', 'Q4', 'End of Term'];

  useEffect(() => {
    fetchAdminSettings();
    fetchOrganizationAssets();
  }, []);

  useEffect(() => {
    if (activeTab !== 'End of Term') fetchWinnersData(activeTab);
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

  const fetchWinnersData = async (quarter) => {
    setLoading(true);
    const result = await calculateQuarterlyResults(quarter);
    setWinners(result);
    setLoading(false);
  };

  const currentStatus = periodStatus[activeTab];
  const isPublished = currentStatus === 'PUBLISHED';
  
  // Hak Istimewa melihat hasil live (Role 1: Admin, 2: BPH/ADV)
  const isPrivilegedView = (currentStatus === 'ACTIVE' || currentStatus === 'READ_ONLY') && (user?.role === 1 || user?.role === 2);
  const showWinners = isPublished || isPrivilegedView;

  // Sapaan Presisi
  const greetingName = user?.role === 1 ? 'Administrator' : (user?.full_name || 'User');

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 mt-8">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-tsa-dark tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Welcome back, <span className="font-black text-tsa-green">{greetingName}</span>
          </p>
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
                    ? isEndOfTerm
                      ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-tsa-gold shadow-md transform scale-105'
                      : 'bg-tsa-green text-white shadow-md transform scale-105'
                    : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
                }`}
              >
                {tab}
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
              <p className="text-sm text-gray-500 max-w-sm">
                The evaluation period for <span className="font-bold text-gray-700">{activeTab}</span> has not yet started or is currently closed.
              </p>
            </div>
            
          ) : activeTab === 'End of Term' ? (
             <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-xl animate-fade-in-up border border-gray-800">
                <Crown size={48} className="text-tsa-gold mb-4" />
                <h2 className="text-2xl font-black text-white mb-2 tracking-widest uppercase">Hall of Fame 2026</h2>
                <p className="text-sm text-gray-400 max-w-md">End of term calculation is in progress. Ranked Choice Voting results will be released shortly.</p>
             </div>
          ) : loading ? (
             <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-tsa-green" size={40} />
             </div>
          ) : (
            
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black text-tsa-dark flex items-center gap-2">
                    <Trophy size={20} className="text-tsa-gold" /> 
                    {activeTab} Quarterly Awards
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Based on automated calculation of performance metrics and attendance.</p>
                </div>
                {/* Status Badge */}
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm border ${isPublished ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-tsa-green border-green-100'}`}>
                    {isPublished ? '🏆 Results Published' : '🟢 Live Evaluation'}
                  </span>
                  {isPrivilegedView && <span className="text-[9px] font-bold text-red-500 mt-1 uppercase tracking-widest animate-pulse">Privileged View Active</span>}
                </div>
              </div>

              {/* GRID AWARDS TERSTRUKTUR (Sistem 6 Kolom) */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                
                {/* BARIS ATAS: MVP (3 Kolom) & BEST DEPT (3 Kolom) */}
                <div className="md:col-span-3">
                  <AwardCard 
                    title="The Ultimate MVP" 
                    description="The most balanced performance across 5 qualitative aspects and real-field attendance."
                    icon={Crown} 
                    bgClass="bg-white" 
                    iconColor="text-blue-500"
                    isPublished={showWinners} 
                    winner={winners?.mvp}
                    isGroup={false}
                  />
                </div>

                <div className="md:col-span-3">
                  <AwardCard 
                    title="Best Department" 
                    description="The department with the highest average MVP score per capita."
                    icon={Users} 
                    bgClass="bg-white" 
                    iconColor="text-tsa-gold"
                    isPublished={showWinners} 
                    winner={winners?.bestDept}
                    isGroup={true}
                    groupPhotoUrl={winners?.bestDept ? deptPhotos[winners.bestDept.dept] : null}
                  />
                </div>

                {/* BARIS BAWAH: Reliable (2 Kolom), Achiever (2 Kolom), Spark (2 Kolom) */}
                <div className="md:col-span-2">
                  <AwardCard 
                    title="The Reliable One" 
                    description="The highest SOP compliance (Discipline) and attendance consistency."
                    icon={ShieldCheck} 
                    bgClass="bg-white"
                    iconColor="text-emerald-500"
                    isPublished={showWinners} 
                    winner={winners?.reliable}
                    isGroup={false}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <AwardCard 
                    title="The High Achiever" 
                    description="Superior execution quality (Agility) and rapid-response initiative (Active)."
                    icon={Target} 
                    bgClass="bg-white"
                    iconColor="text-red-500"
                    isPublished={showWinners} 
                    winner={winners?.achiever}
                    isGroup={false}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <AwardCard 
                    title="The Spark" 
                    description="Highly communicative and friendly (Cheerful) with outstanding manners."
                    icon={Zap} 
                    bgClass="bg-white"
                    iconColor="text-amber-500"
                    isPublished={showWinners} 
                    winner={winners?.spark}
                    isGroup={false}
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