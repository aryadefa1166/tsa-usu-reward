import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Vote, Star, Trophy, AlertCircle, CheckCircle2, Save, Loader2, Lock } from 'lucide-react';

const Voting = () => {
  const { user } = useAuth();
  
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isVoted, setIsVoted] = useState(false); // Flag jika user sudah pernah voting

  // State Pilihan Voting Bertingkat
  const [mvpVotes, setMvpVotes] = useState(['', '', '', '', '']); // 5 Pilihan
  const [projectVotes, setProjectVotes] = useState(['', '', '']); // 3 Pilihan
  const [favEbVotes, setFavEbVotes] = useState(['', '', '', '', '']); // 5 Pilihan (Khusus Staff)

  // Data Dummy Project (Bisa diganti dengan fetch dari database tabel 'projects' nantinya)
  const projectsList = [
    { id: 'p1', name: 'TSA REWARD System' },
    { id: 'p2', name: 'Pagelaran Seni' },
    { id: 'p3', name: 'Campus Safety Application' },
    { id: 'p4', name: 'Mental Health Monitoring App' },
    { id: 'p5', name: 'Bukber Duta Mahasiswa' }
  ];

  // Simulasi Kontrol Admin
  const isVotingOpen = true; // Ubah ke false jika ingin melihat UI Gembok

  const isStaff = user?.role === 'member';

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'admin')
        .order('full_name', { ascending: true }); // Diurutkan abjad agar mudah dicari

      if (error) throw error;
      setUsersList(data || []);
      
      // Opsional: Cek apakah user ini sudah pernah submit voting sebelumnya di database
      // Jika sudah, setIsVoted(true)
      
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk mengecek duplikasi (O(N))
  const checkDuplicate = (arr) => {
    const filled = arr.filter(val => val !== '');
    return new Set(filled).size !== filled.length;
  };

  const handleVoteChange = (category, index, value) => {
    if (category === 'mvp') {
      const newVotes = [...mvpVotes];
      newVotes[index] = value;
      setMvpVotes(newVotes);
    } else if (category === 'project') {
      const newVotes = [...projectVotes];
      newVotes[index] = value;
      setProjectVotes(newVotes);
    } else if (category === 'faveb') {
      const newVotes = [...favEbVotes];
      newVotes[index] = value;
      setFavEbVotes(newVotes);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Validasi Duplikasi
    if (checkDuplicate(mvpVotes)) return alert('Error: Terdapat nama kandidat MVP yang sama di rank yang berbeda!');
    if (checkDuplicate(projectVotes)) return alert('Error: Terdapat nama project yang sama di rank yang berbeda!');
    if (isStaff && checkDuplicate(favEbVotes)) return alert('Error: Terdapat nama kandidat Favorite EB yang sama di rank yang berbeda!');

    // 2. Validasi Kelengkapan (Opsional: Apakah harus isi semua? Kita asumsikan wajib isi minimal Rank 1)
    if (!mvpVotes[0] || !projectVotes[0] || (isStaff && !favEbVotes[0])) {
      return alert('Error: Anda wajib mengisi minimal Pilihan 1 (Rank 1) untuk setiap kategori!');
    }

    setSubmitting(true);
    try {
      // LOGIKA DATABASE:
      // Di sini kita akan menginsert data ke tabel 'votes' beserta bobot poinnya.
      // Rank 1 = 5 Poin, Rank 2 = 4 Poin, dst.
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulasi proses
      setIsVoted(true);
      alert('Voting berhasil disubmit! Terima kasih atas partisipasi Anda.');

    } catch (error) {
      alert('Gagal mengirim voting: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Kandidat
  const ebCandidates = usersList.filter(u => u.role !== 'member');

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 mt-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-tsa-dark tracking-tight flex items-center gap-3">
            <Vote className="text-tsa-gold" size={36} /> End of Term Voting
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Sistem pemilihan menggunakan <strong>Ranked Choice Voting</strong> berbobot. Pastikan pilihan Anda presisi.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-32">
             <Loader2 className="animate-spin text-tsa-green" size={40} />
          </div>
        ) : !isVotingOpen ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-3xl p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Lock size={32} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-black text-tsa-dark mb-2">Voting Locked</h2>
            <p className="text-sm text-gray-500 max-w-md">Sesi pemungutan suara akhir kepengurusan belum dibuka oleh Admin.</p>
          </div>
        ) : isVoted ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-20 flex flex-col items-center justify-center text-center animate-fade-in-up">
            <CheckCircle2 size={64} className="text-emerald-500 mb-6" />
            <h2 className="text-2xl font-black text-tsa-dark mb-2">Vote Submitted Successfully</h2>
            <p className="text-sm text-gray-600 max-w-md">
              Hak suara Anda telah terekam secara anonim di dalam sistem dengan enkripsi penuh. Pengumuman pemenang akan dirilis pada Hari H.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in-up">
            
            {/* KATEGORI 1: THE ULTIMATE MVP */}
            <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-start gap-4 mb-6 border-b border-gray-100 pb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Trophy size={24} className="text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-tsa-dark uppercase tracking-widest">The Ultimate MVP of the Year</h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">Pilih 5 pengurus dengan performa paling stabil dan unggul. (Rank 1 = 5 Poin, Rank 5 = 1 Poin).</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((rank, index) => (
                  <div key={`mvp-${rank}`} className="flex items-center gap-3">
                    <span className="w-20 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-3 rounded-xl text-center border border-gray-100 shrink-0">
                      Rank {rank}
                    </span>
                    <select 
                      value={mvpVotes[index]}
                      onChange={(e) => handleVoteChange('mvp', index, e.target.value)}
                      className="w-full border border-gray-200 p-3 rounded-xl text-sm font-bold text-tsa-dark focus:outline-none focus:border-tsa-green bg-white shadow-sm"
                    >
                      <option value="">-- Pilih Kandidat --</option>
                      {usersList.map(u => (
                        <option key={u.id} value={u.id}>{u.full_name} ({u.position})</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </section>

            {/* KATEGORI 2: BEST PROJECT */}
            <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-start gap-4 mb-6 border-b border-gray-100 pb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                  <Star size={24} className="text-purple-500" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-tsa-dark uppercase tracking-widest">Best Project of the Year</h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">Pilih 3 program kerja paling berdampak. (Rank 1 = 3 Poin, Rank 3 = 1 Poin).</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {[1, 2, 3].map((rank, index) => (
                  <div key={`proj-${rank}`} className="flex items-center gap-3">
                    <span className="w-20 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-3 rounded-xl text-center border border-gray-100 shrink-0">
                      Rank {rank}
                    </span>
                    <select 
                      value={projectVotes[index]}
                      onChange={(e) => handleVoteChange('project', index, e.target.value)}
                      className="w-full border border-gray-200 p-3 rounded-xl text-sm font-bold text-tsa-dark focus:outline-none focus:border-tsa-green bg-white shadow-sm"
                    >
                      <option value="">-- Pilih Program Kerja --</option>
                      {projectsList.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </section>

            {/* KATEGORI 3: MOST FAVORITE EB (KHUSUS STAFF) */}
            {isStaff && (
              <section className="bg-white p-6 md:p-8 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Vote size={120} />
                </div>
                <div className="relative z-10 flex items-start gap-4 mb-6 border-b border-gray-100 pb-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                    <Star size={24} className="text-emerald-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-tsa-dark uppercase tracking-widest">Most Favorite EB</h2>
                      <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">Staff Only</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium mt-1">Sosok pimpinan (BPH/ADV/KADEP/KADIV) yang paling menginspirasi. Hak suara murni milik Anda.</p>
                  </div>
                </div>
                
                <div className="relative z-10 space-y-3">
                  {[1, 2, 3, 4, 5].map((rank, index) => (
                    <div key={`faveb-${rank}`} className="flex items-center gap-3">
                      <span className="w-20 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-3 rounded-xl text-center border border-gray-100 shrink-0">
                        Rank {rank}
                      </span>
                      <select 
                        value={favEbVotes[index]}
                        onChange={(e) => handleVoteChange('faveb', index, e.target.value)}
                        className="w-full border border-gray-200 p-3 rounded-xl text-sm font-bold text-tsa-dark focus:outline-none focus:border-tsa-green bg-white shadow-sm"
                      >
                        <option value="">-- Pilih EB --</option>
                        {ebCandidates.map(eb => (
                          <option key={eb.id} value={eb.id}>{eb.full_name} ({eb.position})</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                Sistem akan memblokir otomatis jika terdapat nama kandidat ganda (duplikat) di dalam satu kategori yang sama. Mohon periksa kembali pilihan Rank 1 hingga Rank terakhir Anda.
              </p>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-tsa-dark text-white py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
            >
              {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Submit Final Votes
            </button>

          </form>
        )}
      </main>
    </div>
  );
};

export default Voting;