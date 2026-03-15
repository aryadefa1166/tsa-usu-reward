import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { Loader2, Building2, Crown, ShieldCheck } from 'lucide-react';

const MemberCard = ({ member }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center hover:shadow-lg transition-all duration-300">
    <div className="w-24 h-24 rounded-full border-4 border-green-50 overflow-hidden mb-4 relative shadow-inner">
      <img 
        src={member.photo_url || `https://ui-avatars.com/api/?name=${member.full_name}&background=dcfce7&color=166534&bold=true`} 
        alt={member.full_name} 
        className="w-full h-full object-cover" 
      />
    </div>
    <h3 className="font-bold text-tsa-dark text-sm leading-tight mb-1">{member.full_name}</h3>
    
    <span className="text-[10px] font-black text-tsa-green uppercase tracking-wider mt-1">
      {member.position || 'Staff'}
    </span>
    
    {member.division && member.division !== '-' && (
      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
        {member.division}
      </span>
    )}
    
    <div className="mt-4 pt-3 border-t border-gray-50 w-full">
      <span className="bg-gray-50 border border-gray-100 text-gray-500 px-3 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase">
        {member.cohort || 'Cohort 2026'}
      </span>
    </div>
  </div>
);

const OurTeam = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    // Mengambil data dan mengurutkan berdasarkan sort_order (mutlak)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .neq('role', 'admin') // Sembunyikan akun super admin
      .order('sort_order', { ascending: true });
      
    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  // Logika Grouping (O(N) Complexity)
  const bph = users.filter(u => u.role === 'bph');
  const adv = users.filter(u => u.role === 'adv');
  
  // Grouping departemen, mengecualikan BPH dan ADV
  const departments = users.filter(u => u.role !== 'bph' && u.role !== 'adv').reduce((acc, user) => {
    const dept = user.dept || 'General';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(user);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 mt-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-tsa-dark tracking-tight">Organizational Structure</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">TSA USU R.E.W.A.R.D • Executive Board & Staff</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-tsa-green" size={40} />
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* TIER 1: BPH */}
            {bph.length > 0 && (
              <section>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Crown size={20} className="text-tsa-gold" />
                  <h2 className="text-xl font-black text-tsa-dark uppercase tracking-widest">Board of Directors</h2>
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                  {bph.map(member => <MemberCard key={member.id} member={member} />)}
                </div>
              </section>
            )}

            {/* TIER 2: ADV */}
            {adv.length > 0 && (
              <section>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <ShieldCheck size={20} className="text-blue-500" />
                  <h2 className="text-xl font-black text-tsa-dark uppercase tracking-widest">Advisory Board</h2>
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                  {adv.map(member => <MemberCard key={member.id} member={member} />)}
                </div>
              </section>
            )}

            {/* TIER 3: DEPARTMENTS */}
            {Object.entries(departments).map(([deptName, members]) => (
              <section key={deptName} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-8 border-b border-gray-100 pb-4">
                  <Building2 size={24} className="text-tsa-green" />
                  <h2 className="text-2xl font-black text-tsa-dark tracking-tight uppercase">{deptName} DEPARTMENT</h2>
                  <span className="ml-auto bg-green-50 text-tsa-green text-xs font-bold px-3 py-1 rounded-full">
                    {members.length} Staff
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {members.map(member => <MemberCard key={member.id} member={member} />)}
                </div>
              </section>
            ))}

          </div>
        )}
      </main>
    </div>
  );
};

export default OurTeam;