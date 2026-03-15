import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { calculateQuarterlyResults } from '../utils/calculator';
import { Trophy, Lock, Zap, Target, ShieldCheck, Crown, Users, Loader2 } from 'lucide-react';

// Komponen Card Kategori Award
const AwardCard = ({ title, description, icon: Icon, isPublished, winnerName, winnerDept, bgClass, iconColor }) => (
  <div className={`relative p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${bgClass}`}>
    <div className="absolute top-0 right-0 p-6 opacity-10">
      <Icon size={100} />
    </div>
    
    <div className="relative z-10 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-xl bg-white shadow-sm ${iconColor}`}>
          <Icon size={20} />
        </div>
        <h3 className="font-black text-tsa-dark text-lg tracking-tight">{title}</h3>
      </div>
      <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6 flex-grow max-w-[85%]">
        {description}
      </p>
      
      <div className="mt-auto pt-4 border-t border-gray-100/50 flex items-center gap-3">
        {isPublished ? (
          <>
            <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-gray-100 flex-shrink-0">
              {winnerName !== "No Data" ? (
                <img src={`https://ui-avatars.com/api/?name=${winnerName}&background=random`} alt="Winner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">?</div>
              )}
            </div>
            <div>
              <p className="text-sm font-black text-tsa-dark leading-tight">{winnerName}</p>
              <p className="text-[10px] font-bold text-tsa-green uppercase tracking-widest">{winnerDept}</p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-xl border border-dashed border-gray-300 w-full">
            <Lock size={14} className="text-gray-400" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">To be announced</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Q1');
  const [loading, setLoading] = useState(true);
  
  // State Data Real dari Database
  const [periodStatus, setPeriodStatus] = useState({
    Q1: 'LOCKED', Q2: 'LOCKED', Q3: 'LOCKED', Q4: 'LOCKED', 'End of Term': 'LOCKED'
  });
  const [winners, setWinners] = useState(null);

  const tabs = ['Q1', 'Q2', 'Q3', 'Q4', 'End of Term'];

  // 1. Ambil Settingan Gembok Admin saat komponen dimuat
  useEffect(() => {
    fetchAdminSettings();
  }, []);

  // 2. Ambil Data Pemenang setiap kali Tab Kuartal diklik
  useEffect(() => {
    if (activeTab !== 'End of Term') {
      fetchWinnersData(activeTab);
    }
  }, [activeTab]);

  const fetchAdminSettings = async () => {
    try {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
      if (error) throw error;
      if (data) {
        setPeriodStatus({
          Q1: data.q1_status,
          Q2: data.q2_status,
          Q3: data.q3_status,
          Q4: data.q4_status,
          'End of Term': data.voting_status
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchWinnersData = async (quarter) => {
    setLoading(true);
    // Panggil utilitas kalkulator
    const result = await calculateQuarterlyResults(quarter);
    setWinners(result);
    setLoading(false);
  };

  const currentStatus = periodStatus[activeTab];
  const isPublished = currentStatus === 'PUBLISHED';
  
  // Hak Istimewa melihat hasil live meskipun belum dipublish (Role 1: Admin, 2: BPH, 3: ADV)
  const isPrivilegedView = (currentStatus === 'ACTIVE' || currentStatus === 'READ_ONLY') && (user?.role >= 1 && user?.role <= 3);
  const showWinners = isPublished || isPrivilegedView;

  // Sapaan Presisi: Jika Admin, tampilkan Administrator. Jika bukan, tampilkan nama atau 'Staff'.
  const greetingName = user?.role === 1 ? 'Administrator' : (user?.full_name || 'Staff');

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
              <div className="flex items-center justify-between mb-2">
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

              {/* GRID AWARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <div className="md:col-span-2 lg:col-span-3">
                  <AwardCard 
                    title="The Ultimate MVP" 
                    description="The most balanced performance across 5 qualitative aspects and real-field attendance."
                    icon={Crown} 
                    bgClass="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border-blue-100"
                    iconColor="text-blue-500"
                    isPublished={showWinners} 
                    winnerName={winners?.mvp ? winners.mvp.full_name : "No Data"} 
                    winnerDept={winners?.mvp ? `${winners.mvp.position} • ${winners.mvp.dept}` : "-"} 
                  />
                </div>

                <AwardCard 
                  title="Best Department" 
                  description="The department with the highest average MVP score per capita."
                  icon={Users} 
                  bgClass="bg-white" 
                  iconColor="text-tsa-gold"
                  isPublished={showWinners} 
                  winnerName={winners?.bestDept ? winners.bestDept.dept : "No Data"} 
                  winnerDept={winners?.bestDept ? `Average Score: ${winners.bestDept.score.toFixed(1)}` : "-"} 
                />

                <AwardCard 
                  title="The Reliable One" 
                  description="The highest SOP compliance (Discipline) and attendance consistency."
                  icon={ShieldCheck} 
                  bgClass="bg-white"
                  iconColor="text-emerald-500"
                  isPublished={showWinners} 
                  winnerName={winners?.reliable ? winners.reliable.full_name : "No Data"} 
                  winnerDept={winners?.reliable ? `${winners.reliable.position} • ${winners.reliable.dept}` : "-"} 
                />
                
                <AwardCard 
                  title="The High Achiever" 
                  description="Superior execution quality (Agility) and rapid-response initiative (Active)."
                  icon={Target} 
                  bgClass="bg-white"
                  iconColor="text-red-500"
                  isPublished={showWinners} 
                  winnerName={winners?.achiever ? winners.achiever.full_name : "No Data"} 
                  winnerDept={winners?.achiever ? `${winners.achiever.position} • ${winners.achiever.dept}` : "-"} 
                />
                
                <AwardCard 
                  title="The Spark" 
                  description="Highly communicative and friendly (Cheerful) with outstanding manners (Attitude)."
                  icon={Zap} 
                  bgClass="bg-white"
                  iconColor="text-amber-500"
                  isPublished={showWinners} 
                  winnerName={winners?.spark ? winners.spark.full_name : "No Data"} 
                  winnerDept={winners?.spark ? `${winners.spark.position} • ${winners.spark.dept}` : "-"} 
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