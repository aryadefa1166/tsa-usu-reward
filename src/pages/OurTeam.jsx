import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { Loader2, Building2, Crown, ShieldCheck } from 'lucide-react';

// ==========================================
// TEMA WARNA DEPARTEMEN MUTLAK
// ==========================================
const THEMES = {
  BPH: { border: 'border-pink-200', bg: 'bg-pink-50', text: 'text-pink-600', shadow: 'shadow-pink-100/50', gradient: 'from-pink-400 to-pink-600', line: 'bg-pink-300', iconBg: 'bg-pink-50' },
  ADV: { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-800', shadow: 'shadow-orange-100/50', gradient: 'from-orange-500 to-orange-700', line: 'bg-orange-300', iconBg: 'bg-orange-50' },
  ERBD: { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-600', shadow: 'shadow-emerald-100/50', gradient: 'from-emerald-400 to-emerald-600', line: 'bg-emerald-300', iconBg: 'bg-emerald-50' },
  MD: { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-600', shadow: 'shadow-purple-100/50', gradient: 'from-purple-400 to-purple-600', line: 'bg-purple-300', iconBg: 'bg-purple-50' },
  STD: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-600', shadow: 'shadow-blue-100/50', gradient: 'from-blue-400 to-blue-600', line: 'bg-blue-300', iconBg: 'bg-blue-50' },
};

// ==========================================
// KOMPONEN CARD MEMBER
// ==========================================
// PERBAIKAN: Mengunci w-[200px] min-w-[200px] shrink-0 agar tidak pernah berubah ukuran
const MemberCard = ({ member, deptCode }) => {
  if (!member) return null;
  const theme = THEMES[deptCode] || THEMES.BPH;
  const isEB = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Head of Department', 'Vice Head of Dept', 'Head of Division', 'Steering Committee'].includes(member.position);

  return (
    <div className={`bg-white rounded-2xl border ${theme.border} ${theme.shadow} p-5 flex flex-col items-center text-center hover:shadow-md transition-all duration-300 relative overflow-hidden w-[200px] min-w-[200px] shrink-0 mx-auto z-10`}>
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
  const advSC = users.filter(u => u.dept === 'ADV' && u.position === 'Steering Committee');
  const advMonevHead = users.find(u => u.dept === 'ADV' && u.division === 'Monitoring Evaluation' && u.position === 'Head of Division');
  const advMonevStaff = users.filter(u => u.dept === 'ADV' && u.division === 'Monitoring Evaluation' && u.position !== 'Head of Division');

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
  const stdStruct = getDivisionalStructure('STD', ['Staff Performance', 'Talent Management']);

  const TSAUSUFrame = () => (
    <>
      <div className="absolute inset-0 border-[3px] border-tsa-green rounded-[1.4rem] pointer-events-none z-0 opacity-80"></div>
      <div className="absolute inset-[5px] border-2 border-tsa-gold rounded-[1.1rem] pointer-events-none z-0 opacity-60"></div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20 md:pb-10 overflow-x-hidden">
      <Navbar />
      
      <main className="max-w-[1400px] mx-auto px-4 mt-10">
        
        {/* HEADER */}
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
            <section className="relative bg-white rounded-3xl shadow-sm p-10">
              <TSAUSUFrame />
              <div className="relative z-10 flex flex-col items-center mb-10">
                <div className={`p-3 ${THEMES.BPH.iconBg} rounded-2xl mb-3 border ${THEMES.BPH.border}`}>
                  <Crown size={28} className={THEMES.BPH.text} />
                </div>
                <h2 className={`text-xl font-black uppercase tracking-widest ${THEMES.BPH.text}`}>Board of Directors</h2>
              </div>
              
              <div className="relative z-10 flex flex-col items-center">
                <MemberCard member={president} deptCode="BPH" />
                <VLine height="h-8" color={THEMES.BPH.line} />
                <MemberCard member={vp} deptCode="BPH" />
                <VLine height="h-8" color={THEMES.BPH.line} />
                
                {/* Sec & Treas: Jarak Presisi dengan calc */}
                <div className="w-full flex flex-col items-center max-w-[600px]">
                  <div className={`w-[calc(100%-200px)] h-px ${THEMES.BPH.line} hidden md:block`}></div>
                  <div className="hidden md:flex justify-between w-[calc(100%-200px)]">
                    <VLine height="h-8" color={THEMES.BPH.line} />
                    <VLine height="h-8" color={THEMES.BPH.line} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full mt-6 md:mt-0 justify-items-center">
                    <MemberCard member={secretary} deptCode="BPH" />
                    <MemberCard member={treasurer} deptCode="BPH" />
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================== */}
            {/* TIER 2: ADVISORY BOARD (ADV) */}
            {/* ========================================== */}
            <section className="relative bg-white rounded-3xl shadow-sm p-10 mt-10">
              <TSAUSUFrame />
              <div className="relative z-10 flex flex-col items-center mb-10">
                <div className={`p-3 ${THEMES.ADV.iconBg} rounded-2xl mb-3 border ${THEMES.ADV.border}`}>
                  <ShieldCheck size={28} className={THEMES.ADV.text} />
                </div>
                <h2 className={`text-xl font-black uppercase tracking-widest ${THEMES.ADV.text}`}>Advisory Board</h2>
              </div>
              
              <div className="relative z-10 flex flex-col items-center w-full max-w-5xl mx-auto">
                
                <h3 className={`text-sm font-black uppercase tracking-widest mb-1 ${THEMES.ADV.text}`}>Steering Committee</h3>
                
                {/* PERBAIKAN SC: Garis mendatar presisi calc tanpa sisa */}
                {advSC.length === 3 ? (
                  <div className="w-full flex flex-col items-center mt-2 max-w-[800px]">
                    <div className={`w-[calc(100%-200px)] h-px ${THEMES.ADV.line} hidden md:block`}></div>
                    <div className="hidden md:flex justify-between w-[calc(100%-200px)] relative">
                      <VLine height="h-8" color={THEMES.ADV.line} />
                      <div className="absolute left-1/2 -translate-x-1/2"><VLine height="h-8" color={THEMES.ADV.line} /></div>
                      <VLine height="h-8" color={THEMES.ADV.line} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full mt-6 md:mt-0 justify-items-center">
                      {advSC.map(member => <MemberCard key={member.id} member={member} deptCode="ADV" />)}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap justify-center gap-10 z-10 w-full mt-4">
                    {advSC.map(member => <MemberCard key={member.id} member={member} deptCode="ADV" />)}
                  </div>
                )}
                
                <div className="flex flex-col items-center mt-20 w-full">
                  <h3 className={`text-sm font-black uppercase tracking-widest mb-6 ${THEMES.ADV.text}`}>Monitoring & Evaluation</h3>
                  <MemberCard member={advMonevHead} deptCode="ADV" />
                  {advMonevStaff.length > 0 && <VLine height="h-8" color={THEMES.ADV.line} />}
                  
                  {/* PERBAIKAN MONEV: Garis mendatar presisi calc */}
                  {advMonevStaff.length === 3 ? (
                    <div className="w-full flex flex-col items-center max-w-[800px]">
                      <div className={`w-[calc(100%-200px)] h-px ${THEMES.ADV.line} hidden md:block`}></div>
                      <div className="hidden md:flex justify-between w-[calc(100%-200px)] relative">
                        <VLine height="h-8" color={THEMES.ADV.line} />
                        <div className="absolute left-1/2 -translate-x-1/2"><VLine height="h-8" color={THEMES.ADV.line} /></div>
                        <VLine height="h-8" color={THEMES.ADV.line} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full mt-6 md:mt-0 justify-items-center">
                        {advMonevStaff.map(member => <MemberCard key={member.id} member={member} deptCode="ADV" />)}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-center gap-10 mt-6 md:mt-0 w-full">
                      {advMonevStaff.map(member => <MemberCard key={member.id} member={member} deptCode="ADV" />)}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ========================================== */}
            {/* TIER 3: ERBD */}
            {/* ========================================== */}
            <section className="relative bg-white rounded-3xl shadow-sm p-10">
              <TSAUSUFrame />
              <div className="relative z-10 flex flex-col items-center mb-10">
                <div className={`p-3 ${THEMES.ERBD.iconBg} rounded-2xl mb-3 border ${THEMES.ERBD.border}`}>
                  <Building2 size={28} className={THEMES.ERBD.text} />
                </div>
                <h2 className={`text-xl font-black uppercase tracking-widest ${THEMES.ERBD.text}`}>ERBD Department</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mt-1">External Relations & Business Development</p>
              </div>

              <div className="relative z-10 flex flex-col items-center w-full">
                <MemberCard member={erbdKadep} deptCode="ERBD" />
                <VLine height="h-8" color={THEMES.ERBD.line} />
                <MemberCard member={erbdWakadep} deptCode="ERBD" />
                <VLine height="h-8" color={THEMES.ERBD.line} />
                
                {/* PERBAIKAN ERBD: Garis Wakadep ke 4 TL dengan Calc Presisi */}
                <div className="w-full flex flex-col items-center">
                  <div className={`w-[calc(100%-200px)] h-px ${THEMES.ERBD.line} hidden lg:block`}></div>
                  <div className="hidden lg:flex justify-between w-[calc(100%-200px)] relative">
                    <VLine height="h-8" color={THEMES.ERBD.line} />
                    <div className="absolute left-[33.33%] -translate-x-1/2"><VLine height="h-8" color={THEMES.ERBD.line} /></div>
                    <div className="absolute left-[66.66%] -translate-x-1/2"><VLine height="h-8" color={THEMES.ERBD.line} /></div>
                    <VLine height="h-8" color={THEMES.ERBD.line} />
                  </div>
                </div>
                
                {/* Grid 4 Kolom TL dan Staff ERBD Tumpuk */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 w-full mt-6 lg:mt-0 justify-items-center">
                  {erbdTeams.map(team => (
                    <div key={team.name} className="flex flex-col items-center w-full">
                      <MemberCard member={team.tl} deptCode="ERBD" />
                      
                      <div className="flex flex-col items-center w-full">
                        {team.staff.map((member) => (
                          <div key={member.id} className="flex flex-col items-center w-full">
                            <VLine height="h-8" color={THEMES.ERBD.line} />
                            <MemberCard member={member} deptCode="ERBD" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ========================================== */}
            {/* TIER 4: MD */}
            {/* ========================================== */}
            <section className="relative bg-white rounded-3xl shadow-sm p-10">
              <TSAUSUFrame />
              <div className="relative z-10 flex flex-col items-center mb-10">
                <div className={`p-3 ${THEMES.MD.iconBg} rounded-2xl mb-3 border ${THEMES.MD.border}`}>
                  <Building2 size={28} className={THEMES.MD.text} />
                </div>
                <h2 className={`text-xl font-black uppercase tracking-widest ${THEMES.MD.text}`}>MD Department</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mt-1">Media Education</p>
              </div>

              <div className="relative z-10 flex flex-col items-center w-full">
                <MemberCard member={mdStruct.kadep} deptCode="MD" />
                <VLine height="h-8" color={THEMES.MD.line} />
                
                {/* PERBAIKAN MD: Garis Kadep ke 2 Kadiv */}
                <div className="w-full flex flex-col items-center max-w-[700px]">
                  <div className={`w-[calc(100%-200px)] h-px ${THEMES.MD.line} hidden md:block`}></div>
                  <div className="hidden md:flex justify-between w-[calc(100%-200px)]">
                    <VLine height="h-8" color={THEMES.MD.line} />
                    <VLine height="h-8" color={THEMES.MD.line} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full mt-6 md:mt-0 justify-items-center max-w-[900px]">
                  {mdStruct.divs.map(div => (
                    <div key={div.name} className="flex flex-col items-center w-full max-w-[400px]">
                      <MemberCard member={div.kadiv} deptCode="MD" />
                      {div.staff.length > 0 && <VLine height="h-8" color={THEMES.MD.line} />}
                      
                      {/* PERBAIKAN MD STAFF: Berjejer 2-2 dengan garis ganda */}
                      <div className="w-full flex flex-col items-center">
                        {div.staff.length > 1 && (
                          <>
                            <div className={`w-[calc(100%-200px)] h-px ${THEMES.MD.line} hidden md:block`}></div>
                            <div className="hidden md:flex justify-between w-[calc(100%-200px)]">
                               <VLine height="h-8" color={THEMES.MD.line} />
                               <VLine height="h-8" color={THEMES.MD.line} />
                            </div>
                          </>
                        )}
                        <div className={`grid ${div.staff.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-6 w-full mt-6 md:mt-0 justify-items-center`}>
                           {div.staff.map(member => (
                             <div key={member.id} className="flex flex-col items-center w-full">
                               <MemberCard member={member} deptCode="MD" />
                               {/* Jika ganjil dan ini elemen terakhir, tambahkan VLine untuk drop ke bawah (Opsional) */}
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ========================================== */}
            {/* TIER 5: STD */}
            {/* ========================================== */}
            <section className="relative bg-white rounded-3xl shadow-sm p-10">
              <TSAUSUFrame />
              <div className="relative z-10 flex flex-col items-center mb-10">
                <div className={`p-3 ${THEMES.STD.iconBg} rounded-2xl mb-3 border ${THEMES.STD.border}`}>
                  <Building2 size={28} className={THEMES.STD.text} />
                </div>
                <h2 className={`text-xl font-black uppercase tracking-widest ${THEMES.STD.text}`}>STD Department</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mt-1">Staff & Talent Development</p>
              </div>

              <div className="relative z-10 flex flex-col items-center w-full">
                <MemberCard member={stdStruct.kadep} deptCode="STD" />
                <VLine height="h-8" color={THEMES.STD.line} />
                
                {/* PERBAIKAN STD: Garis Kadep ke 2 Kadiv */}
                <div className="w-full flex flex-col items-center max-w-[700px]">
                  <div className={`w-[calc(100%-200px)] h-px ${THEMES.STD.line} hidden md:block`}></div>
                  <div className="hidden md:flex justify-between w-[calc(100%-200px)]">
                    <VLine height="h-8" color={THEMES.STD.line} />
                    <VLine height="h-8" color={THEMES.STD.line} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full mt-6 md:mt-0 justify-items-center max-w-[900px]">
                  {stdStruct.divs.map(div => (
                    <div key={div.name} className="flex flex-col items-center w-full max-w-[400px]">
                      <MemberCard member={div.kadiv} deptCode="STD" />
                      {div.staff.length > 0 && <VLine height="h-8" color={THEMES.STD.line} />}
                      
                      {/* PERBAIKAN STD STAFF: Berjejer 2-2 dengan garis ganda */}
                      <div className="w-full flex flex-col items-center">
                        {div.staff.length > 1 && (
                          <>
                            <div className={`w-[calc(100%-200px)] h-px ${THEMES.STD.line} hidden md:block`}></div>
                            <div className="hidden md:flex justify-between w-[calc(100%-200px)]">
                               <VLine height="h-8" color={THEMES.STD.line} />
                               <VLine height="h-8" color={THEMES.STD.line} />
                            </div>
                          </>
                        )}
                        <div className={`grid ${div.staff.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-6 w-full mt-6 md:mt-0 justify-items-center`}>
                           {div.staff.map(member => (
                             <div key={member.id} className="flex flex-col items-center w-full">
                               <MemberCard member={member} deptCode="STD" />
                             </div>
                           ))}
                        </div>
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