import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Save, CheckCircle, Search, Loader2 } from 'lucide-react';

const InputAttendance = () => {
  const { user } = useAuth();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratedIds, setRatedIds] = useState([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    // Tarik semua member
    const { data: usersData } = await supabase.from('users').select('*').eq('role', 'member').order('sort_order', { ascending: true });

    // Cek siapa saja yang sudah diinput absensinya oleh Sekretaris di Q1
    const { data: assessmentsData } = await supabase
        .from('assessments')
        .select('target_id')
        .eq('evaluator_id', user.id)
        .eq('period', 'Q1')
        .gt('attendance_score', 0); // Cari yang attendance-nya sudah diisi

    if (assessmentsData) setRatedIds(assessmentsData.map(a => a.target_id));
    setTargets(usersData || []);
    setLoading(false);
  };

  const AttendanceCard = ({ target, isRated }) => {
    const [hadir, setHadir] = useState('');
    const [totalKegiatan, setTotalKegiatan] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(isRated);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!hadir || !totalKegiatan || Number(totalKegiatan) === 0) return alert("Input tidak valid!");
        if (Number(hadir) > Number(totalKegiatan)) return alert("Total Hadir tidak boleh lebih dari Total Kegiatan!");

        setSubmitting(true);

        // KALKULASI PERSENTASE ABSENSI (Sesuai Blueprint)
        const attendanceScore = Math.round((Number(hadir) / Number(totalKegiatan)) * 100);

        const payload = {
            period: 'Q1',
            evaluator_id: user.id,
            target_id: target.id,
            attendance_score: attendanceScore,
            // Nilai bintang EB dibiarkan 0 karena ini form khusus Sekre
            attitude_score: 0, discipline_score: 0, active_score: 0, agility_score: 0, cheerful_score: 0
        };

        const { error } = await supabase.from('assessments').insert([payload]);

        if (error) alert('Error: ' + error.message);
        else setDone(true);
        setSubmitting(false);
    };

    if (done) return (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center opacity-80">
            <CheckCircle className="text-green-600 mb-2" size={24} />
            <h3 className="font-bold text-green-800 text-sm">{target.full_name}</h3>
            <p className="text-xs text-green-600">Attendance Logged</p>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col">
            <h3 className="font-bold text-tsa-dark text-sm truncate mb-1">{target.full_name}</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-4">{target.dept}</p>
            
            <form onSubmit={handleSave} className="flex-1 flex flex-col gap-3">
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Hadir</label>
                        <input type="number" min="0" required value={hadir} onChange={e => setHadir(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-center" placeholder="0" />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Total</label>
                        <input type="number" min="1" required value={totalKegiatan} onChange={e => setTotalKegiatan(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-center" placeholder="0" />
                    </div>
                </div>
                <button type="submit" disabled={submitting} className="w-full py-2 rounded-lg font-bold text-xs uppercase bg-tsa-green text-white hover:bg-emerald-800 flex justify-center items-center">
                    {submitting ? <Loader2 className="animate-spin" size={14}/> : 'Save Absen'}
                </button>
            </form>
        </div>
    );
  };

  const filteredTargets = targets.filter(t => t.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Filter Kunci: HANYA SECRETARY YANG BISA BUKA (Berdasarkan position)
  if (user?.position !== 'Secretary') {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
              <div>
                  <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
                  <p className="text-gray-500 text-sm">Only the Secretary has access to input attendance data.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-tsa-dark">Attendance Input (Q1)</h1>
          <p className="text-sm text-gray-500">Form eksklusif Sekretaris untuk menghitung metrik kehadiran.</p>
        </div>
        <div className="relative mb-6 max-w-md">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input type="text" placeholder="Cari nama..." className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:border-tsa-green" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredTargets.map(target => (
                <AttendanceCard key={target.id} target={target} isRated={ratedIds.includes(target.id)} />
            ))}
        </div>
      </main>
    </div>
  );
};

export default InputAttendance;