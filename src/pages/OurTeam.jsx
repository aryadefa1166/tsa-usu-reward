import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { Loader2, Building2, Crown, ShieldCheck } from 'lucide-react';

// ==========================================
// TEMA WARNA DEPARTEMEN MUTLAK
// ==========================================
const THEMES = {
  BPH: { border: 'border-pink-200', bg: 'bg-pink-50', text: 'text-pink-600', shadow: 'shadow-pink-100/50', gradient: 'from-pink-400 to-pink-600', line: 'border-pink-300', vline: 'bg-pink-300', iconBg: 'bg-pink-50' },
  // PERBAIKAN ADV: Menggunakan palet Coklat Elegan (Amber/Stone)
  ADV: { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-800', shadow: 'shadow-amber-100/50', gradient: 'from-amber-600 to-amber-800', line: 'border-amber-300', vline: 'bg-amber-300', iconBg: 'bg-amber-50' },
  ERBD: { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-600', shadow: 'shadow-emerald-100/50', gradient: 'from-emerald-400 to-emerald-600', line: 'border-emerald-300', vline: 'bg-emerald-300', iconBg: 'bg-emerald-50' },
  MD: { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-600', shadow: 'shadow-purple-100/50', gradient: 'from-purple-400 to-purple-600', line: 'border-purple-300', vline: 'bg-purple-300', iconBg: 'bg-purple-50' },
  STD: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-600', shadow: 'shadow-blue-100/50', gradient: 'from-blue-400 to-blue-600', line: 'border-blue-300', vline: 'bg-blue-300', iconBg: 'bg-blue-50' },
};

// ==========================================
// KOMPONEN CARD MEMBER (ASLI DARI KAMU)
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
const VLine = ({ height = 'h-8', color }) => <div className={`w-px ${height} ${color} mx-auto relative z-0`}></div>;

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

  const splitStaffToTwoColumns = (staffArray) => {
    const col1 = [];
    const col2 = [];
    staffArray.forEach((member, idx) => {
      if (idx % 2 === 0) col1.push(member);
      else col2.push(member);
    });
    return [col1, col2];
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20 md:pb-10 overflow-x-hidden">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 mt-10">
        
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
            <section className="relative p-[3px] bg-gradient-to-r from-tsa-green to-tsa-gold rounded-[2rem] shadow-xl shadow-green-900/5">
              <div className="bg-white/95 backdrop-blur-sm w-full h-full rounded-[calc(2rem-3px)] p-10 relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center mb-10">
                  <div className={`p-3 ${THEMES.BPH.iconBg} rounded-2xl mb-3 border ${THEMES.BPH.border}`}>
                    <Crown size={28} className={THEMES.BPH.text} />
                  </div>
                  <h2 className={`text-xl font-black uppercase tracking-widest ${THEMES.BPH.text}`}>Board of Directors</h2>
                </div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <MemberCard member={president} deptCode="BPH" />
                  <VLine height="h-8" color={THEMES.BPH.vline} />
                  <MemberCard member={vp} deptCode="BPH" />
                  <VLine height="h-8" color={THEMES.BPH.vline} />
                  
                  {/* BORDER-BOX METHOD: BPH (2 Kolom) */}
                  <div className="w-full max-w-4xl mx-auto">
                    <div className="hidden md:grid grid-cols-2 gap-6 w-full relative">
                      <div className="w-full flex justify-end">
                        {/* Sudut Kiri (Batas Atas dan Kanan) */}
                        <div className={`w-1/2 h-8 border-t border-r ${THEMES.BPH.line} rounded-tr-none`}></div>
                      </div>
                      <div className="w-full flex justify-start">
                        {/* Sudut Kanan (Batas Atas dan Kiri) */}
                        <div className={`w-1/2 h-8 border-t border-l ${THEMES.BPH.line} rounded-tl-none`}></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-0 md:mt-0">
                      <div className="flex justify-center"><MemberCard member={secretary} deptCode="BPH" /></div>
                      <div className="flex justify-center"><MemberCard member={treasurer} deptCode="BPH" /></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================== */}
            {/* TIER 2: ADVISORY BOARD (ADV) */}
            {/* ========================================== */}
            <section className="relative p-[3px] bg-gradient-to-r from-tsa-green to-tsa-gold rounded-[2rem] shadow-xl shadow-green-900/5 mt-10">
              <div className="bg-white/95 backdrop-blur-sm w-full h-full rounded-[calc(2rem-3px)] p-10 relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center mb-10">
                  <div className={`p-3 ${THEMES.ADV.iconBg} rounded-2xl mb-3 border ${THEMES.ADV.border}`}>
                    <ShieldCheck size={28} className={THEMES.ADV.text} />
                  </div>
                  <h2 className={`text-xl font-black uppercase tracking-widest ${THEMES.ADV.text}`}>Advisory Board</h2>
                </div>
                
                <div className="relative z-10 flex flex-col items-center w-full max-w-4xl mx-auto">
                  <h3 className={`text-sm font-black uppercase tracking-widest mb-1 ${THEMES.ADV.text}`}>Steering Committee</h3>
                  
                  {/* BORDER-BOX METHOD: ADV SC (3 Kolom) */}
                  {advSC.length === 3 ? (
                    <div className="w-full mt-2">
                      <div className="hidden md:grid grid-cols-3 gap-6 w-full relative">
                        <div className="w-full flex justify-end">
                          {/* Sudut Kiri */}
                          <div className={`w-1/2 h-8 border-t border-r ${THEMES.ADV.line}`}></div>
                        </div>
                        <div className="w-full flex justify-center">
                          {/* T-Junction Tengah */}
                          <div className={`w-full h-8 border-t border-x-0 ${THEMES.ADV.line} relative`}>
                             <div className={`absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 ${THEMES.ADV.vline}`}></div>
                          </div>
                        </div>
                        <div className="w-full flex justify-start">
                          {/* Sudut Kanan */}
                          <div className={`w-1/2 h-8 border-t border-l ${THEMES.ADV.line}`}></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-0 md:mt-0">
                        {advSC.map(member => (
                          <div key={member.id} className="flex justify-center w-full">
                            <MemberCard member={member} deptCode="ADV" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-center gap-6 z-10 w-full mt-4">
                      {advSC.map(member => <MemberCard key={member.id} member={member} deptCode="ADV" />)}
                    </div>
                  )}
                  
                  {/* Lapis 2: MONEV Head */}
                  <div className="flex flex-col items-center mt-16 w-full">
                    <h3 className={`text-sm font-black uppercase tracking-widest mb-6 ${THEMES.ADV.text}`}>Monitoring & Evaluation</h3>
                    <MemberCard member={advMonevHead} deptCode="ADV" />
                    {advMonevStaff.length > 0 && <VLine height="h-8" color={THEMES.ADV.vline} />}
                    
                    {/* BORDER-BOX METHOD: ADV MONEV (3 Kolom) */}
                    {advMonevStaff.length === 3 ? (
                      <div className="w-full">
                        <div className="hidden md:grid grid-cols-3 gap-6 w-full relative">
                          <div className="w-full flex justify-end">
                            <div className={`w-1/2 h-8 border-t border-r ${THEMES.ADV.line}`}></div>
                          </div>
                          <div className="w-full flex justify-center">
                            <div className={`w-full h-8 border-t ${THEMES.ADV.line} relative`}>
                               <div className={`absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 ${THEMES.ADV.vline}`}></div>
                            </div>
                          </div>
                          <div className="w-full flex justify-start">
                            <div className={`w-1/2 h-8 border-t border-l ${THEMES.ADV.line}`}></div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-0 md:mt-0">
                          {advMonevStaff.map(member => (
                            <div key={member.id} className="flex justify-center w-full">
                              <MemberCard member={member} deptCode="ADV" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap justify-center gap-4 mt-6 md:mt-0 w-full">
                        {advMonevStaff.map(member => <MemberCard key={member.id} member={member} deptCode="ADV" />)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================== */}
            {/* TIER 3: ERBD */}
            {/* ========================================== */}
            <section className="relative p-[3px] bg-gradient-to-r from-tsa-green to-tsa-gold rounded-[2rem] shadow-xl shadow-green-900/5">
              <div className="bg-white/95 backdrop-blur-sm w-full h-full rounded-[calc(2rem-3px)] p-10 relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center mb-10">
                  <div className={`p-3 ${THEMES.ERBD.iconBg} rounded-2xl mb-3 border ${THEMES.ERBD.border}`}>
                    <Building2 size={28} className={THEMES.ERBD.text} />
                  </div>
                  <h2 className={`text-xl font-black uppercase tracking-widest ${THEMES.ERBD.text}`}>ERBD Department</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mt-1">External Relations & Business Development</p>
                </div>

                <div className="relative z-10 flex flex-col items-center w-full">
                  <MemberCard member={erbdKadep} deptCode="ERBD" />
                  <VLine height="h-8" color={THEMES.ERBD.vline} />
                  <MemberCard member={erbdWakadep} deptCode="ERBD" />
                  <VLine height="h-8" color={THEMES.ERBD.vline} />
                  
                  {/* BORDER-BOX METHOD: ERBD (4 Kolom) */}
                  <div className="w-full">
                    <div className="hidden lg:grid grid-cols-4 gap-6 w-full relative">
                      <div className="w-full flex justify-end">
                        <div className={`w-1/2 h-8 border-t border-r ${THEMES.ERBD.line}`}></div>
                      </div>
                      <div className="w-full flex justify-center">
                        <div className={`w-full h-8 border-t ${THEMES.ERBD.line} relative`}>
                           <div className={`absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 ${THEMES.ERBD.vline}`}></div>
                        </div>
                      </div>
                      <div className="w-full flex justify-center">
                        <div className={`w-full h-8 border-t ${THEMES.ERBD.line} relative`}>
                           <div className={`absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 ${THEMES.ERBD.vline}`}></div>
                        </div>
                      </div>
                      <div className="w-full flex justify-start">
                        <div className={`w-1/2 h-8 border-t border-l ${THEMES.ERBD.line}`}></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-0 lg:mt-0">
                      {erbdTeams.map(team => (
                        <div key={team.name} className="flex flex-col items-center w-full">
                          <MemberCard member={team.tl} deptCode="ERBD" />
                          
                          <div className="flex flex-col items-center w-full">
                            {team.staff.map((member) => (
                              <div key={member.id} className="flex flex-col items-center w-full">
                                <VLine height="h-8" color={THEMES.ERBD.vline} />
                                <MemberCard member={member} deptCode="ERBD" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================== */}
            {/* TIER 4: MD */}
            {/* ========================================== */}
            <section className="relative p-[3px] bg-gradient-to-r from-tsa-green to-tsa-gold rounded-[2rem] shadow-xl shadow-green-900/5">
              <div className="bg-white/95 backdrop-blur-sm w-full h-full rounded-[calc(2rem-3px)] p-10 relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center mb-10">
                  <div className={`p-3 ${THEMES.MD.iconBg} rounded-2xl mb-3 border ${THEMES.MD.border}`}>
                    <Building2 size={28} className={THEMES.MD.text} />
                  </div>
                  <h2 className={`text-xl font-black uppercase tracking-widest ${THEMES.MD.text}`}>MD Department</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mt-1">Media Education</p>
                </div>

                <div className="relative z-10 flex flex-col items-center w-full">
                  <MemberCard member={mdStruct.kadep} deptCode="MD" />
                  <VLine height="h-8" color={THEMES.MD.vline} />
                  
                  {/* BORDER-BOX METHOD: MD KADIV (2 Kolom) */}
                  <div className="w-full">
                    <div className="hidden lg:grid grid-cols-2 gap-6 w-full relative">
                      <div className="w-full flex justify-end">
                        <div className={`w-1/2 h-8 border-t border-r ${THEMES.MD.line}`}></div>
                      </div>
                      <div className="w-full flex justify-start">
                        <div className={`w-1/2 h-8 border-t border-l ${THEMES.MD.line}`}></div>
                      </div>
                    </div>
                    
                    {/* GRID KADIV */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-0 lg:mt-0 relative">
                      {mdStruct.divs.map((div, divIndex) => {
                        const [col1Staff, col2Staff] = splitStaffToTwoColumns(div.staff);
                        
                        return (
                          <div key={div.name} className="flex flex-col items-center w-full">
                            <MemberCard member={div.kadiv} deptCode="MD" />
                            {div.staff.length > 0 && <VLine height="h-8" color={THEMES.MD.vline} />}
                            
                            {/* BORDER-BOX METHOD: MD STAFF */}
                            {div.staff.length > 0 && (
                              <div className="w-full">
                                <div className="hidden md:grid grid-cols-2 gap-6 w-full relative">
                                  <div className="w-full flex justify-end">
                                    <div className={`w-1/2 h-8 border-t border-r ${THEMES.MD.line}`}></div>
                                  </div>
                                  <div className="w-full flex justify-start">
                                    <div className={`w-1/2 h-8 border-t border-l ${THEMES.MD.line}`}></div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* GRID 2 KOLOM STAFF */}
                            <div className="grid grid-cols-2 gap-6 w-full mt-0 md:mt-0">
                              <div className="flex flex-col items-center w-full">
                                {col1Staff.map((member, idx) => (
                                  <div key={member.id} className="flex flex-col items-center w-full">
                                    {idx > 0 && <VLine height="h-8" color={THEMES.MD.vline} />}
                                    <MemberCard member={member} deptCode="MD" />
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex flex-col items-center w-full">
                                {col2Staff.map((member, idx) => (
                                  <div key={member.id} className="flex flex-col items-center w-full">
                                    {idx > 0 && <VLine height="h-8" color={THEMES.MD.vline} />}
                                    <MemberCard member={member} deptCode="MD" />
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================== */}
            {/* TIER 5: STD */}
            {/* ========================================== */}
            <section className="relative p-[3px] bg-gradient-to-r from-tsa-green to-tsa-gold rounded-[2rem] shadow-xl shadow-green-900/5">
              <div className="bg-white/95 backdrop-blur-sm w-full h-full rounded-[calc(2rem-3px)] p-10 relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center mb-10">
                  <div className={`p-3 ${THEMES.STD.iconBg} rounded-2xl mb-3 border ${THEMES.STD.border}`}>
                    <Building2 size={28} className={THEMES.STD.text} />
                  </div>
                  <h2 className={`text-xl font-black uppercase tracking-widest ${THEMES.STD.text}`}>STD Department</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mt-1">Staff & Talent Development</p>
                </div>

                <div className="relative z-10 flex flex-col items-center w-full">
                  <MemberCard member={stdStruct.kadep} deptCode="STD" />
                  <VLine height="h-8" color={THEMES.STD.vline} />
                  
                  {/* BORDER-BOX METHOD: STD KADIV (2 Kolom) */}
                  <div className="w-full">
                    <div className="hidden lg:grid grid-cols-2 gap-6 w-full relative">
                      <div className="w-full flex justify-end">
                        <div className={`w-1/2 h-8 border-t border-r ${THEMES.STD.line}`}></div>
                      </div>
                      <div className="w-full flex justify-start">
                        <div className={`w-1/2 h-8 border-t border-l ${THEMES.STD.line}`}></div>
                      </div>
                    </div>
                    
                    {/* GRID KADIV */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-0 lg:mt-0 relative">
                      {stdStruct.divs.map((div, divIndex) => {
                        const [col1Staff, col2Staff] = splitStaffToTwoColumns(div.staff);
                        
                        return (
                          <div key={div.name} className="flex flex-col items-center w-full">
                            <MemberCard member={div.kadiv} deptCode="STD" />
                            {div.staff.length > 0 && <VLine height="h-8" color={THEMES.STD.vline} />}
                            
                            {/* BORDER-BOX METHOD: STD STAFF */}
                            {div.staff.length > 0 && (
                              <div className="w-full">
                                <div className="hidden md:grid grid-cols-2 gap-6 w-full relative">
                                  <div className="w-full flex justify-end">
                                    <div className={`w-1/2 h-8 border-t border-r ${THEMES.STD.line}`}></div>
                                  </div>
                                  <div className="w-full flex justify-start">
                                    <div className={`w-1/2 h-8 border-t border-l ${THEMES.STD.line}`}></div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* GRID 2 KOLOM STAFF */}
                            <div className="grid grid-cols-2 gap-6 w-full mt-0 md:mt-0">
                              <div className="flex flex-col items-center w-full">
                                {col1Staff.map((member, idx) => (
                                  <div key={member.id} className="flex flex-col items-center w-full">
                                    {idx > 0 && <VLine height="h-8" color={THEMES.STD.vline} />}
                                    <MemberCard member={member} deptCode="STD" />
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex flex-col items-center w-full">
                                {col2Staff.map((member, idx) => (
                                  <div key={member.id} className="flex flex-col items-center w-full">
                                    {idx > 0 && <VLine height="h-8" color={THEMES.STD.vline} />}
                                    <MemberCard member={member} deptCode="STD" />
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
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