import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Vote, Star, Trophy, AlertCircle, CheckCircle2, Save, Loader2, Lock, Users, Sparkles, Building2 } from 'lucide-react';

// ==========================================
// KOMPONEN BINTANG UNTUK EVALUASI BPH
// ==========================================
const StarRating = ({ label, value, onChange, readOnly }) => {
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange(star)}
            className={`transition-all duration-200 ${readOnly ? 'cursor-default' : 'hover:scale-110'}`}
          >
            <Star size={20} className={star <= value ? "fill-tsa-gold text-tsa-gold" : "fill-gray-100 text-gray-200"} />
          </button>
        ))}
      </div>
    </div>
  );
};

const Voting = () => {
  const { user } = useAuth();
  
  // Data State
  const [usersList, setUsersList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isVoted, setIsVoted] = useState(false);
  const [votingActive, setVotingActive] = useState(false);

  // Voting State Arrays (Ranked Choice)
  const [mvpVotes, setMvpVotes] = useState(['', '', '', '', '']); // Top 5
  const [rookieVotes, setRookieVotes] = useState(['', '', '']); // Top 3
  const [projectVotes, setProjectVotes] = useState(['', '', '']); // Top 3
  const [favEbVotes, setFavEbVotes] = useState(['', '', '', '', '']); // Top 5

  // Evaluasi Khusus BPH/ADV State (Absolut 1-5 Bintang)
  const [evalDeptVotes, setEvalDeptVotes] = useState({ 'ERBD': 0, 'MD': 0, 'STD': 0 });
  const [evalProjectVotes, setEvalProjectVotes] = useState({});

  // Pengecekan Role
  const role = user?.role;
  const isStaff = role === 5;
  const isEB = role === 3 || role === 4;
  const isBPHADV = role === 2;

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Cek Status Buka/Tutup Voting dari Admin
      const { data: settings } = await supabase.from('app_settings').select('voting_status').eq('id', 1).single();
      const isActive = settings?.voting_status === 'ACTIVE';
      setVotingActive(isActive);

      if (isActive && user) {
        // 2. Cek apakah user ini sudah pernah vote (Mencegah double vote)
        const { data: existingVotes } = await supabase.from('end_of_term_votes').select('id').eq('voter_id', user.id).limit(1);
        if (existingVotes && existingVotes.length > 0) {
          setIsVoted(true);
          setLoading(false);
          return; // Stop eksekusi jika sudah pernah vote
        }

        // 3. Tarik Kandidat Pengurus & Project
        const [usersRes, projectsRes] = await Promise.all([
          supabase.from('users').select('*').neq('role', 1).eq('is_active', true).order('full_name', { ascending: true }),
          supabase.from('projects').select('*').order('name', { ascending: true })
        ]);

        setUsersList(usersRes.data || []);
        
        const projs = projectsRes.data || [];
        setProjectsList(projs);

        // Inisialisasi state evaluasi project (untuk BPH) agar default 0 bintang
        if (role === 2) {
          const initProjEval = {};
          projs.forEach(p => initProjEval[p.id] = 0);
          setEvalProjectVotes(initProjEval);
        }
      }
    } catch (error) {
      console.error("Error fetching voting data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk mengecek duplikasi (O(N))
  const checkDuplicate = (arr) => {
    const filled = arr.filter(val => val !== '');
    return new Set(filled).size !== filled.length;
  };

  // Handler Perubahan State Voting RCV
  const handleVoteChange = (category, index, value) => {
    if (category === 'mvp') {
      const newVotes = [...mvpVotes]; newVotes[index] = value; setMvpVotes(newVotes);
    } else if (category === 'rookie') {
      const newVotes = [...rookieVotes]; newVotes[index] = value; setRookieVotes(newVotes);
    } else if (category === 'project') {
      const newVotes = [...projectVotes]; newVotes[index] = value; setProjectVotes(newVotes);
    } else if (category === 'faveb') {
      const newVotes = [...favEbVotes]; newVotes[index] = value; setFavEbVotes(newVotes);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === 1) return alert("Admin dilarang ikut serta dalam voting.");
    
    // 1. Validasi Duplikasi Mutlak
    if (checkDuplicate(mvpVotes)) return alert('Terdapat kandidat The Ultimate MVP yang duplikat!');
    if (checkDuplicate(rookieVotes)) return alert('Terdapat kandidat Rookie of the Year yang duplikat!');
    if (checkDuplicate(projectVotes)) return alert('Terdapat nominasi Best Project yang duplikat!');
    if (isStaff && checkDuplicate(favEbVotes)) return alert('Terdapat kandidat Favorite EB yang duplikat!');

    // 2. Validasi Wajib Isi Rank 1 (Top 1 tidak boleh kosong)
    if (!mvpVotes[0]) return alert('Anda wajib mengisi Rank 1 untuk The Ultimate MVP!');
    if (!rookieVotes[0]) return alert('Anda wajib mengisi Rank 1 untuk Rookie of the Year!');
    if (!projectVotes[0]) return alert('Anda wajib mengisi Rank 1 untuk Best Project!');
    if (isStaff && !favEbVotes[0]) return alert('Anda wajib mengisi Rank 1 untuk Most Favorite EB!');

    // Validasi BPH Wajib Evaluasi Bintang
    if (isBPHADV) {
      if (Object.values(evalDeptVotes).includes(0)) return alert("BPH wajib memberikan nilai (minimal 1 Bintang) untuk seluruh Departemen!");
      if (Object.values(evalProjectVotes).includes(0)) return alert("BPH wajib memberikan nilai (minimal 1 Bintang) untuk seluruh Program Kerja!");
    }

    setSubmitting(true);
    try {
      const payload = [];

      // A. Menyiapkan Payload RCV (Semua Role 2-5)
      payload.push({ voter_id: user.id, category: 'MVP', rank_1: mvpVotes[0], rank_2: mvpVotes[1], rank_3: mvpVotes[2], rank_4: mvpVotes[3], rank_5: mvpVotes[4] });
      payload.push({ voter_id: user.id, category: 'ROOKIE', rank_1: rookieVotes[0], rank_2: rookieVotes[1], rank_3: rookieVotes[2] });
      payload.push({ voter_id: user.id, category: 'PROJECT', rank_1: projectVotes[0], rank_2: projectVotes[1], rank_3: projectVotes[2] });
      
      // B. Menyiapkan Payload Fav EB (Hanya Role 5)
      if (isStaff) {
        payload.push({ voter_id: user.id, category: 'FAV_EB', rank_1: favEbVotes[0], rank_2: favEbVotes[1], rank_3: favEbVotes[2], rank_4: favEbVotes[3], rank_5: favEbVotes[4] });
      }

      // C. Menyiapkan Payload Evaluasi (Hanya Role 2)
      if (isBPHADV) {
        Object.entries(evalDeptVotes).forEach(([dept, score]) => {
          payload.push({ voter_id: user.id, category: 'EVAL_DEPT', target_id: dept, evaluation_score: score });
        });
        Object.entries(evalProjectVotes).forEach(([projId, score]) => {
          payload.push({ voter_id: user.id, category: 'EVAL_PROJECT', target_id: projId, evaluation_score: score });
        });
      }

      // Tembakkan ke Database
      const { error } = await supabase.from('end_of_term_votes').insert(payload);
      if (error) throw error;

      setIsVoted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      alert('Gagal merekam suara: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // --- KANDIDAT FILTERING ---
  // MVP: Seluruh Pengurus Aktif
  const mvpCandidates = usersList;
  // Rookie: Hanya angkatan termuda (Cohort terbaru, asumsikan "TELADAN 26")
  const rookieCandidates = usersList.filter(u => u.cohort.includes('26') || u.cohort.includes('25')); // Ganti sesuai cohort aslimu jika perlu
  // EB: Hanya yang rolenya 2,3,4 (BPH, ADV, Kadep, Kadiv)
  const ebCandidates = usersList.filter(u => u.role >= 2 && u.role <= 4);

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
          <div className="flex justify-center items-center py-32"><Loader2 className="animate-spin text-tsa-green" size={40} /></div>
        ) : !votingActive ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-3xl p-20 flex flex-col items-center justify-center text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Lock size={32} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-black text-tsa-dark mb-2">Voting Booth Locked</h2>
            <p className="text-sm text-gray-500 max-w-md">Bilik suara belum dibuka atau telah ditutup secara permanen oleh Admin.</p>
          </div>
        ) : role === 1 ? (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-20 flex flex-col items-center justify-center text-center animate-fade-in-up">
            <h2 className="text-2xl font-black text-red-600 mb-2">Akses Ditolak</h2>
            <p className="text-sm text-gray-600 max-w-md">Sesuai SOP R.E.W.A.R.D, Administrator sistem (Role 1) dilarang berpartisipasi dalam pemungutan suara untuk menjaga netralitas mutlak.</p>
          </div>
        ) : isVoted ? (
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-3xl p-20 flex flex-col items-center justify-center text-center animate-fade-in-up shadow-sm">
            <CheckCircle2 size={64} className="text-emerald-500 mb-6" />
            <h2 className="text-2xl font-black text-tsa-dark mb-2 tracking-tight">Vote Submitted Successfully</h2>
            <p className="text-sm text-gray-600 max-w-md font-medium leading-relaxed">
              Hak suara Anda telah terekam secara anonim di dalam sistem dengan enkripsi penuh. Pengumuman <strong>Hall of Fame</strong> akan dirilis secara LIVE pada akhir kepengurusan.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in-up">
            
            {/* ========================================== */}
            {/* KATEGORI RCV UMUM (Semua Bisa Vote) */}
            {/* ========================================== */}
            
            {/* 1. THE ULTIMATE MVP (Top 5) */}
            <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
              <div className="flex items-start gap-4 mb-6 border-b border-gray-100 pb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 border border-blue-100"><Trophy size={24} className="text-blue-500" /></div>
                <div>
                  <h2 className="text-lg font-black text-tsa-dark uppercase tracking-widest">The Ultimate MVP of the Year</h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">Pilih 5 pengurus dengan performa paling stabil dan unggul secara keseluruhan. (Rank 1 = 5 Poin, Rank 5 = 1 Poin).</p>
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((rank, index) => (
                  <div key={`mvp-${rank}`} className="flex items-center gap-3">
                    <span className="w-20 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-3 rounded-xl text-center border border-gray-100 shrink-0">Rank {rank}</span>
                    <select value={mvpVotes[index]} onChange={(e) => handleVoteChange('mvp', index, e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl text-sm font-bold text-tsa-dark focus:outline-none focus:border-tsa-green bg-white shadow-sm">
                      <option value="">-- Pilih Kandidat Pengurus --</option>
                      {mvpCandidates.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.position})</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. ROOKIE OF THE YEAR (Top 3) */}
            <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
              <div className="flex items-start gap-4 mb-6 border-b border-gray-100 pb-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100"><Sparkles size={24} className="text-emerald-500" /></div>
                <div>
                  <h2 className="text-lg font-black text-tsa-dark uppercase tracking-widest">Rookie of the Year</h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">Pilih 3 angkatan termuda dengan daya adaptasi dan eksekusi paling progresif. (Rank 1 = 3 Poin, Rank 3 = 1 Poin).</p>
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((rank, index) => (
                  <div key={`rookie-${rank}`} className="flex items-center gap-3">
                    <span className="w-20 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-3 rounded-xl text-center border border-gray-100 shrink-0">Rank {rank}</span>
                    <select value={rookieVotes[index]} onChange={(e) => handleVoteChange('rookie', index, e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl text-sm font-bold text-tsa-dark focus:outline-none focus:border-tsa-green bg-white shadow-sm">
                      <option value="">-- Pilih Rookie (Angkatan Muda) --</option>
                      {rookieCandidates.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.dept})</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. BEST PROJECT OF THE YEAR (Top 3) */}
            <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
              <div className="flex items-start gap-4 mb-6 border-b border-gray-100 pb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0 border border-purple-100"><Star size={24} className="text-purple-500" /></div>
                <div>
                  <h2 className="text-lg font-black text-tsa-dark uppercase tracking-widest">Best Project of the Year</h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">Pilih 3 program kerja paling berdampak dan tereksekusi dengan baik. (Rank 1 = 3 Poin, Rank 3 = 1 Poin).</p>
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((rank, index) => (
                  <div key={`proj-${rank}`} className="flex items-center gap-3">
                    <span className="w-20 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-3 rounded-xl text-center border border-gray-100 shrink-0">Rank {rank}</span>
                    <select value={projectVotes[index]} onChange={(e) => handleVoteChange('project', index, e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl text-sm font-bold text-tsa-dark focus:outline-none focus:border-tsa-green bg-white shadow-sm">
                      <option value="">-- Pilih Program Kerja (Nominasi) --</option>
                      {projectsList.map(p => <option key={p.id} value={p.id}>{p.name} ({p.pct})</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </section>

            {/* ========================================== */}
            {/* KATEGORI EKSKLUSIF (Berdasarkan Role) */}
            {/* ========================================== */}

            {/* A. MOST FAVORITE EB (HANYA STAFF) */}
            {isStaff && (
              <section className="bg-white p-6 md:p-8 rounded-3xl border border-amber-200 shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-tsa-gold"></div>
                <div className="absolute top-0 right-0 p-4 opacity-5"><Vote size={120} /></div>
                
                <div className="relative z-10 flex items-start gap-4 mb-6 border-b border-gray-100 pb-4">
                  <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0 border border-yellow-100"><Crown size={24} className="text-tsa-gold" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-tsa-dark uppercase tracking-widest">Most Favorite EB</h2>
                      <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border border-amber-200">Staff Right Only</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium mt-1">Sosok pimpinan (BPH/ADV/KADEP/KADIV) yang paling menginspirasi. Hak suara ini mutlak milik Anda dan tidak melibatkan dewan lain.</p>
                  </div>
                </div>
                
                <div className="relative z-10 space-y-3">
                  {[1, 2, 3, 4, 5].map((rank, index) => (
                    <div key={`faveb-${rank}`} className="flex items-center gap-3">
                      <span className="w-20 text-[10px] font-black text-tsa-gold uppercase tracking-widest bg-yellow-50 px-3 py-3 rounded-xl text-center border border-yellow-100 shrink-0">Rank {rank}</span>
                      <select value={favEbVotes[index]} onChange={(e) => handleVoteChange('faveb', index, e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl text-sm font-bold text-tsa-dark focus:outline-none focus:border-tsa-gold bg-white shadow-sm hover:border-tsa-gold">
                        <option value="">-- Pilih Executive Board --</option>
                        {ebCandidates.map(eb => <option key={eb.id} value={eb.id}>{eb.full_name} ({eb.position})</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* B. EVALUASI BPH (HANYA BPH & ADV) */}
            {isBPHADV && (
              <section className="bg-gradient-to-br from-gray-900 to-black p-6 md:p-8 rounded-3xl border border-gray-800 shadow-xl relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldCheck size={120} className="text-tsa-gold" /></div>
                
                <div className="relative z-10 flex items-start gap-4 mb-6 border-b border-gray-800 pb-4">
                  <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center shrink-0 border border-gray-700"><ShieldCheck size={24} className="text-tsa-gold" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-white uppercase tracking-widest">Executive Assessment</h2>
                      <span className="bg-yellow-500/20 text-tsa-gold text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border border-tsa-gold/30">Directors Right</span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium mt-1">
                      Evaluasi kualitatif absolut (1-5 Bintang) terkait kelancaran program kerja, serapan anggaran, dan kerapian birokrasi. Evaluasi ini menyumbang 20-50% metrik kalkulasi departemen dan project.
                    </p>
                  </div>
                </div>
                
                <div className="relative z-10 space-y-8">
                  {/* Evaluasi 3 Departemen Inti */}
                  <div className="bg-gray-800/50 p-5 rounded-2xl border border-gray-700">
                    <h3 className="font-bold text-tsa-gold text-sm mb-4 uppercase tracking-widest flex items-center gap-2"><Building2 size={16}/> Department Bureaucracy Eval</h3>
                    {['ERBD', 'MD', 'STD'].map(dept => (
                      <StarRating 
                        key={dept} label={`${dept} Department`} value={evalDeptVotes[dept]} 
                        onChange={(val) => setEvalDeptVotes({...evalDeptVotes, [dept]: val})} 
                      />
                    ))}
                  </div>

                  {/* Evaluasi Nominasi Project */}
                  <div className="bg-gray-800/50 p-5 rounded-2xl border border-gray-700">
                    <h3 className="font-bold text-tsa-gold text-sm mb-4 uppercase tracking-widest flex items-center gap-2"><Star size={16}/> Project Execution Eval</h3>
                    {projectsList.length === 0 ? (
                      <p className="text-xs text-gray-500 font-medium">Belum ada nominasi project yang didaftarkan Admin.</p>
                    ) : (
                      projectsList.map(proj => (
                        <StarRating 
                          key={proj.id} label={proj.name} value={evalProjectVotes[proj.id] || 0} 
                          onChange={(val) => setEvalProjectVotes({...evalProjectVotes, [proj.id]: val})} 
                        />
                      ))
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* INFO & SUBMIT */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                Sistem akan menolak secara otomatis jika terdapat duplikasi kandidat di kategori yang sama. <strong>Hak suara tidak dapat diubah setelah tombol Submit ditekan.</strong>
              </p>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-tsa-green text-white py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
            >
              {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Confirm & Submit Votes
            </button>

          </form>
        )}
      </main>
    </div>
  );
};

export default Voting;