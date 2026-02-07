import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Trophy, Medal, Star, BarChart3, Lock } from 'lucide-react';
import { ROLES, PERMISSIONS } from '../utils/constants';

const Results = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('performance'); // 'performance' or 'spark'
  
  // Data Leaderboard
  const [leaderboardPerformance, setLeaderboardPerformance] = useState([]);
  const [leaderboardSpark, setLeaderboardSpark] = useState({ terasik: [], terfavorit: [] });

  // Status Publish (Nanti bisa dibikin dinamis dari DB, sekarang manual dulu)
  const IS_PUBLISHED = false; 
  const CAN_VIEW = PERMISSIONS.CAN_VIEW_REALTIME_RESULTS.includes(user.role) || IS_PUBLISHED;

  useEffect(() => {
    if (CAN_VIEW) {
      calculateResults();
    } else {
      setLoading(false);
    }
  }, [user.role]);

  const calculateResults = async () => {
    setLoading(true);

    // 1. AMBIL SEMUA DATA
    const { data: users } = await supabase.from('users').select('id, username, role, dept');
    const { data: assessments } = await supabase.from('assessments').select('*').eq('period', 'Q1');
    const { data: votes } = await supabase.from('votes').select('*').eq('period', 'Q1');

    if (!users || !assessments || !votes) {
      setLoading(false);
      return;
    }

    // --- HITUNG NILAI KINERJA (Performance) ---
    const performanceStats = users.map(u => {
        // Ambil nilai milik user ini
        const myScores = assessments.filter(a => a.target_id === u.id);
        
        if (myScores.length === 0) return null; // Skip kalau belum ada nilai

        // Hitung Rata-rata Attitude
        const totalAtt = myScores.reduce((sum, item) => sum + (item.attitude_score || 0), 0);
        const avgAtt = totalAtt / myScores.length;

        // Hitung Rata-rata Teamwork (Hanya ambil yg tidak null)
        const teamworkScores = myScores.filter(item => item.teamwork_score !== null);
        const totalTeam = teamworkScores.reduce((sum, item) => sum + (item.teamwork_score || 0), 0);
        const avgTeam = teamworkScores.length > 0 ? totalTeam / teamworkScores.length : 0;

        // Final Score (Bobot 50:50 kalau ada teamwork, atau 100 attitude kalau staf biasa)
        // Logic simpel: Rata-ratakan saja semuanya
        const finalScore = avgTeam > 0 ? (avgAtt + avgTeam) / 2 : avgAtt;

        return {
            ...u,
            avgAtt: avgAtt.toFixed(1),
            avgTeam: avgTeam > 0 ? avgTeam.toFixed(1) : '-',
            finalScore: finalScore.toFixed(2),
            count: myScores.length
        };
    }).filter(Boolean); // Hapus yg null

    // Urutkan Ranking Tertinggi
    performanceStats.sort((a, b) => b.finalScore - a.finalScore);
    setLeaderboardPerformance(performanceStats);


    // --- HITUNG VOTING (The Spark) ---
    // Helper function hitung vote
    const countVotes = (category, roleFilter) => {
        const counts = {};
        votes.filter(v => v.category === category).forEach(v => {
            counts[v.candidate_id] = (counts[v.candidate_id] || 0) + 1;
        });

        return Object.keys(counts).map(candidateId => {
            const candidate = users.find(u => u.id == candidateId);
            if (!candidate) return null;
            return {
                ...candidate,
                voteCount: counts[candidateId]
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.voteCount - a.voteCount); // Urutkan terbanyak
    };

    setLeaderboardSpark({
        terasik: countVotes('terasik'),
        terfavorit: countVotes('terfavorit')
    });

    setLoading(false);
  };

  // KOMPONEN: Podium Juara
  const Podium = ({ winners, title, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
        <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${color}`}>
            <Trophy size={20} /> Top 3 {title}
        </h3>
        <div className="flex items-end justify-center gap-4 text-center">
            {/* Juara 2 */}
            {winners[1] && (
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-xl font-bold text-slate-600 mb-2 shadow-inner">
                        2
                    </div>
                    <p className="font-bold text-sm text-slate-700">{winners[1].username}</p>
                    <p className="text-xs text-slate-400 font-mono">{winners[1].finalScore || winners[1].voteCount} pts</p>
                    <div className="h-12 w-16 bg-slate-100 rounded-t-lg mt-2"></div>
                </div>
            )}
            {/* Juara 1 */}
            {winners[0] && (
                <div className="flex flex-col items-center">
                    <div className="mb-2"><Star size={24} className="text-amber-400 fill-amber-400 animate-bounce" /></div>
                    <div className="w-20 h-20 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-2xl font-bold text-amber-600 mb-2 shadow-amber-200 shadow-lg">
                        1
                    </div>
                    <p className="font-bold text-base text-slate-800">{winners[0].username}</p>
                    <p className="text-xs text-amber-600 font-bold font-mono">{winners[0].finalScore || winners[0].voteCount} pts</p>
                    <div className="h-20 w-20 bg-amber-50 rounded-t-lg mt-2 border-t border-amber-100"></div>
                </div>
            )}
            {/* Juara 3 */}
            {winners[2] && (
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-orange-100 border-2 border-orange-300 flex items-center justify-center text-xl font-bold text-orange-700 mb-2 shadow-inner">
                        3
                    </div>
                    <p className="font-bold text-sm text-slate-700">{winners[2].username}</p>
                    <p className="text-xs text-slate-400 font-mono">{winners[2].finalScore || winners[2].voteCount} pts</p>
                    <div className="h-8 w-16 bg-orange-50 rounded-t-lg mt-2"></div>
                </div>
            )}
        </div>
    </div>
  );

  if (loading) return <div className="p-10 text-center text-emerald-800">Menghitung Kalkulasi...</div>;

  // TAMPILAN JIKA BELUM PUBLISH (Untuk Member)
  if (!CAN_VIEW) {
    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-2xl mx-auto p-10 text-center mt-10">
                <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm">
                    <Lock size={64} className="mx-auto text-slate-300 mb-6" />
                    <h1 className="text-2xl font-bold text-slate-800">Hasil Belum Dipublikasi</h1>
                    <p className="text-slate-500 mt-2">Admin sedang merekapitulasi nilai untuk periode ini.</p>
                    <p className="text-xs text-emerald-600 font-bold mt-4 uppercase tracking-widest">Stay Tuned!</p>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-5xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Hall of Fame 🏆</h1>
                <p className="text-sm text-slate-500">Rekapitulasi Penilaian & Voting Kuartal 1</p>
            </div>
            
            {/* TAB SWITCHER */}
            <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
                <button 
                    onClick={() => setActiveTab('performance')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'performance' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Rapor Kinerja
                </button>
                <button 
                    onClick={() => setActiveTab('spark')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'spark' ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    The Spark ✨
                </button>
            </div>
        </div>

        {activeTab === 'performance' ? (
            <div className="space-y-6 animate-fade-in">
                {leaderboardPerformance.length > 0 ? (
                    <>
                        <Podium winners={leaderboardPerformance} title="Kinerja Terbaik" color="text-emerald-700" />
                        
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                                    <tr>
                                        <th className="p-4 text-center w-16">#</th>
                                        <th className="p-4">Nama</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4 text-center">Attitude</th>
                                        <th className="p-4 text-center">Teamwork</th>
                                        <th className="p-4 text-center font-bold text-emerald-700">Final Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {leaderboardPerformance.map((user, idx) => (
                                        <tr key={user.id} className="hover:bg-slate-50">
                                            <td className="p-4 text-center font-mono text-slate-400">{idx + 1}</td>
                                            <td className="p-4 font-bold text-slate-700">{user.username}</td>
                                            <td className="p-4 text-xs text-slate-500 uppercase">{user.role}</td>
                                            <td className="p-4 text-center">{user.avgAtt}</td>
                                            <td className="p-4 text-center">{user.avgTeam}</td>
                                            <td className="p-4 text-center font-bold text-emerald-700 bg-emerald-50/50">{user.finalScore}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="p-10 text-center text-slate-400">Belum ada data penilaian masuk.</div>
                )}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                {/* LIST TERASIK */}
                <div>
                    <h3 className="font-bold text-amber-600 mb-4 flex items-center gap-2"><Sparkles size={20} /> Teman Terasik</h3>
                    <div className="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden">
                        {leaderboardSpark.terasik.map((u, idx) => (
                            <div key={u.id} className="p-4 border-b border-slate-100 flex justify-between items-center last:border-0 hover:bg-amber-50/30">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-slate-300 w-6">#{idx + 1}</span>
                                    <div>
                                        <p className="font-bold text-slate-700">{u.username}</p>
                                        <p className="text-xs text-slate-400">{u.dept}</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">{u.voteCount} Suara</span>
                            </div>
                        ))}
                        {leaderboardSpark.terasik.length === 0 && <div className="p-6 text-center text-slate-400 text-xs">Belum ada voting.</div>}
                    </div>
                </div>

                {/* LIST TERFAVORIT */}
                <div>
                    <h3 className="font-bold text-emerald-600 mb-4 flex items-center gap-2"><Medal size={20} /> EB Terfavorit</h3>
                    <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden">
                        {leaderboardSpark.terfavorit.map((u, idx) => (
                            <div key={u.id} className="p-4 border-b border-slate-100 flex justify-between items-center last:border-0 hover:bg-emerald-50/30">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-slate-300 w-6">#{idx + 1}</span>
                                    <div>
                                        <p className="font-bold text-slate-700">{u.username}</p>
                                        <p className="text-xs text-slate-400 uppercase">{u.role}</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">{u.voteCount} Suara</span>
                            </div>
                        ))}
                        {leaderboardSpark.terfavorit.length === 0 && <div className="p-6 text-center text-slate-400 text-xs">Belum ada voting.</div>}
                    </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

// Component Helper untuk Ikon (Biar gak error kalau lupa import)
const Sparkles = ({size}) => <Star size={size} />; 

export default Results;