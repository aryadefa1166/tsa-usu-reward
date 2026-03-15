import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { Loader2, Building2, Crown, ShieldCheck, Users } from 'lucide-react';

// ==========================================
// KOMPONEN CARD MEMBER (DENGAN LOGIKA WARNA EB vs STAFF)
// ==========================================
const MemberCard = ({ member }) => {
  // Validasi posisi untuk warna Gold (Executive Board) vs Green (Staff/TL)
  const isGold = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Head of Department', 'Vice Head of Dept', 'Head of Division', 'Steering Committee'].includes(member.position);

  return (
    <div className={`bg-white rounded-2xl border ${isGold ? 'border-yellow-200/60 shadow-yellow-100/50' : 'border-gray-100 shadow-sm'} shadow-sm p-5 flex flex-col items-center text-center hover:shadow-md transition-all duration-300 relative overflow-hidden w-full max-w-[220px] mx-auto`}>
      
      {/* Aksen Gradien Atas untuk EB */}
      {isGold && <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-300 to-tsa-gold"></div>}

      <div className={`w-20 h-20 rounded-full border-4 ${isGold ? 'border-yellow-50' : 'border-green-50'} overflow-hidden mb-3 relative shadow-inner flex-shrink-0 bg-gray-100`}>
        {member.photo_url ? (
          <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center font-black text-xl ${isGold ? 'text-tsa-gold' : 'text-tsa-green'}`}>
            {member.full_name ? member.full_name.charAt(0) : '?'}
          </div>
        )}
      </div>
      
      <h3 className="font-bold text-tsa-dark text-xs leading-tight mb-1">{member.full_name}</h3>
      
      <span className={`text-[9px] font-black uppercase tracking-wider mt-0.5 ${isGold ? 'text-tsa-gold' : 'text-tsa-green'}`}>
        {member.position || 'Staff'}
      </span>
      
      {member.division && member.division !== '-' && (
        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">
          {member.division}
        </span>
      )}
      
      <div className="mt-3 pt-2 border-t border-gray-50 w-full">
        <span className="bg-gray-50 border border-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full text-[8px] font-bold tracking-wider uppercase">
          {member.cohort || 'Cohort'}
        </span>
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const OurTeam = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      // Menarik data mutlak: Abaikan Admin (Role 1), Hanya yang Aktif, Urutkan Sesuai Hierarki
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('role', 1) 
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
        
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Gagal menarik data tim:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // GROUPING LOGIC (O(N) Complexity)
  // ==========================================
  const bph = users.filter(u => u.dept === 'BPH');
  const adv = users.filter(u => u.dept === 'ADV');
  const erbd = users.filter(u => u.dept === 'ERBD');
  const md = users.filter(u => u.dept === 'MD');
  const std = users.filter(u => u.dept === 'STD');

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20 md:pb-10">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 mt-10">
        
        {/* HEADER */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-3xl md:text-5xl font-black text-tsa-dark tracking-tight mb-2">Organizational Structure</h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">TSA USU • Executive Board & Staff</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="animate-spin text-tsa-green" size={40} />
          </div>
        ) : (
          <div className="space-y-16 animate-fade-in-up">
            
            {/* TIER 1: BOARD OF DIRECTORS (BPH) */}
            {bph.length > 0 && (
              <section className="relative">
                <div className="flex flex-col items-center mb-8">
                  <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center mb-3 shadow-sm border border-yellow-100">
                    <Crown size={24} className="text-tsa-gold" />
                  </div>
                  <h2 className="text-lg font-black text-tsa-dark uppercase tracking-widest">Board of Directors</h2>
                </div>
                
                <div className="flex flex-wrap justify-center gap-4 md:gap-8 relative z-10">
                  {bph.map(member => <MemberCard key={member.id} member={member} />)}
                </div>
                
                {/* Garis Konektor Vertikal UI */}
                <div className="hidden md:block w-px h-12 bg-gray-200 mx-auto mt-6"></div>
              </section>
            )}

            {/* TIER 2: ADVISORY BOARD (ADV) */}
            {adv.length > 0 && (
              <section className="relative">
                <div className="hidden md:block w-px h-8 bg-gray-200 mx-auto mb-0"></div>
                <div className="flex flex-col items-center mb-8">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3 shadow-sm border border-blue-100">
                    <ShieldCheck size={24} className="text-blue-500" />
                  </div>
                  <h2 className="text-lg font-black text-tsa-dark uppercase tracking-widest">Advisory Board</h2>
                </div>
                
                <div className="flex flex-wrap justify-center gap-4 md:gap-8 relative z-10">
                  {adv.map(member => <MemberCard key={member.id} member={member} />)}
                </div>
                
                {/* Garis Konektor Percabangan ke 3 Departemen */}
                <div className="hidden lg:block w-px h-12 bg-gray-200 mx-auto mt-6"></div>
                <div className="hidden lg:block w-2/3 h-px bg-gray-200 mx-auto"></div>
              </section>
            )}

            {/* TIER 3: THE DEPARTMENTS (3 KOLOM GRID) */}
            <section>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative pt-8">
                
                {/* COLUMN 1: ERBD */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative flex flex-col items-center">
                  <div className="hidden lg:block absolute -top-8 left-1/2 w-px h-8 bg-gray-200"></div>
                  <div className="w-full text-center border-b border-gray-100 pb-4 mb-6">
                    <h2 className="text-xl font-black text-tsa-dark tracking-tight uppercase">ERBD</h2>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">External Relations & Business Dev</p>
                  </div>
                  <div className="flex flex-col gap-4 w-full">
                    {erbd.map(member => <MemberCard key={member.id} member={member} />)}
                  </div>
                </div>

                {/* COLUMN 2: MD */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative flex flex-col items-center">
                  <div className="hidden lg:block absolute -top-8 left-1/2 w-px h-8 bg-gray-200"></div>
                  <div className="w-full text-center border-b border-gray-100 pb-4 mb-6">
                    <h2 className="text-xl font-black text-tsa-dark tracking-tight uppercase">MD</h2>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Media & Development</p>
                  </div>
                  <div className="flex flex-col gap-4 w-full">
                    {md.map(member => <MemberCard key={member.id} member={member} />)}
                  </div>
                </div>

                {/* COLUMN 3: STD */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative flex flex-col items-center">
                  <div className="hidden lg:block absolute -top-8 left-1/2 w-px h-8 bg-gray-200"></div>
                  <div className="w-full text-center border-b border-gray-100 pb-4 mb-6">
                    <h2 className="text-xl font-black text-tsa-dark tracking-tight uppercase">STD</h2>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Student Talent Development</p>
                  </div>
                  <div className="flex flex-col gap-4 w-full">
                    {std.map(member => <MemberCard key={member.id} member={member} />)}
                  </div>
                </div>

              </div>
            </section>

          </div>
        )}
      </main>
    </div>
  );
};

export default OurTeam;