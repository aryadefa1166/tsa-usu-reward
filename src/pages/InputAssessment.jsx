import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Save, UserCheck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InputAssessment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [targets, setTargets] = useState([]); // Daftar orang yg bisa dinilai
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // State Form
  const [selectedTarget, setSelectedTarget] = useState('');
  const [scores, setScores] = useState({
    attitude: '',
    teamwork: '',
    feedback: ''
  });

  // 1. Logic: Ambil data user yang valid untuk dinilai
  useEffect(() => {
    const fetchTargets = async () => {
      // Ambil semua user KECUALI diri sendiri & Admin
      const { data, error } = await supabase
        .from('users')
        .select('id, username, role, dept')
        .neq('id', user.id) // Jangan nilai diri sendiri
        .neq('role', 'admin') // Admin tidak dinilai
        .order('username');

      if (error) console.error(error);
      else setTargets(data);
      setLoading(false);
    };

    fetchTargets();
  }, [user.id]);

  // 2. Logic: Handle Submit Nilai
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTarget) return alert('Pilih anggota yang mau dinilai!');
    
    setSubmitting(true);

    const payload = {
      period: 'Q1', // Nanti bisa dibikin dinamis
      evaluator_id: user.id,
      target_id: selectedTarget,
      attitude_score: parseInt(scores.attitude),
      // Teamwork hanya diisi jika user adalah KADEP, kalau BPH isi null/0
      teamwork_score: user.role === 'kadep' ? parseInt(scores.teamwork) : null,
      feedback: scores.feedback
    };

    const { error } = await supabase.from('assessments').insert([payload]);

    if (error) {
      alert('Gagal menyimpan: ' + error.message);
    } else {
      alert('Penilaian berhasil disimpan! 💾');
      // Reset form biar bisa nilai orang lain lagi
      setSelectedTarget('');
      setScores({ attitude: '', teamwork: '', feedback: '' });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-3xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Form Penilaian Anggota</h1>
          <p className="text-sm text-slate-500">
            Periode: <span className="font-semibold text-[#064e3b]">Q1 (Kuartal 1)</span>
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. PILIH ORANG */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Siapa yang ingin kamu nilai?
              </label>
              <div className="relative">
                <select 
                  className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#064e3b] focus:outline-none appearance-none"
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  required
                >
                  <option value="">-- Cari Nama Anggota --</option>
                  {targets.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.username} — {t.role.toUpperCase()} ({t.dept})
                    </option>
                  ))}
                </select>
                <UserCheck className="absolute left-3 top-3.5 text-slate-400" size={18} />
              </div>
            </div>

            <div className="border-t border-slate-100 my-6"></div>

            {/* 2. INPUT NILAI (Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* KOLOM A: ATTITUDE (Semua Role Wajib Isi) */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Nilai Attitude (0-100)
                </label>
                <p className="text-xs text-slate-400 mb-2">Etika, kedisiplinan, dan respon.</p>
                <input 
                  type="number" min="0" max="100"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b] outline-none text-center font-bold text-lg"
                  placeholder="0"
                  value={scores.attitude}
                  onChange={(e) => setScores({...scores, attitude: e.target.value})}
                  required
                />
              </div>

              {/* KOLOM B: TEAMWORK (Hanya Muncul untuk KADEP) */}
              {user.role === 'kadep' ? (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nilai Teamwork (0-100)
                  </label>
                  <p className="text-xs text-slate-400 mb-2">Kontribusi tugas & kerjasama tim.</p>
                  <input 
                    type="number" min="0" max="100"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b] outline-none text-center font-bold text-lg"
                    placeholder="0"
                    value={scores.teamwork}
                    onChange={(e) => setScores({...scores, teamwork: e.target.value})}
                    required
                  />
                </div>
              ) : (
                // Placeholder kalau bukan Kadep
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-center items-center text-center opacity-60">
                  <AlertCircle size={24} className="text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400 font-medium">Penilaian Teamwork hanya diisi oleh Kadep/Leader.</p>
                </div>
              )}
            </div>

            {/* 3. FEEDBACK (Wajib) */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Feedback & Apresiasi
              </label>
              <textarea 
                className="w-full p-4 border border-slate-200 rounded-xl focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b] outline-none text-sm h-32"
                placeholder="Tulis alasan penilaianmu atau kata-kata semangat..."
                value={scores.feedback}
                onChange={(e) => setScores({...scores, feedback: e.target.value})}
                required
              ></textarea>
            </div>

            {/* TOMBOL SUBMIT */}
            <button 
              type="submit"
              disabled={submitting}
              className="w-full bg-[#064e3b] text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/10 flex justify-center items-center gap-2"
            >
              {submitting ? 'Menyimpan...' : <><Save size={20} /> Simpan Penilaian</>}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
};

export default InputAssessment;