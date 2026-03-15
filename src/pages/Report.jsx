import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { BarChart2, TrendingUp, Users, Shield, Award, Loader2 } from 'lucide-react';

// Komponen Visual UI untuk Indikator Nilai (Tailwind murni, tanpa library eksternal)
const ScoreBar = ({ label, score, colorClass }) => (
  <div className="mb-4">
    <div className="flex justify-between items-end mb-1">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-black ${colorClass}`}>{score ? score.toFixed(1) : '0'}/100</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <div 
        className={`h-2.5 rounded-full ${colorClass.replace('text-', 'bg-')} transition-all duration-1000 ease-out`}
        style={{ width: `${score || 0}%` }}
      ></div>
    </div>
  </div>
);

const Report = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  const isStaff = user?.role === 'member';
  const isEB = user?.role === 'kadep' || user?.role === 'kadiv';
  const isGlobal = user?.role === 'bph' || user?.role === 'adv' || user?.role === 'admin';

  useEffect(() => {
    if (user) fetchReportData();
  }, [user]);

  const fetchReportData = async () => {
    setLoading(true);
    // CATATAN LOGIKA: Di sini nanti kita akan menarik data asli dari tabel 'assessments'.
    // Untuk saat ini, kita pasang struktur UI dinamis agar tidak crash jika data Q1 belum ada.
    
    // Simulasi struktur data yang akan dihitung dari backend nanti
    setTimeout(() => {
      setReportData({
        attitude: 85,
        discipline: 70,
        active: 90,
        agility: 80,
        cheerful: 95,
        attendance: 100, // Dari input Sekretaris
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 mt-8">
        
        {/* HEADER DINAMIS BERDASARKAN ROLE */}
        <div className="mb-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
            {isStaff && <BarChart2 size={28} className="text-tsa-green" />}
            {isEB && <Users size={28} className="text-blue-500" />}
            {isGlobal && <Shield size={28} className="text-tsa-gold" />}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-tsa-dark tracking-tight">
              {isStaff ? 'My Report Card' : isEB ? 'Team Performance' : 'Global Analytics'}
            </h1>
            <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest">
              {isStaff ? 'Personal Dashboard' : isEB ? `${user?.dept || user?.division} Department` : 'Organization Overview'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-tsa-green" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* KOTAK KIRI: 5 Indikator Kualitatif EB */}
            <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black text-tsa-dark flex items-center gap-2">
                  <TrendingUp size={20} className="text-tsa-green" /> 
                  Qualitative Metrics
                </h2>
                <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Quarter 1
                </span>
              </div>
              
              <ScoreBar label="Attitude" score={reportData?.attitude} colorClass="text-emerald-500" />
              <ScoreBar label="Discipline" score={reportData?.discipline} colorClass="text-blue-500" />
              <ScoreBar label="Active" score={reportData?.active} colorClass="text-amber-500" />
              <ScoreBar label="Agility" score={reportData?.agility} colorClass="text-purple-500" />
              <ScoreBar label="Cheerful" score={reportData?.cheerful} colorClass="text-pink-500" />
            </div>

            {/* KOTAK KANAN: Attendance & Summary */}
            <div className="space-y-6">
              {/* Card Attendance */}
              <div className="bg-gradient-to-br from-tsa-dark to-gray-900 p-8 rounded-3xl shadow-md text-white">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Attendance Rate</h3>
                <div className="text-5xl font-black tracking-tighter text-tsa-gold mb-4">
                  {reportData?.attendance}%
                </div>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  Berdasarkan data kehadiran riil yang divalidasi oleh Secretary.
                </p>
              </div>

              {/* Card Estimasi Award (MVP) */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mb-3">
                  <Award size={24} className="text-tsa-gold" />
                </div>
                <h3 className="text-sm font-bold text-tsa-dark">The Ultimate MVP</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 mb-3">Projection Score</p>
                <div className="text-2xl font-black text-tsa-green">
                  {/* Algoritma Blueprint: (75% Rata-rata 5 Indikator) + (25% Kehadiran) */}
                  {reportData ? (
                    (((reportData.attitude + reportData.discipline + reportData.active + reportData.agility + reportData.cheerful) / 5) * 0.75 + (reportData.attendance * 0.25)).toFixed(1)
                  ) : '0'} / 100
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default Report;