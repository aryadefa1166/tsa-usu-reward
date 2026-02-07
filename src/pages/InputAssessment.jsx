import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Save, CheckCircle, Search, Filter, Loader2 } from 'lucide-react';

const InputAssessment = () => {
  const { user } = useAuth();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Menyimpan ID user yang sudah dinilai hari ini/periode ini agar card-nya terkunci
  const [ratedIds, setRatedIds] = useState([]);

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const fetchData = async () => {
    setLoading(true);

    // 1. Ambil Data Anggota (Kecuali Diri Sendiri & Admin)
    const { data: usersData, error: userError } = await supabase
      .from('users')
      .select('id, username, full_name, role, dept, position, photo_url, sort_order')
      .neq('id', user.id) 
      .neq('role', 'admin')
      .order('sort_order', { ascending: true });

    if (userError) console.error(userError);

    // 2. Ambil Data Penilaian yang SUDAH dilakukan oleh user ini (biar tau siapa yg udah dinilai)
    const { data: assessmentsData, error: assessError } = await supabase
        .from('assessments')
        .select('target_id')
        .eq('evaluator_id', user.id)
        .eq('period', 'Q1'); // Sesuaikan periode

    if (assessmentsData) {
        setRatedIds(assessmentsData.map(a => a.target_id));
    }

    setTargets(usersData || []);
    setLoading(false);
  };

  // Komponen Card Individu (Dipisah biar rapi & state-nya lokal per orang)
  const AssessmentCard = ({ target, isRated }) => {
    const [scores, setScores] = useState({
        attitude: '',
        discipline: '',
        active: '',
        responsive: '',
        agility: '',
        cheerful: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(isRated);

    const handleRate = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Validasi simpel
        if (!scores.attitude || !scores.discipline || !scores.active) {
            alert("Please fill all fields (0-100)");
            setSubmitting(false);
            return;
        }

        const payload = {
            period: 'Q1',
            evaluator_id: user.id,
            target_id: target.id,
            attitude_score: parseInt(scores.attitude),
            discipline_score: parseInt(scores.discipline),
            active_score: parseInt(scores.active),
            responsive_score: parseInt(scores.responsive),
            agility_score: parseInt(scores.agility),
            cheerful_score: parseInt(scores.cheerful),
            feedback: 'General Assessment' // Bisa ditambah kolom feedback kalau mau
        };

        const { error } = await supabase.from('assessments').insert([payload]);

        if (error) {
            alert('Failed: ' + error.message);
        } else {
            setDone(true); // Ubah status jadi selesai
        }
        setSubmitting(false);
    };

    // Helper Input Kecil
    const ScoreInput = ({ label, val, setVal }) => (
        <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">{label}</label>
            <input 
                type="number" min="0" max="100" placeholder="0"
                className="w-full border border-gray-200 rounded-lg p-2 text-center font-bold text-sm focus:border-tsa-green focus:ring-1 focus:ring-tsa-green outline-none"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                disabled={done}
                required
            />
        </div>
    );

    if (done) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full opacity-80">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-green-200 mb-3">
                     <img src={target.photo_url || `https://ui-avatars.com/api/?name=${target.full_name}&background=dcfce7&color=166534`} alt="profile" className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-green-800">{target.full_name}</h3>
                <div className="mt-4 flex items-center gap-2 text-green-700 font-bold bg-white px-4 py-2 rounded-full shadow-sm">
                    <CheckCircle size={18} /> RATED
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
            {/* Header Card */}
            <div className="p-4 flex items-center gap-4 border-b border-gray-50 bg-gray-50/50">
                <div className="w-14 h-14 rounded-full bg-white border border-gray-200 overflow-hidden flex-shrink-0">
                    <img 
                        src={target.photo_url || `https://ui-avatars.com/api/?name=${target.full_name}&background=random`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold text-tsa-dark text-sm truncate">{target.full_name}</h3>
                    <p className="text-xs text-tsa-green font-bold uppercase">{target.position}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{target.dept}</p>
                </div>
            </div>

            {/* Form Input */}
            <form onSubmit={handleRate} className="p-5 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-6">
                    <ScoreInput label="Attitude" val={scores.attitude} setVal={(v) => setScores({...scores, attitude: v})} />
                    <ScoreInput label="Discipline" val={scores.discipline} setVal={(v) => setScores({...scores, discipline: v})} />
                    <ScoreInput label="Active" val={scores.active} setVal={(v) => setScores({...scores, active: v})} />
                    <ScoreInput label="Responsive" val={scores.responsive} setVal={(v) => setScores({...scores, responsive: v})} />
                    <ScoreInput label="Agility" val={scores.agility} setVal={(v) => setScores({...scores, agility: v})} />
                    <ScoreInput label="Cheerful" val={scores.cheerful} setVal={(v) => setScores({...scores, cheerful: v})} />
                </div>

                <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-tsa-green text-white hover:bg-emerald-800 transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                >
                    {submitting ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                    Submit Score
                </button>
            </form>
        </div>
    );
  };

  // Filter Logic
  const filteredTargets = targets.filter(t => 
    t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.dept.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-tsa-dark">Assessment Page</h1>
          <p className="text-sm text-gray-500 mt-1">
            Period: <span className="font-bold text-tsa-green">Q1 (Quarter 1)</span> • Give objective scores (0-100) based on daily performance.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8 max-w-xl">
            <Search size={20} className="absolute left-4 top-3.5 text-gray-400" />
            <input 
                type="text" 
                placeholder="Search Member Name or Department..." 
                className="w-full pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-tsa-green shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* GRID LAYOUT */}
        {loading ? (
             <div className="text-center py-20 text-gray-400">Loading Assessment Cards...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTargets.map(target => (
                    <AssessmentCard 
                        key={target.id} 
                        target={target} 
                        isRated={ratedIds.includes(target.id)} 
                    />
                ))}
            </div>
        )}
      </main>
    </div>
  );
};

export default InputAssessment;