import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Star, Lock, CheckCircle2, ShieldAlert, Loader2, Save } from 'lucide-react';

// --- KOMPONEN BINTANG (STAR RATING) ---
const StarRating = ({ label, value, onChange, readOnly }) => {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange(star)}
            className={`transition-all duration-200 ${readOnly ? 'cursor-default' : 'hover:scale-110'}`}
          >
            <Star 
              size={16} 
              className={star <= value ? "fill-tsa-gold text-tsa-gold" : "fill-gray-100 text-gray-200"} 
            />
          </button>
        ))}
      </div>
    </div>
  );
};

// --- KOMPONEN UTAMA ---
const InputAssessment = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Q1');
  
  const [staffList, setStaffList] = useState([]);
  const [assessments, setAssessments] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  // Simulasi Status Periode (Akan dihubungkan dengan Admin Center di masa depan)
  const periodStatus = {
    Q1: 'ACTIVE',    // Bisa diisi & diedit
    Q2: 'LOCKED',    // Belum mulai
    Q3: 'LOCKED',
    Q4: 'LOCKED'
  };

  const tabs = ['Q1', 'Q2', 'Q3', 'Q4'];

  useEffect(() => {
    if (user) fetchStaffToEvaluate();
  }, [user]);

  const fetchStaffToEvaluate = async () => {
    setLoading(true);
    try {
      // 1. Ambil HANYA target yang role-nya 'member' (Staff) & Urutkan secara presisi
      let query = supabase
        .from('users')
        .select('*')
        .eq('role', 'member')
        .order('sort_order', { ascending: true });

      // 2. Logika Filter Wewenang Blueprint
      if (user.role === 'kadep') {
        query = query.eq('dept', user.dept);
      } else if (user.role === 'kadiv') {
        query = query.eq('dept', user.dept).eq('division', user.division);
      }
      // Jika BPH / ADV, query tidak difilter (bisa lihat semua departemen)

      const { data, error } = await query;
      if (error) throw error;
      
      setStaffList(data || []);

      // 3. Inisialisasi State Form untuk masing-masing Staff
      const initialAssessments = {};
      data.forEach(staff => {
        initialAssessments[staff.id] = {
          attitude: 0, discipline: 0, active: 0, agility: 0, cheerful: 0, isSubmitted: false
        };
      });
      setAssessments(initialAssessments);

      // (Opsional Next Iteration: Fetch existing score dari tabel 'assessments' berdasarkan tab kuartal)

    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (staffId, indicator, value) => {
    if (periodStatus[activeTab] !== 'ACTIVE') return;
    
    setAssessments(prev => ({
      ...prev,
      [staffId]: { ...prev[staffId], [indicator]: value }
    }));
  };

  const handleSubmitScore = async (staffId) => {
    const scores = assessments[staffId];
    
    // Validasi Kelengkapan: Semua indikator harus terisi (tidak boleh 0)
    if (!scores.attitude || !scores.discipline || !scores.active || !scores.agility || !scores.cheerful) {
      return alert('Mohon lengkapi semua 5 indikator penilaian (Minimal 1 Bintang)!');
    }

    setSubmittingId(staffId);
    
    try {
      // LOGIKA DATABASE (Asumsi tabel assessments sudah ada)
      /*
      const { error } = await supabase.from('assessments').upsert({
        evaluator_id: user.id,
        target_id: staffId,
        quarter: activeTab,
        attitude: scores.attitude * 20, // Konversi 1-5 ke skala 20-100 sesuai Blueprint
        discipline: scores.discipline * 20,
        active: scores.active * 20,
        agility: scores.agility * 20,
        cheerful: scores.cheerful * 20,
        updated_at: new Date()
      });
      if (error) throw error;
      */

      // Simulasi Delay Database
      await new Promise(resolve => setTimeout(resolve, 800));

      // Ubah UI menjadi sukses tersubmit
      setAssessments(prev => ({
        ...prev,
        [staffId]: { ...prev[staffId], isSubmitted: true }
      }));

    } catch (error) {
      alert("Gagal menyimpan nilai: " + error.message);
    } finally {
      setSubmittingId(null);
    }
  };

  // Grouping Staff Berdasarkan Departemen (Untuk tampilan BPH/ADV agar rapi)
  const groupedStaff = staffList.reduce((acc, staff) => {
    const dept = staff.dept || 'General';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(staff);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 mt-8">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-tsa-dark tracking-tight">Quarterly Assessment</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Evaluasi kinerja Staff berdasarkan skala 1-5 bintang.
          </p>
        </div>

        {/* TAB NAVIGATION KUARTAL */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-8 pb-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            const status = periodStatus[tab];
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                  isActive
                    ? 'bg-tsa-dark text-white shadow-md transform scale-105'
                    : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
                }`}
              >
                {status === 'LOCKED' && <Lock size={14} className={isActive ? 'text-gray-400' : 'text-gray-300'} />}
                {tab}
              </button>
            );
          })}
        </div>

        {/* AREA KONTEN PENILAIAN */}
        {loading ? (
          <div className="flex justify-center items-center py-32">
             <Loader2 className="animate-spin text-tsa-green" size={40} />
          </div>
        ) : periodStatus[activeTab] === 'LOCKED' ? (
          /* UI JIKA TERKUNCI */
          <div className="bg-white border border-gray-200 border-dashed rounded-3xl p-20 flex flex-col items-center justify-center text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Lock size={32} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-black text-tsa-dark mb-2 tracking-tight">Period Locked</h2>
            <p className="text-sm text-gray-500 max-w-md">
              Form penilaian untuk <strong>{activeTab}</strong> saat ini ditutup. Anda tidak dapat melakukan evaluasi di luar jadwal yang telah ditetapkan Admin.
            </p>
          </div>
        ) : staffList.length === 0 ? (
          /* UI JIKA TIDAK ADA STAFF / BUKAN EB */
          <div className="bg-red-50 border border-red-100 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
            <ShieldAlert size={40} className="text-red-400 mb-4" />
            <h2 className="text-xl font-black text-tsa-dark mb-2">Akses Ditolak / Kosong</h2>
            <p className="text-sm text-gray-500 max-w-sm">
              Anda tidak memiliki daftar Staff untuk dievaluasi pada departemen/divisi Anda.
            </p>
          </div>
        ) : (
          /* UI DAFTAR CARD STAFF */
          <div className="space-y-12 animate-fade-in-up">
            {Object.entries(groupedStaff).map(([deptName, staffs]) => (
              <section key={deptName}>
                <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-3">
                  <h2 className="text-lg font-black text-tsa-dark uppercase tracking-widest">{deptName} DEPARTMENT</h2>
                  <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-3 py-1 rounded-full">{staffs.length} Staff</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {staffs.map(staff => {
                    const scores = assessments[staff.id];
                    const isReadOnly = periodStatus[activeTab] !== 'ACTIVE' || scores?.isSubmitted;

                    return (
                      <div key={staff.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                        {/* Identitas Target */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-full border border-gray-200 overflow-hidden flex-shrink-0">
                            {staff.photo_url ? (
                                <img src={staff.photo_url} alt={staff.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-green-50 text-tsa-green flex items-center justify-center font-black text-sm">
                                  {staff.full_name ? staff.full_name.charAt(0) : '?'}
                                </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-tsa-dark text-sm leading-tight">{staff.full_name}</h3>
                            <p className="text-[9px] font-bold text-tsa-green uppercase tracking-widest mt-1">
                              {staff.position || 'Staff'} {staff.division !== '-' ? `• ${staff.division}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Indikator Bintang */}
                        <div className="flex-grow space-y-2 mb-6">
                          <StarRating label="Attitude" value={scores?.attitude || 0} readOnly={isReadOnly} onChange={(val) => handleScoreChange(staff.id, 'attitude', val)} />
                          <StarRating label="Discipline" value={scores?.discipline || 0} readOnly={isReadOnly} onChange={(val) => handleScoreChange(staff.id, 'discipline', val)} />
                          <StarRating label="Active" value={scores?.active || 0} readOnly={isReadOnly} onChange={(val) => handleScoreChange(staff.id, 'active', val)} />
                          <StarRating label="Agility" value={scores?.agility || 0} readOnly={isReadOnly} onChange={(val) => handleScoreChange(staff.id, 'agility', val)} />
                          <StarRating label="Cheerful" value={scores?.cheerful || 0} readOnly={isReadOnly} onChange={(val) => handleScoreChange(staff.id, 'cheerful', val)} />
                        </div>

                        {/* Tombol Aksi */}
                        <div className="mt-auto">
                          {scores?.isSubmitted ? (
                            <button className="w-full bg-green-50 text-tsa-green py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-default border border-green-100">
                              <CheckCircle2 size={16} /> Skor Tersimpan
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleSubmitScore(staff.id)}
                              disabled={submittingId === staff.id}
                              className="w-full bg-tsa-green text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
                            >
                              {submittingId === staff.id ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                              Submit Score
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default InputAssessment;