import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { Trophy, Medal, Star, Target, Users } from 'lucide-react';

const Results = () => {
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateResults();
  }, []);

  const calculateResults = async () => {
    setLoading(true);

    // 1. Tarik Data Anggota (Hanya Member)
    const { data: members } = await supabase.from('users').select('*').eq('role', 'member');
    
    // 2. Tarik Data Penilaian Q1
    const { data: assessments } = await supabase.from('assessments').eq('period', 'Q1');

    if (!members || !assessments) {
        setLoading(false);
        return;
    }

    let resultsData = members.map(member => {
        // Ambil semua penilaian untuk member ini
        const memberAssessments = assessments.filter(a => a.target_id === member.id);
        
        // Pisahkan data EB dan data Sekre (Attendance)
        const ebAssessments = memberAssessments.filter(a => a.attitude_score > 0);
        const sekreAssessment = memberAssessments.find(a => a.attendance_score > 0);

        // Ambil skor absensi (jika belum diisi sekre, anggap 0)
        const attendance = sekreAssessment ? sekreAssessment.attendance_score : 0;

        // Hitung rata-rata penilaian EB
        let attitude = 0, discipline = 0, active = 0, agility = 0, cheerful = 0;
        const totalEb = ebAssessments.length;

        if (totalEb > 0) {
            attitude = ebAssessments.reduce((acc, curr) => acc + curr.attitude_score, 0) / totalEb;
            discipline = ebAssessments.reduce((acc, curr) => acc + curr.discipline_score, 0) / totalEb;
            active = ebAssessments.reduce((acc, curr) => acc + curr.active_score, 0) / totalEb;
            agility = ebAssessments.reduce((acc, curr) => acc + curr.agility_score, 0) / totalEb;
            cheerful = ebAssessments.reduce((acc, curr) => acc + curr.cheerful_score, 0) / totalEb;
        }

        // IMPLEMENTASI RUMUS BLUEPRINT FINAL
        const reliableOne = (attendance * 0.5) + (discipline * 0.5);
        const highAchiever = (agility * 0.6) + (active * 0.4);
        const spark = (cheerful * 0.6) + (attitude * 0.4);
        
        // Ultimate MVP = (15% per kualitatif) + 25% attendance
        const avgKualitatif = (attitude * 0.15) + (discipline * 0.15) + (active * 0.15) + (agility * 0.15) + (cheerful * 0.15);
        const ultimateMVP = avgKualitatif + (attendance * 0.25);

        return {
            ...member,
            scores: { reliableOne, highAchiever, spark, ultimateMVP }
        };
    });

    // Cari Pemenang per Kategori (Sortir Descending)
    const getWinner = (key) => [...resultsData].sort((a, b) => b.scores[key] - a.scores[key])[0];

    // Hitung Best Department
    const deptScores = {};
    resultsData.forEach(m => {
        if (!deptScores[m.dept]) deptScores[m.dept] = { totalMvp: 0, count: 0 };
        deptScores[m.dept].totalMvp += m.scores.ultimateMVP;
        deptScores[m.dept].count += 1;
    });

    let bestDeptName = "-";
    let highestDeptScore = 0;
    Object.keys(deptScores).forEach(dept => {
        const avgScore = deptScores[dept].totalMvp / deptScores[dept].count;
        if (avgScore > highestDeptScore) {
            highestDeptScore = avgScore;
            bestDeptName = dept;
        }
    });

    setLeaderboard({
        reliableOne: getWinner('reliableOne'),
        highAchiever: getWinner('highAchiever'),
        spark: getWinner('spark'),
        ultimateMVP: getWinner('ultimateMVP'),
        bestDepartment: { name: bestDeptName, score: highestDeptScore }
    });

    setLoading(false);
  };

  const WinnerCard = ({ title, winner, score, icon: Icon, colorClass }) => (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 relative overflow-hidden">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white flex-shrink-0 ${colorClass}`}>
              <Icon size={28} />
          </div>
          <div className="z-10">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{title}</h3>
              <p className="text-lg font-bold text-tsa-dark leading-tight mt-1">{winner ? winner.full_name : 'N/A'}</p>
              <p className="text-xs text-tsa-green font-bold mt-1">Score: {score ? score.toFixed(2) : '0'}</p>
          </div>
          {/* Background Decoration */}
          <Icon size={120} className="absolute -right-6 -bottom-6 text-gray-50 opacity-50 z-0" />
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-tsa-dark">Quarterly Awards (Q1)</h1>
          <p className="text-sm text-gray-500">Kalkulasi algoritma otomatis berdasarkan Blueprint TSA 2026.</p>
        </div>

        {loading ? (
             <div className="text-center py-20 text-gray-400 font-bold">Calculating Leaderboard...</div>
        ) : leaderboard ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* ULTIMATE MVP (Full Width) */}
                <div className="md:col-span-2 bg-gradient-to-r from-tsa-green to-emerald-900 p-8 rounded-3xl shadow-lg flex items-center gap-6 text-white relative overflow-hidden">
                    <div className="w-24 h-24 rounded-full border-4 border-tsa-gold overflow-hidden z-10 bg-white">
                        <img src={leaderboard.ultimateMVP?.photo_url || `https://ui-avatars.com/api/?name=${leaderboard.ultimateMVP?.full_name}`} alt="MVP" className="w-full h-full object-cover" />
                    </div>
                    <div className="z-10">
                        <div className="flex items-center gap-2 text-tsa-gold font-bold text-xs uppercase tracking-widest mb-1">
                            <Trophy size={16} /> THE ULTIMATE MVP
                        </div>
                        <h2 className="text-3xl font-bold">{leaderboard.ultimateMVP?.full_name}</h2>
                        <p className="text-sm text-emerald-100 mt-1">{leaderboard.ultimateMVP?.dept} • Score: {leaderboard.ultimateMVP?.scores.ultimateMVP.toFixed(2)}</p>
                    </div>
                    <Star size={200} className="absolute -right-10 -bottom-10 text-white opacity-10 z-0 transform rotate-12" />
                </div>

                {/* 3 Kategori Individu */}
                <WinnerCard title="The Reliable One" winner={leaderboard.reliableOne} score={leaderboard.reliableOne?.scores.reliableOne} icon={Target} colorClass="bg-blue-500" />
                <WinnerCard title="The High Achiever" winner={leaderboard.highAchiever} score={leaderboard.highAchiever?.scores.highAchiever} icon={Medal} colorClass="bg-purple-500" />
                <WinnerCard title="The Spark" winner={leaderboard.spark} score={leaderboard.spark?.scores.spark} icon={Star} colorClass="bg-pink-500" />
                
                {/* Best Department */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-white bg-tsa-gold flex-shrink-0">
                        <Users size={28} />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Best Department</h3>
                        <p className="text-xl font-bold text-tsa-dark leading-tight mt-1">{leaderboard.bestDepartment.name}</p>
                        <p className="text-xs text-tsa-green font-bold mt-1">Avg Score: {leaderboard.bestDepartment.score.toFixed(2)}</p>
                    </div>
                </div>

            </div>
        ) : null}
      </main>
    </div>
  );
};

export default Results;