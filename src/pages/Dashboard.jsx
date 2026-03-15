import { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Trophy, Lock, Star, Zap, Target, ShieldCheck, Crown } from 'lucide-react';

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
            <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden">
              <img src={`https://ui-avatars.com/api/?name=${winnerName}&background=random`} alt="Winner" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-black text-tsa-dark leading-tight">{winnerName}</p>
              <p className="text-[10px] font-bold text-tsa-green uppercase tracking-widest">{winnerDept}</p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-xl border border-dashed border-gray-300 w-full">
            <Lock size={14} className="text-gray-400" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">To be announced</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Q1');

  // Simulasi Status Admin (Nanti diambil dari database Phase 6)
  const periodStatus = {
    Q1: 'ACTIVE', // ACTIVE, LOCKED, PUBLISHED
    Q2: 'LOCKED',
    Q3: 'LOCKED',
    Q4: 'LOCKED',
    'End of Term': 'LOCKED'
  };

  const tabs = ['Q1', 'Q2', 'Q3', 'Q4', 'End of Term'];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 mt-8">
        {/* HEADER & GREETINGS (FASE 4) */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-tsa-dark tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Welcome back, <span className="font-black text-tsa-green">{user?.full_name || 'User'}</span>
          </p>
        </div>

        {/* TAB NAVIGATION (FASE 5) */}
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
          {periodStatus[activeTab] === 'LOCKED' ? (
            
            /* UI TERKUNCI */
            <div className="bg-white border border-gray-100 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Lock size={24} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-black text-tsa-dark mb-2">Period Locked</h2>
              <p className="text-sm text-gray-500 max-w-sm">
                The evaluation period for <span className="font-bold text-gray-700">{activeTab}</span> has not yet started or is currently closed.
              </p>
            </div>
            
          ) : (
            
            /* UI LEADERBOARD (MUNCUL JIKA ACTIVE / PUBLISHED) */
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl font-black text-tsa-dark flex items-center gap-2">
                    <Trophy size={20} className="text-tsa-gold" /> 
                    {activeTab} Quarterly Awards
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Berdasarkan kalkulasi otomatis metrik kinerja & absensi.</p>
                </div>
                {/* Status Badge */}
                <span className="bg-green-50 border border-green-100 text-tsa-green text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                  {periodStatus[activeTab] === 'ACTIVE' ? 'Live Evaluation' : 'Results Published'}
                </span>
              </div>

              {/* GRID AWARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. The Ultimate MVP (Dibuat Span 2 agar menonjol jika di desktop) */}
                <div className="md:col-span-2 lg:col-span-3">
                  <AwardCard 
                    title="The Ultimate MVP" 
                    description="Performa paling seimbang di 5 aspek kualitatif dan tingkat kehadiran riil di lapangan."
                    icon={Crown} 
                    bgClass="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border-blue-100"
                    iconColor="text-blue-500"
                    isPublished={periodStatus[activeTab] === 'PUBLISHED'} 
                    winnerName="To be announced" 
                    winnerDept="-" 
                  />
                </div>

                <AwardCard 
                  title="The Reliable One" 
                  description="Ketaatan SOP (Discipline) dan konsistensi kehadiran (Attendance) tertinggi."
                  icon={ShieldCheck} 
                  bgClass="bg-white"
                  iconColor="text-emerald-500"
                  isPublished={periodStatus[activeTab] === 'PUBLISHED'} 
                />
                
                <AwardCard 
                  title="The High Achiever" 
                  description="Kualitas eksekusi (Agility) dan inisiatif gerak cepat (Active) paling unggul."
                  icon={Target} 
                  bgClass="bg-white"
                  iconColor="text-red-500"
                  isPublished={periodStatus[activeTab] === 'PUBLISHED'} 
                />
                
                <AwardCard 
                  title="The Spark" 
                  description="Paling komunikatif, ramah (Cheerful), dan memiliki tata krama luar biasa (Attitude)."
                  icon={Zap} 
                  bgClass="bg-white"
                  iconColor="text-amber-500"
                  isPublished={periodStatus[activeTab] === 'PUBLISHED'} 
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