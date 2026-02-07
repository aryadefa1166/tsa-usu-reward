import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Medal, Send, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Voting = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [candidatesMember, setCandidatesMember] = useState([]); // List Teman
  const [candidatesEb, setCandidatesEb] = useState([]); // List Bos
  
  // State Pilihan User
  const [voteTerasik, setVoteTerasik] = useState('');
  const [voteFavorit, setVoteFavorit] = useState('');
  
  // Cek apakah sudah vote?
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Cek apakah user ini sudah pernah ngevote di Q1?
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('voter_id', user.id)
        .eq('period', 'Q1');

      if (existingVote && existingVote.length > 0) {
        setHasVoted(true);
        setLoading(false);
        return;
      }

      // 2. Ambil list User untuk Kandidat
      const { data: users } = await supabase
        .from('users')
        .select('id, username, role, dept')
        .neq('id', user.id) // Jangan pilih diri sendiri
        .neq('role', 'admin') // Admin gak ikut main
        .order('username');

      if (users) {
        // Filter: Terasik = Member only
        setCandidatesMember(users.filter(u => u.role === 'member'));
        // Filter: Favorit = BPH, Kadep, Advisory
        setCandidatesEb(users.filter(u => ['bph', 'kadep', 'advisory'].includes(u.role)));
      }
      setLoading(false);
    };

    fetchData();
  }, [user.id]);

  const handleVote = async (e) => {
    e.preventDefault();
    if (!voteTerasik || !voteFavorit) return alert('Wajib pilih dua-duanya ya! 😉');
    
    setSubmitting(true);

    const payload = [
      {
        period: 'Q1',
        voter_id: user.id,
        candidate_id: voteTerasik,
        category: 'terasik'
      },
      {
        period: 'Q1',
        voter_id: user.id,
        candidate_id: voteFavorit,
        category: 'terfavorit'
      }
    ];

    const { error } = await supabase.from('votes').insert(payload);

    if (error) {
      alert('Gagal voting: ' + error.message);
    } else {
      setHasVoted(true); // Langsung ubah tampilan
    }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-emerald-800 font-medium">Memuat Kotak Suara...</div>;

  // TAMPILAN JIKA SUDAH MEMILIH
  if (hasVoted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto p-6 mt-10">
          <div className="bg-white p-10 rounded-3xl shadow-lg border border-emerald-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-amber-500"></div>
            
            <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-emerald-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-emerald-950">Terima Kasih!</h1>
            <p className="text-slate-500 mt-2">Suaramu sangat berarti untuk apresiasi teman-teman kita.</p>
            <p className="text-sm text-slate-400 mt-6 font-medium bg-slate-50 inline-block px-4 py-2 rounded-lg">
              ✨ Pemenang akan diumumkan saat Awarding Night ✨
            </p>
            
            <div className="mt-8">
              <button onClick={() => navigate('/dashboard')} className="text-emerald-700 font-bold hover:text-emerald-800 hover:underline transition-all">
                &larr; Kembali ke Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TAMPILAN FORM VOTING
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-emerald-950 tracking-tight">Voting The Spark ✨</h1>
          <p className="text-slate-500 mt-2">Pilih sosok yang paling bersinar di Kuartal ini!</p>
        </div>

        <form onSubmit={handleVote} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* KARTU 1: TEMAN TERASIK */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-amber-100 hover:border-amber-400 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles size={100} className="text-amber-500" />
            </div>
            <div className="relative z-10">
                <h2 className="text-xl font-bold text-amber-600 mb-1 flex items-center gap-2">
                    <Sparkles size={20} className="fill-amber-600" /> Teman Terasik
                </h2>
                <p className="text-xs text-slate-500 mb-6 font-medium">Member yang paling asik, helpful, & seru!</p>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Pilih Kandidat:</label>
                  <select 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium text-slate-700"
                      value={voteTerasik}
                      onChange={(e) => setVoteTerasik(e.target.value)}
                      required
                  >
                      <option value="">-- Cari Nama Teman --</option>
                      {candidatesMember.map(c => (
                          <option key={c.id} value={c.id}>{c.username} ({c.dept})</option>
                      ))}
                  </select>
                </div>
            </div>
          </div>

          {/* KARTU 2: EB TERFAVORIT */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-emerald-100 hover:border-emerald-600 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Medal size={100} className="text-emerald-600" />
            </div>
            <div className="relative z-10">
                <h2 className="text-xl font-bold text-emerald-800 mb-1 flex items-center gap-2">
                    <Medal size={20} className="fill-emerald-800" /> EB Terfavorit
                </h2>
                <p className="text-xs text-slate-500 mb-6 font-medium">Leader yang kerjanya sat-set & menginspirasi.</p>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Pilih Kandidat:</label>
                  <select 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium text-slate-700"
                      value={voteFavorit}
                      onChange={(e) => setVoteFavorit(e.target.value)}
                      required
                  >
                      <option value="">-- Cari Nama Leader --</option>
                      {candidatesEb.map(c => (
                          <option key={c.id} value={c.id}>{c.username} - {c.role.toUpperCase()}</option>
                      ))}
                  </select>
                </div>
            </div>
          </div>

          {/* TOMBOL KIRIM */}
          <div className="md:col-span-2 flex justify-center mt-6">
            <button 
                type="submit"
                disabled={submitting}
                className="bg-[#064e3b] text-white px-12 py-4 rounded-full font-bold text-lg shadow-xl shadow-emerald-900/20 hover:bg-emerald-900 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-70 disabled:scale-100"
            >
                {submitting ? 'Mengirim Suara...' : <><Send size={20} /> Kirim Pilihan Saya</>}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
};

export default Voting;