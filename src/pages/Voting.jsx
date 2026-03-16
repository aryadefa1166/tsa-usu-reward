import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Vote, Star, Trophy, AlertCircle, CheckCircle2, Save, Loader2, Lock, Crown, Sparkles, Building2, ShieldCheck } from 'lucide-react';

// ==========================================
// KOMPONEN BINTANG UNTUK EVALUASI BPH (Disesuaikan untuk Light Mode)
// ==========================================
const StarRating = ({ label, value, onChange, readOnly }) => {
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 group">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:text-tsa-green transition-colors">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange(star)}
            className={`transition-all duration-200 ${readOnly ? 'cursor-default' : 'hover:scale-110'}`}
          >
            {/* Hapus drop shadow agar lebih clean di background putih */}
            <Star size={22} className={star <= value ? "fill-tsa-gold text-tsa-gold" : "fill-gray-100 text-gray-200"} />
          </button>
        ))}
      </div>
    </div>
  );
};

const Voting = () => {
  const { user } = useAuth();
  
  const [usersList, setUsersList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isVoted, setIsVoted] = useState(false);
  const [votingActive, setVotingActive] = useState(false);

  const [mvpVotes, setMvpVotes] = useState(['', '', '', '', '']); 
  const [rookieVotes, setRookieVotes] = useState(['', '', '']); 
  const [projectVotes, setProjectVotes] = useState(['', '', '']); 
  const [favEbVotes, setFavEbVotes] = useState(['', '', '', '', '']); 

  const [evalDeptVotes, setEvalDeptVotes] = useState({ 'ERBD': 0, 'MD': 0, 'STD': 0 });
  const [evalProjectVotes, setEvalProjectVotes] = useState({});

  const role = user?.role;
  const isStaff = role === 5;
  const isEB = role >= 3 && role <= 4;
  const isBPHADV = role === 2;
  const isAdmin = role === 1;

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: settings } = await supabase.from('app_settings').select('voting_status').eq('id', 1).single();
      const isActive = settings?.voting_status === 'ACTIVE';
      setVotingActive(isActive);

      if (isActive && user && !isAdmin) {
        const { data: existingVotes } = await supabase.from('end_of_term_votes').select('id').eq('voter_id', user.id).limit(1);
        if (existingVotes && existingVotes.length > 0) {
          setIsVoted(true);
          setLoading(false);
          return; 
        }

        const [usersRes, projectsRes] = await Promise.all([
          supabase.from('users').select('*').neq('role', 1).eq('is_active', true).order('full_name', { ascending: true }),
          supabase.from('projects').select('*').order('name', { ascending: true })
        ]);

        setUsersList(usersRes.data || []);
        const projs = projectsRes.data || [];
        setProjectsList(projs);

        if (isBPHADV) {
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

  const checkDuplicate = (arr) => {
    const filled = arr.filter(val => val !== '');
    return new Set(filled).size !== filled.length;
  };

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
    if (isAdmin) return alert("Administrators are not allowed to participate in voting.");
    
    if (checkDuplicate(mvpVotes)) return alert('Duplicate candidates found in The Ultimate MVP category!');
    if (checkDuplicate(rookieVotes)) return alert('Duplicate candidates found in Rookie of the Year category!');
    if (checkDuplicate(projectVotes)) return alert('Duplicate nominations found in Best Project category!');
    if (isStaff && checkDuplicate(favEbVotes)) return alert('Duplicate candidates found in Most Favorite EB category!');

    if (!mvpVotes[0]) return alert('You must select a candidate for Rank 1 in The Ultimate MVP!');
    if (!rookieVotes[0]) return alert('You must select a candidate for Rank 1 in Rookie of the Year!');
    if (!projectVotes[0]) return alert('You must select a project for Rank 1 in Best Project!');
    if (isStaff && !favEbVotes[0]) return alert('You must select a candidate for Rank 1 in Most Favorite EB!');

    if (isBPHADV) {
      if (Object.values(evalDeptVotes).includes(0)) return alert("Executive Board must evaluate all departments (minimum 1 star)!");
      if (Object.values(evalProjectVotes).includes(0)) return alert("Executive Board must evaluate all projects (minimum 1 star)!");
    }

    setSubmitting(true);
    try {
      const payload = [];

      payload.push({ voter_id: user.id, category: 'MVP', rank_1: mvpVotes[0], rank_2: mvpVotes[1], rank_3: mvpVotes[2], rank_4: mvpVotes[3], rank_5: mvpVotes[4] });
      payload.push({ voter_id: user.id, category: 'ROOKIE', rank_1: rookieVotes[0], rank_2: rookieVotes[1], rank_3: rookieVotes[2] });
      payload.push({ voter_id: user.id, category: 'PROJECT', rank_1: projectVotes[0], rank_2: projectVotes[1], rank_3: projectVotes[2] });
      
      if (isStaff) {
        payload.push({ voter_id: user.id, category: 'FAV_EB', rank_1: favEbVotes[0], rank_2: favEbVotes[1], rank_3: favEbVotes[2], rank_4: favEbVotes[3], rank_5: favEbVotes[4] });
      }

      if (isBPHADV) {
        Object.entries(evalDeptVotes).forEach(([dept, score]) => {
          payload.push({ voter_id: user.id, category: 'EVAL_DEPT', target_id: dept, evaluation_score: score * 20 });
        });
        Object.entries(evalProjectVotes).forEach(([projId, score]) => {
          payload.push({ voter_id: user.id, category: 'EVAL_PROJECT', target_id: projId, evaluation_score: score * 20 });
        });
      }

      const { error } = await supabase.from('end_of_term_votes').insert(payload);
      if (error) throw error;

      setIsVoted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      alert('Failed to submit votes: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // --- KANDIDAT FILTERING LOGIC (SUDAH DIKOREKSI MUTLAK) ---
  // MVP: HANYA Staff / TL (Role 5). EB adalah penilai, bukan yang dinilai.
  const mvpCandidates = usersList.filter(u => u.role === 5);
  
  // Rookie: HANYA Staff (Role 5) dari angkatan termuda (Cohort 26)
  const rookieCandidates = usersList.filter(u => u.role === 5 && (u.cohort || '').includes('26')); 
  
  // EB: Hanya yang rolenya 2, 3, 4 (BPH, ADV, Kadep, Kadiv)
  const ebCandidates = usersList.filter(u => u.role >= 2 && u.role <= 4);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 mt-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-tsa-dark tracking-tight flex items-center gap-3">
            <Crown className="text-tsa-green" size={36} /> End of Term Portal
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            The election utilizes a weighted <strong>Ranked Choice Voting</strong> system. Please select your candidates carefully.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-32"><Loader2 className="animate-spin text-tsa-green" size={40} /></div>
        ) : !votingActive ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-3xl p-20 flex flex-col items-center justify-center text-center animate-fade-in-up shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Lock size={32} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-black text-tsa-dark mb-2 tracking-tight">Portal Locked</h2>
            <p className="text-sm text-gray-500 max-w-md">The End of Term portal has not been opened or has been permanently closed by the Administrator.</p>
          </div>
        ) : isAdmin ? (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-20 flex flex-col items-center justify-center text-center animate-fade-in-up">
            <h2 className="text-2xl font-black text-red-600 mb-2">Access Denied</h2>
            <p className="text-sm text-gray-600 max-w-md font-medium">System Administrators (Role 1) are strictly prohibited from participating in the voting process to maintain absolute neutrality.</p>
          </div>
        ) : isVoted ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-20 flex flex-col items-center justify-center text-center animate-fade-in-up shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-tsa-green"></div>
            <CheckCircle2 size={64} className="text-tsa-green mb-6" />
            <h2 className="text-2xl font-black text-tsa-dark mb-2 tracking-tight">Votes Submitted Successfully</h2>
            <p className="text-sm text-gray-500 max-w-md font-medium leading-relaxed">
              Your votes and evaluations have been securely and anonymously recorded in the system. The <strong>Hall of Fame</strong> results will be published by the Administrator at the end of the term.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in-up">
            
            {/* ========================================== */}
            {/* KATEGORI RCV UMUM (Semua Bisa Vote) */}
            {/* ========================================== */}
            
            {/* 1. THE ULTIMATE MVP (Top 5) */}
            <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-tsa-green"></div>
              <div className="flex items-start gap-4 mb-6 border-b border-gray-100 pb-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0 border border-green-100"><Trophy size={24} className="text-tsa-green" /></div>
                <div>
                  <h2 className="text-lg font-black text-tsa-dark uppercase tracking-widest">The Ultimate MVP of the Year</h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">Select the top 5 officers with the most outstanding and consistent performance throughout the year. (Rank 1 = 5 Pts, Rank 5 = 1 Pt).</p>
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((rank, index) => (
                  <div key={`mvp-${rank}`} className="flex items-center gap-3">
                    <span className="w-20 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-3 rounded-xl text-center border border-gray-100 shrink-0">Rank {rank}</span>
                    <select value={mvpVotes[index]} onChange={(e) => handleVoteChange('mvp', index, e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl text-sm font-bold text-tsa-dark focus:outline-none focus:border-tsa-green focus:ring-1 focus:ring-tsa-green bg-white shadow-sm transition-all">
                      <option value="">-- Select Candidate --</option>
                      {mvpCandidates.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.position})</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. ROOKIE OF THE YEAR (Top 3) */}
            <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-tsa-green"></div>
              <div className="flex items-start gap-4 mb-6 border-b border-gray-100 pb-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0 border border-green-100"><Sparkles size={24} className="text-tsa-green" /></div>
                <div>
                  <h2 className="text-lg font-black text-tsa-dark uppercase tracking-widest">Rookie of the Year</h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">Select the top 3 youngest generation staff (Cohort 26) showing the most progressive adaptability. (Rank 1 = 3 Pts, Rank 3 = 1 Pt).</p>
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((rank, index) => (
                  <div key={`rookie-${rank}`} className="flex items-center gap-3">
                    <span className="w-20 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-3 rounded-xl text-center border border-gray-100 shrink-0">Rank {rank}</span>
                    <select value={rookieVotes[index]} onChange={(e) => handleVoteChange('rookie', index, e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl text-sm font-bold text-tsa-dark focus:outline-none focus:border-tsa-green focus:ring-1 focus:ring-tsa-green bg-white shadow-sm transition-all">
                      <option value="">-- Select Rookie Candidate --</option>
                      {rookieCandidates.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.dept})</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. BEST PROJECT OF THE YEAR (Top 3) */}
            <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-tsa-green"></div>
              <div className="flex items-start gap-4 mb-6 border-b border-gray-100 pb-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0 border border-green-100"><Star size={24} className="text-tsa-green" /></div>
                <div>
                  <h2 className="text-lg font-black text-tsa-dark uppercase tracking-widest">Best Project of the Year</h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">Select the top 3 most impactful and well-executed work programs. (Rank 1 = 3 Pts, Rank 3 = 1 Pt).</p>
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((rank, index) => (
                  <div key={`proj-${rank}`} className="flex items-center gap-3">
                    <span className="w-20 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-3 rounded-xl text-center border border-gray-100 shrink-0">Rank {rank}</span>
                    <select value={projectVotes[index]} onChange={(e) => handleVoteChange('project', index, e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl text-sm font-bold text-tsa-dark focus:outline-none focus:border-tsa-green focus:ring-1 focus:ring-tsa-green bg-white shadow-sm transition-all">
                      <option value="">-- Select Work Program --</option>
                      {projectsList.map(p => <option key={p.id} value={p.id}>{p.name} ({p.pct})</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </section>

            {/* ========================================== */}
            {/* KATEGORI EKSKLUSIF (Berdasarkan Role) */}
            {/* ========================================== */}

            {/* A. MOST FAVORITE EB (HANYA STAFF - ROLE 5) */}
            {isStaff && (
              <section className="bg-white p-6 md:p-8 rounded-3xl border border-yellow-200/60 shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-tsa-gold to-tsa-green"></div>
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-tsa-gold"><Vote size={120} /></div>
                
                <div className="relative z-10 flex items-start gap-4 mb-6 border-b border-gray-100 pb-4">
                  <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0 border border-yellow-100"><Crown size={24} className="text-tsa-gold" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-tsa-dark uppercase tracking-widest">Most Favorite EB</h2>
                      <span className="bg-green-50 text-tsa-green text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border border-green-100">Staff Privilege</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium mt-1">Select the top 5 most inspiring and supportive leaders (BPH/ADV/KADEP/KADIV). This vote is exclusively for Staff members.</p>
                  </div>
                </div>
                
                <div className="relative z-10 space-y-3">
                  {[1, 2, 3, 4, 5].map((rank, index) => (
                    <div key={`faveb-${rank}`} className="flex items-center gap-3">
                      <span className="w-20 text-[10px] font-black text-tsa-gold uppercase tracking-widest bg-yellow-50 px-3 py-3 rounded-xl text-center border border-yellow-100 shrink-0">Rank {rank}</span>
                      <select value={favEbVotes[index]} onChange={(e) => handleVoteChange('faveb', index, e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl text-sm font-bold text-tsa-dark focus:outline-none focus:border-tsa-gold focus:ring-1 focus:ring-tsa-gold bg-white shadow-sm transition-all hover:border-tsa-gold">
                        <option value="">-- Select Executive Board Candidate --</option>
                        {ebCandidates.map(eb => <option key={eb.id} value={eb.id}>{eb.full_name} ({eb.position})</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* B. EVALUASI BPH & ADV (HANYA ROLE 2) - DIPERBAIKI (CLEAN WHITE + TSA GREEN) */}
            {isBPHADV && (
              <section className="bg-white p-6 md:p-8 rounded-3xl border border-tsa-green shadow-lg relative overflow-hidden mt-10">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03]"><ShieldCheck size={120} className="text-tsa-green" /></div>
                <div className="absolute top-0 left-0 w-1.5 h-full bg-tsa-green"></div>
                
                <div className="relative z-10 flex items-start gap-4 mb-8 border-b border-gray-100 pb-6">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0 border border-green-100"><ShieldCheck size={24} className="text-tsa-green" /></div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-black text-tsa-dark uppercase tracking-widest">Executive Assessment</h2>
                      <span className="bg-green-50 text-tsa-green text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border border-green-200">Directors Privilege</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      Absolute qualitative evaluation (1-5 Stars) regarding workflow efficiency, budget utilization, and bureaucracy neatness. This evaluation contributes 20-50% to the final calculation of Department and Project metrics.
                    </p>
                  </div>
                </div>
                
                <div className="relative z-10 space-y-6">
                  {/* Evaluasi 3 Departemen Inti */}
                  <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100">
                    <h3 className="font-bold text-tsa-green text-sm mb-4 uppercase tracking-widest flex items-center gap-2"><Building2 size={16}/> Department Bureaucracy Eval</h3>
                    {['ERBD', 'MD', 'STD'].map(dept => (
                      <StarRating 
                        key={dept} label={`${dept} Department`} value={evalDeptVotes[dept]} 
                        onChange={(val) => setEvalDeptVotes({...evalDeptVotes, [dept]: val})} 
                      />
                    ))}
                  </div>

                  {/* Evaluasi Nominasi Project */}
                  <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100">
                    <h3 className="font-bold text-tsa-green text-sm mb-4 uppercase tracking-widest flex items-center gap-2"><Star size={16}/> Project Execution Eval</h3>
                    {projectsList.length === 0 ? (
                      <div className="py-4 text-center border border-dashed border-gray-200 rounded-xl bg-white">
                        <p className="text-xs text-gray-500 font-medium">No project nominations have been registered by the Administrator.</p>
                      </div>
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
            <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex items-start gap-3 shadow-sm mt-8">
              <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                The system will automatically reject your submission if duplicate candidates are found within the same category. <strong className="text-blue-900">Votes cannot be modified or withdrawn once the Confirm button is clicked.</strong>
              </p>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-tsa-green text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-emerald-800 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-70 disabled:hover:translate-y-0"
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