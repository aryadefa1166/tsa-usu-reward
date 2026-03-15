import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { Loader2, Building2, Crown, ShieldCheck } from 'lucide-react';

// ==========================================
// KOMPONEN CARD MEMBER (TEMA MUTLAK TSA USU)
// ==========================================
const MemberCard = ({ member }) => {
  if (!member) return null;
  // EB menggunakan aksen Emas, Staff menggunakan aksen Hijau
  const isEB = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Head of Department', 'Vice Head of Dept', 'Head of Division', 'Steering Committee'].includes(member.position);

  return (
    <div className={`bg-white rounded-2xl border ${isEB ? 'border-yellow-200/60 shadow-yellow-100/50' : 'border-gray-100 shadow-sm'} p-5 flex flex-col items-center text-center hover:shadow-md transition-all duration-300 relative overflow-hidden w-full max-w-[200px] mx-auto z-10`}>
      
      {/* Aksesoris Gradien EB */}
      {isEB && <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-300 to-tsa-gold"></div>}

      <div className={`w-20 h-20 rounded-full border-4 ${isEB ? 'border-yellow-50 bg-yellow-50/50' : 'border-green-50 bg-green-50/50'} overflow-hidden mb-3 relative shadow-inner flex-shrink-0`}>
        {member.photo_url ? (
          <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center font-black text-xl ${isEB ? 'text-tsa-gold' : 'text-tsa-green'}`}>
            {member.full_name ? member.full_name.charAt(0) : '?'}
          </div>
        )}
      </div>
      
      <h3 className="font-bold text-tsa-dark text-xs leading-tight mb-1">{member.full_name}</h3>
      <span className={`text-[9px] font-black uppercase tracking-wider mt-0.5 ${isEB ? 'text-tsa-gold' : 'text-tsa-green'}`}>
        {member.position || 'Staff'}
      </span>
      
      {member.division && member.division !== '-' && (
        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">{member.division}</span>
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
// KONEKTOR GARIS (UI HELPERS) - WARNA HIJAU MUDA TSA
// ==========================================
const lineColor = "bg-green-100";
const VLine = ({ height = 'h-8' }) => <div className={`w-px ${height} ${lineColor} mx-auto`}></div>;

const OurTeam = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTeam(); }, []);

  const fetchTeam = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .neq('role', 1) 
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (!error) setUsers(data || []);
    setLoading(false);
  };

  // --- FILTERING PRESISI UNTUK HIERARKI ---
  // 1. BPH
  const president = users.find(u => u.dept === 'BPH' && u.position === 'President');
  const vp = users.find(u => u.dept === 'BPH' && u.position === 'Vice President');
  const secretary = users.find(u => u.dept === 'BPH' && u.position === 'Secretary');
  const treasurer = users.find(u => u.dept === 'BPH' && u.position === 'Treasurer');

  // 2. ADV
  const advSC = users.filter(u => u.dept === 'ADV' && u.division === 'SC');
  const advMonevHead = users.find(u => u.dept === 'ADV' && u.division === 'MONEV' && u.position === 'Head of Division');
  const advMonevStaff = users.filter(u => u.dept === 'ADV' && u.division === 'MONEV' && u.position !== 'Head of Division');

  // 3. ERBD
  const erbdKadep = users.find(u => u.dept === 'ERBD' && u.position === 'Head of Department');
  const erbdWakadep = users.find(u => u.dept === 'ERBD' && u.position === 'Vice Head of Dept');
  const erbdTeams = ['Product Partnership', 'University Network', 'Government Relations', 'Alumni & Ext. Outreach'].map(div => ({
    name: div,
    tl: users.find(u => u.dept === 'ERBD' && u.division === div && u.position === 'Team Leader'),
    staff: users.filter(u => u.dept === 'ERBD' && u.division === div && u.position !== 'Team Leader')
  }));

  // 4. MD & STD
  const getDivisionalStructure = (deptName, divisions) => {
    return {
      kadep: users.find(u => u.dept === deptName && u.position === 'Head of Department'),
      divs: divisions.map(div => ({
        name: div,
        kadiv: users.find(u => u.dept === deptName && u.division === div && u.position === 'Head of Division'),
        staff: users.filter(u => u.dept === deptName && u.division === div && u.position !== 'Head of Division')
      }))
    };
  };
  const mdStruct = getDivisionalStructure('MD', ['Education', 'Media']);
  const stdStruct = getDivisionalStructure('STD', ['Staff Management', 'Talent Management']);

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20 md:pb-10 overflow-x-hidden">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 mt-10">
        
        {/* HEADER YANG SUDAH DIBENARKAN */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-3xl md:text-5xl font-black text-tsa-dark tracking-tight mb-2">Organizational Structure</h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">TSA USU • Executive Board & Staff</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-32"><Loader2 className="animate-spin text-tsa-green" size={40} /></div>
        ) : (
          <div className="space-y-16 animate-fade-in-up">
            
            {/* ========================================== */}
            {/* TIER 1: BOARD OF DIRECTORS (BPH) */}
            {/* ========================================== */}
            <section className="relative bg-white rounded-3xl border border-gray-100 shadow-sm p-10">
              <div className="flex flex-col items-center mb-10">
                <div className="p-3 bg-yellow-50 rounded-2xl mb-3 shadow-sm border border-yellow-100">
                  <Crown size={28} className="text-tsa-gold" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-widest text-tsa-dark">Board of Directors</h2>
              </div>
              
              <div className="flex flex-col items-center">
                <MemberCard member={president} />
                <VLine height="h-8" />
                <MemberCard member={vp} />
                <VLine height="h-8" />
                
                {/* Percabangan Rapi Sec & Treas */}
                <div className={`w-64 h-px ${lineColor} hidden md:block`}></div>
                <div className="hidden md:flex justify-between w-64">
                  <VLine height="h-8" />
                  <VLine height="h-8" />
                </div>
                
                <div className="flex justify-center gap-10 w-full max-w-md mt-6 md:mt-0">
                  <div className="w-1/2"><MemberCard member={secretary} /></div>
                  <div className="w-1/2"><MemberCard member={treasurer} /></div>
                </div>
              </div>
            </section>

            {/* ========================================== */}
            {/* TIER 2: ADVISORY BOARD (ADV) */}
            {/* ========================================== */}
            <section className="relative bg-white rounded-3xl border border-gray-100 shadow-sm p-10">
              <div className="flex flex-col items-center mb-10">
                <div className="p-3 bg-green-50 rounded-2xl mb-3 shadow-sm border border-green-100">
                  <ShieldCheck size={28} className="text-tsa-green" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-widest text-tsa-dark">Advisory Board</h2>
              </div>
              
              <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
                {/* Lapis 1: Steering Committee */}
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-gray-400">Steering Committee</h3>
                <div className="flex flex-wrap justify-center gap-6 z-10 w-full">
                  {advSC.map(member => <MemberCard key={member.id} member={member} />)}
                </div>
                
                {/* Lapis 2: MONEV Head (Tepat di bawah tengah SC) */}
                <h3 className="text-sm font-black uppercase tracking-widest mt-12 mb-6 text-gray-400">Monitoring & Evaluation</h3>
                <MemberCard member={advMonevHead} />
                <VLine height="h-8" />
                
                {/* Lapis 3: Percabangan ke 3 Staff Monev */}
                <div className={`w-[80%] max-w-[450px] h-px ${lineColor} hidden md:block`}></div>
                <div className="hidden md:flex justify-between w-[80%] max-w-[450px]">
                  <VLine height="h-8" />
                  <VLine height="h-8" />
                  <VLine height="h-8" />
                </div>

                <div className="flex flex-wrap justify-center gap-4 mt-6 md:mt-0 w-full">
                  {advMonevStaff.map(member => <MemberCard key={member.id} member={member} />)}
                </div>
              </div>
            </section>

            {/* ========================================== */}
            {/* TIER 3: ERBD */}
            {/* ========================================== */}
            <section className="relative bg-white rounded-3xl border border-gray-100 shadow-sm p-10">
              <div className="flex flex-col items-center mb-10">
                <div className="p-3 bg-green-50 rounded-2xl mb-3 shadow-sm border border-green-100">
                  <Building2 size={28} className="text-tsa-green" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-widest text-tsa-dark">ERBD Department</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mt-1">External Relations & Business Development</p>
              </div>

              <div className="flex flex-col items-center">
                <MemberCard member={erbdKadep} />
                <VLine height="h-8" />
                <MemberCard member={erbdWakadep} />
                <VLine height="h-8" />
                
                {/* Garis Horizontal ke 4 Divisi */}
                <div className={`w-[85%] h-px ${lineColor} hidden lg:block`}></div>
                <div className="hidden lg:flex justify-between w-[85%]">
                  <VLine height="h-8" />
                  <VLine height="h-8" />
                  <VLine height="h-8" />
                  <VLine height="h-8" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-6 lg:mt-0">
                  {erbdTeams.map(team => (
                    <div key={team.name} className="flex flex-col items-center">
                      <MemberCard member={team.tl} />
                      {team.staff.length > 0 && <VLine height="h-8" />}
                      <div className="flex flex-col gap-4 w-full">
                        {team.staff.map(member => <MemberCard key={member.id} member={member} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ========================================== */}
            {/* TIER 4: MD */}
            {/* ========================================== */}
            <section className="relative bg-white rounded-3xl border border-gray-100 shadow-sm p-10">
              <div className="flex flex-col items-center mb-10">
                <div className="p-3 bg-green-50 rounded-2xl mb-3 shadow-sm border border-green-100">
                  <Building2 size={28} className="text-tsa-green" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-widest text-tsa-dark">MD Department</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mt-1">Media Education</p>
              </div>

              <div className="flex flex-col items-center">
                <MemberCard member={mdStruct.kadep} />
                <VLine height="h-8" />
                
                {/* Garis Horizontal ke 2 Divisi */}
                <div className={`w-[60%] h-px ${lineColor} hidden md:block`}></div>
                <div className="hidden md:flex justify-between w-[60%]">
                  <VLine height="h-8" />
                  <VLine height="h-8" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full mt-6 md:mt-0 max-w-4xl">
                  {mdStruct.divs.map(div => (
                    <div key={div.name} className="flex flex-col items-center">
                      <MemberCard member={div.kadiv} />
                      {div.staff.length > 0 && <VLine height="h-8" />}
                      
                      {/* Grid Staff Berdampingan (Max 2 Kolom per Divisi) */}
                      <div className="grid grid-cols-2 gap-4 w-full">
                        {div.staff.map(member => <MemberCard key={member.id} member={member} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ========================================== */}
            {/* TIER 5: STD */}
            {/* ========================================== */}
            <section className="relative bg-white rounded-3xl border border-gray-100 shadow-sm p-10">
              <div className="flex flex-col items-center mb-10">
                <div className="p-3 bg-green-50 rounded-2xl mb-3 shadow-sm border border-green-100">
                  <Building2 size={28} className="text-tsa-green" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-widest text-tsa-dark">STD Department</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mt-1">Staff & Talent Development</p>
              </div>

              <div className="flex flex-col items-center">
                <MemberCard member={stdStruct.kadep} />
                <VLine height="h-8" />
                
                <div className={`w-[60%] h-px ${lineColor} hidden md:block`}></div>
                <div className="hidden md:flex justify-between w-[60%]">
                  <VLine height="h-8" />
                  <VLine height="h-8" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full mt-6 md:mt-0 max-w-4xl">
                  {stdStruct.divs.map(div => (
                    <div key={div.name} className="flex flex-col items-center">
                      <MemberCard member={div.kadiv} />
                      {div.staff.length > 0 && <VLine height="h-8" />}
                      <div className="grid grid-cols-2 gap-4 w-full">
                        {div.staff.map(member => <MemberCard key={member.id} member={member} />)}
                      </div>
                    </div>
                  ))}
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