import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { Loader2, Building2, Crown, ShieldCheck } from 'lucide-react';

// ==========================================
// TEMA WARNA DEPARTEMEN MUTLAK
// ==========================================
const THEMES = {
  BPH: { border: 'border-pink-200', bg: 'bg-pink-50', text: 'text-pink-600', shadow: 'shadow-pink-100/50', gradient: 'from-pink-400 to-pink-600', line: 'bg-pink-300' },
  ADV: { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', shadow: 'shadow-amber-100/50', gradient: 'from-amber-600 to-amber-800', line: 'bg-amber-300' },
  ERBD: { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-600', shadow: 'shadow-emerald-100/50', gradient: 'from-emerald-400 to-emerald-600', line: 'bg-emerald-300' },
  MD: { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-600', shadow: 'shadow-purple-100/50', gradient: 'from-purple-400 to-purple-600', line: 'bg-purple-300' },
  STD: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-600', shadow: 'shadow-blue-100/50', gradient: 'from-blue-400 to-blue-600', line: 'bg-blue-300' },
};

// ==========================================
// KOMPONEN CARD MEMBER (DINAMIS SESUAI TEMA)
// ==========================================
const MemberCard = ({ member, deptCode }) => {
  if (!member) return null;
  const theme = THEMES[deptCode] || THEMES.BPH;
  const isEB = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Head of Department', 'Vice Head of Dept', 'Head of Division', 'Steering Committee'].includes(member.position);

  return (
    <div className={`bg-white rounded-2xl border ${theme.border} ${theme.shadow} p-5 flex flex-col items-center text-center hover:shadow-md transition-all duration-300 relative overflow-hidden w-full max-w-[200px] mx-auto z-10`}>
      {isEB && <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${theme.gradient}`}></div>}

      <div className={`w-20 h-20 rounded-full border-4 ${theme.bg} overflow-hidden mb-3 relative shadow-inner flex-shrink-0 bg-white`}>
        {member.photo_url ? (
          <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center font-black text-xl ${theme.text}`}>
            {member.full_name ? member.full_name.charAt(0) : '?'}
          </div>
        )}
      </div>
      
      <h3 className="font-bold text-tsa-dark text-xs leading-tight mb-1">{member.full_name}</h3>
      <span className={`text-[9px] font-black uppercase tracking-wider mt-0.5 ${theme.text}`}>
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
// KONEKTOR GARIS (UI HELPERS)
// ==========================================
// Garis Vertikal
const VLine = ({ height = 'h-8', color = 'bg-gray-200' }) => <div className={`w-px ${height} ${color} mx-auto`}></div>;

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
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-3xl md:text-5xl font-black text-tsa-dark tracking-tight mb-2">TSA USU</h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">TSA USU • Executive Board & Staff</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-32"><Loader2 className="animate-spin text-tsa-green" size={40} /></div>
        ) : (
          <div className="space-y-24 animate-fade-in-up">
            
            {/* ========================================== */}
            {/* TIER 1: BOARD OF DIRECTORS (BPH) */}
            {/* ========================================== */}
            <section className="relative">
              <div className="flex flex-col items-center mb-10">
                <Crown size={32} className={THEMES.BPH.text} />
                <h2 className={`text-xl font-black uppercase tracking-widest mt-2 ${THEMES.BPH.text}`}>Board of Directors</h2>
              </div>
              
              <div className="flex flex-col items-center">
                <MemberCard member={president} deptCode="BPH" />
                <VLine height="h-6" color={THEMES.BPH.line} />
                <MemberCard member={vp} deptCode="BPH" />
                <VLine height="h-6" color={THEMES.BPH.line} />
                
                {/* Percabangan Rapi Sec & Treas */}
                <div className={`w-[260px] h-px ${THEMES.BPH.line}`}></div>
                <div className="flex justify-between w-[260px]">
                  <VLine height="h-6" color={THEMES.BPH.line} />
                  <VLine height="h-6" color={THEMES.BPH.line} />
                </div>
                
                <div className="flex justify-center gap-10 w-full max-w-lg">
                  <div className="w-[200px]"><MemberCard member={secretary} deptCode="BPH" /></div>
                  <div className="w-[200px]"><MemberCard member={treasurer} deptCode="BPH" /></div>
                </div>
              </div>
            </section>

            {/* ========================================== */}
            {/* TIER 2: ADVISORY BOARD (ADV) */}
            {/* ========================================== */}
            <section className="relative bg-white rounded-3xl border border-gray-100 shadow-sm p-10 mt-10">
              <div className="flex flex-col items-center mb-10">
                <ShieldCheck size={32} className={THEMES.ADV.text} />
                <h2 className={`text-xl font-black uppercase tracking-widest mt-2 ${THEMES.ADV.text}`}>Advisory Board</h2>
              </div>
              
              <div className="flex flex-col lg:flex-row justify-center items-start gap-16 lg:gap-32">
                {/* KIRI: Steering Committee */}
                <div className="flex flex-col items-center w-full lg:w-auto">
                  <h3 className={`text-sm font-black uppercase tracking-widest mb-6 ${THEMES.ADV.text}`}>Steering Committee</h3>
                  <div className="flex flex-wrap justify-center gap-6">
                    {advSC.map(member => <MemberCard key={member.id} member={member} deptCode="ADV" />)}
                  </div>
                </div>
                
                {/* KANAN: MONEV */}
                <div className="flex flex-col items-center w-full lg:w-auto">
                  <h3 className={`text-sm font-black uppercase tracking-widest mb-6 ${THEMES.ADV.text}`}>Monitoring & Evaluation</h3>
                  <MemberCard member={advMonevHead} deptCode="ADV" />
                  <VLine height="h-6" color={THEMES.ADV.line} />
                  
                  {/* Percabangan ke 3 Staff Monev */}
                  <div className={`w-[80%] max-w-[400px] h-px ${THEMES.ADV.line}`}></div>
                  <div className="flex justify-between w-[80%] max-w-[400px] mb-2">
                    <VLine height="h-6" color={THEMES.ADV.line} />
                    <VLine height="h-6" color={THEMES.ADV.line} />
                    <VLine height="h-6" color={THEMES.ADV.line} />
                  </div>

                  <div className="flex flex-wrap justify-center gap-4">
                    {advMonevStaff.map(member => <MemberCard key={member.id} member={member} deptCode="ADV" />)}
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================== */}
            {/* TIER 3: ERBD */}
            {/* ========================================== */}
            <section className="relative bg-white rounded-3xl border border-gray-100 shadow-sm p-10">
              <div className="flex flex-col items-center mb-10">
                <Building2 size={32} className={THEMES.ERBD.text} />
                <h2 className={`text-xl font-black uppercase tracking-widest mt-2 ${THEMES.ERBD.text}`}>ERBD Department</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">External Relations & Business Development</p>
              </div>

              <div className="flex flex-col items-center">
                <MemberCard member={erbdKadep} deptCode="ERBD" />
                <VLine height="h-6" color={THEMES.ERBD.line} />
                <MemberCard member={erbdWakadep} deptCode="ERBD" />
                <VLine height="h-6" color={THEMES.ERBD.line} />
                
                {/* Garis Horizontal ke 4 Divisi */}
                <div className={`w-[75%] h-px ${THEMES.ERBD.line} hidden lg:block`}></div>
                <div className="hidden lg:flex justify-between w-[75%]">
                  <VLine height="h-6" color={THEMES.ERBD.line} />
                  <VLine height="h-6" color={THEMES.ERBD.line} />
                  <VLine height="h-6" color={THEMES.ERBD.line} />
                  <VLine height="h-6" color={THEMES.ERBD.line} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-2">
                  {erbdTeams.map(team => (
                    <div key={team.name} className="flex flex-col items-center">
                      <MemberCard member={team.tl} deptCode="ERBD" />
                      {team.staff.length > 0 && <VLine height="h-6" color={THEMES.ERBD.line} />}
                      <div className="flex flex-col gap-4 w-full">
                        {team.staff.map(member => <MemberCard key={member.id} member={member} deptCode="ERBD" />)}
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
                <Building2 size={32} className={THEMES.MD.text} />
                <h2 className={`text-xl font-black uppercase tracking-widest mt-2 ${THEMES.MD.text}`}>MD Department</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Media & Education</p>
              </div>

              <div className="flex flex-col items-center">
                <MemberCard member={mdStruct.kadep} deptCode="MD" />
                <VLine height="h-6" color={THEMES.MD.line} />
                
                {/* Garis Horizontal ke 2 Divisi */}
                <div className={`w-[50%] h-px ${THEMES.MD.line} hidden md:block`}></div>
                <div className="hidden md:flex justify-between w-[50%]">
                  <VLine height="h-6" color={THEMES.MD.line} />
                  <VLine height="h-6" color={THEMES.MD.line} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full mt-2 max-w-4xl">
                  {mdStruct.divs.map(div => (
                    <div key={div.name} className="flex flex-col items-center">
                      <MemberCard member={div.kadiv} deptCode="MD" />
                      {div.staff.length > 0 && <VLine height="h-6" color={THEMES.MD.line} />}
                      
                      {/* Grid Staff Berdampingan (Max 2 Kolom per Divisi) */}
                      <div className="grid grid-cols-2 gap-4 w-full">
                        {div.staff.map(member => <MemberCard key={member.id} member={member} deptCode="MD" />)}
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
                <Building2 size={32} className={THEMES.STD.text} />
                <h2 className={`text-xl font-black uppercase tracking-widest mt-2 ${THEMES.STD.text}`}>STD Department</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Staff & Talent Development</p>
              </div>

              <div className="flex flex-col items-center">
                <MemberCard member={stdStruct.kadep} deptCode="STD" />
                <VLine height="h-6" color={THEMES.STD.line} />
                
                <div className={`w-[50%] h-px ${THEMES.STD.line} hidden md:block`}></div>
                <div className="hidden md:flex justify-between w-[50%]">
                  <VLine height="h-6" color={THEMES.STD.line} />
                  <VLine height="h-6" color={THEMES.STD.line} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full mt-2 max-w-4xl">
                  {stdStruct.divs.map(div => (
                    <div key={div.name} className="flex flex-col items-center">
                      <MemberCard member={div.kadiv} deptCode="STD" />
                      {div.staff.length > 0 && <VLine height="h-6" color={THEMES.STD.line} />}
                      <div className="grid grid-cols-2 gap-4 w-full">
                        {div.staff.map(member => <MemberCard key={member.id} member={member} deptCode="STD" />)}
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