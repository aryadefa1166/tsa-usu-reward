import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Save, CheckCircle, Search, Star, Loader2, Users } from 'lucide-react';

const AssessmentCard = ({ target, isRated, evaluatorId }) => {
    const [scores, setScores] = useState({ attitude: 0, discipline: 0, active: 0, agility: 0, cheerful: 0 });
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(isRated);

    const handleRate = async (e) => {
        e.preventDefault();
        if (Object.values(scores).some(val => val === 0)) {
            alert("Please complete all star ratings for " + target.full_name);
            return;
        }
        setSubmitting(true);
        const payload = {
            period: 'Q1', evaluator_id: evaluatorId, target_id: target.id,
            attitude_score: scores.attitude * 20, discipline_score: scores.discipline * 20,
            active_score: scores.active * 20, agility_score: scores.agility * 20, cheerful_score: scores.cheerful * 20,
        };
        const { error } = await supabase.from('assessments').insert([payload]);
        if (error) alert('Submission failed: ' + error.message);
        else setDone(true);
        setSubmitting(false);
    };

    const StarRating = ({ label, value, onChange }) => (
        <div className="flex flex-col mb-3">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</span>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" disabled={done} onClick={() => onChange(star)}
                        className={`p-1 transition-all ${value >= star ? 'text-tsa-gold transform scale-110' : 'text-gray-200 hover:text-gray-300'}`}>
                        <Star size={20} fill={value >= star ? "currentColor" : "none"} />
                    </button>
                ))}
            </div>
        </div>
    );

    if (done) return (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full opacity-80">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-green-200 mb-3">
                 <img src={target.photo_url || `https://ui-avatars.com/api/?name=${target.full_name}&background=dcfce7&color=166534`} alt="profile" className="w-full h-full object-cover" />
            </div>
            <h3 className="font-bold text-green-800 text-sm">{target.full_name}</h3>
            <div className="mt-4 flex items-center gap-2 text-green-700 text-xs font-bold bg-white px-4 py-2 rounded-full shadow-sm">
                <CheckCircle size={16} /> RATED
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
            <div className="p-4 flex items-center gap-3 border-b border-gray-50 bg-gray-50/50">
                <div className="w-12 h-12 rounded-full bg-white border border-gray-200 overflow-hidden flex-shrink-0">
                    <img src={target.photo_url || `https://ui-avatars.com/api/?name=${target.full_name}&background=random`} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold text-tsa-dark text-sm truncate">{target.full_name}</h3>
                    <p className="text-[10px] text-tsa-green font-bold uppercase">{target.position}</p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider">{target.division !== '-' ? target.division : 'General'}</p>
                </div>
            </div>
            <form onSubmit={handleRate} className="p-5 flex-1 flex flex-col justify-between">
                <div>
                    <StarRating label="Attitude" value={scores.attitude} onChange={(v) => setScores({...scores, attitude: v})} />
                    <StarRating label="Discipline" value={scores.discipline} onChange={(v) => setScores({...scores, discipline: v})} />
                    <StarRating label="Active" value={scores.active} onChange={(v) => setScores({...scores, active: v})} />
                    <StarRating label="Agility" value={scores.agility} onChange={(v) => setScores({...scores, agility: v})} />
                    <StarRating label="Cheerful" value={scores.cheerful} onChange={(v) => setScores({...scores, cheerful: v})} />
                </div>
                <button type="submit" disabled={submitting} className="w-full mt-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-tsa-green text-white hover:bg-emerald-800 transition-all flex justify-center items-center gap-2 disabled:opacity-70">
                    {submitting ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Submit Score
                </button>
            </form>
        </div>
    );
};

const InputAssessment = () => {
  const { user } = useAuth();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratedIds, setRatedIds] = useState([]);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    setLoading(true);
    if (user.role === 'member') { setTargets([]); setLoading(false); return; }

    let query = supabase.from('users').select('*').eq('role', 'member').order('sort_order', { ascending: true });
    if (user.role === 'kadep') query = query.eq('dept', user.dept);
    else if (user.role === 'kadiv') query = query.eq('division', user.division);

    const { data: usersData } = await query;
    const { data: assessmentsData } = await supabase.from('assessments').select('target_id').eq('evaluator_id', user.id).eq('period', 'Q1');

    if (assessmentsData) setRatedIds(assessmentsData.map(a => a.target_id));
    setTargets(usersData || []);
    setLoading(false);
  };

  const filteredTargets = targets.filter(t => t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || t.dept.toLowerCase().includes(searchTerm.toLowerCase()));

  // LOGIKA GROUPING BERDASARKAN DEPARTEMEN
  const groupedTargets = filteredTargets.reduce((acc, target) => {
      const dept = target.dept || 'Unassigned';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(target);
      return acc;
  }, {});

  if (user?.role === 'member') return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-bold text-tsa-dark mb-2">Access Denied</h1>
          <p className="text-gray-500 text-sm">Members do not have evaluation access during the quarterly period.</p>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-tsa-dark">Quarterly Assessment</h1>
          <p className="text-sm text-gray-500 mt-1">Period: <span className="font-bold text-tsa-green">Q1</span> • Rate based on the 1-5 star scale.</p>
        </div>

        <div className="relative mb-10 max-w-xl">
            <Search size={20} className="absolute left-4 top-3.5 text-gray-400" />
            <input type="text" placeholder="Search member name or department..." className="w-full pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-tsa-green shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        {loading ? ( <div className="flex justify-center py-20"><Loader2 className="animate-spin text-tsa-green" size={40} /></div> ) 
        : Object.keys(groupedTargets).length === 0 ? ( <div className="text-center py-20 text-gray-400">No members available to evaluate.</div> ) 
        : (
            <div>
                {Object.entries(groupedTargets).map(([dept, members]) => (
                    <div key={dept} className="mb-10">
                        {/* HEADER DEPARTEMEN */}
                        <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
                            <Users size={18} className="text-tsa-green" />
                            <h2 className="text-lg font-black text-tsa-dark tracking-tight uppercase">{dept} DEPARTMENT</h2>
                            <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{members.length} Members</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {members.map(target => (
                                <AssessmentCard key={target.id} target={target} isRated={ratedIds.includes(target.id)} evaluatorId={user.id} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
};
export default InputAssessment;