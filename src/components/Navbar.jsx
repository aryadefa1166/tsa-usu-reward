import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { LogOut, Home, BarChart2, CheckSquare, Users, Shield, ClipboardCheck, Vote } from 'lucide-react';
import tsaLogo from '../assets/tsa-logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State untuk status Voting End of Term
  const [votingActive, setVotingActive] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('app_settings').select('voting_status').eq('id', 1).single();
      if (!error && data) {
        setVotingActive(data.voting_status === 'ACTIVE');
      }
    };
    fetchSettings();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // =========================================
  // LOGIKA FILTER AKSES MENU (BERDASARKAN INTEGER)
  // 1:Admin, 2:BPH/ADV, 3:Kadep, 4:Kadiv, 5:Staff/TL
  // =========================================
  const role = user?.role;
  const isAdmin = role === 1;
  const isReportViewer = role >= 2 && role <= 5; // Admin (1) tidak punya rapor
  const isAssessor = role >= 2 && role <= 4; // Staff/TL (5) dan Admin (1) tidak menilai
  
  // LOGIKA AKSES SEKRETARIS MUTLAK
  const isSecretary = role === 2 && user?.position === 'Secretary';
  
  // LOGIKA AKSES VOTING (Hanya muncul jika ACTIVE dan user adalah pengurus)
  const showVoting = votingActive && role >= 2 && role <= 5;

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Home, show: true },
    { name: 'My Report', path: '/report', icon: BarChart2, show: isReportViewer },
    { name: 'Assessment', path: '/input-assessment', icon: CheckSquare, show: isAssessor },
    { name: 'Attendance', path: '/input-attendance', icon: ClipboardCheck, show: isSecretary },
    { name: 'Our Team', path: '/our-team', icon: Users, show: true },
    { name: 'Voting', path: '/voting', icon: Vote, show: showVoting }, // TAB EKSKLUSIF END OF TERM
    { name: 'Admin', path: '/manage-users', icon: Shield, show: isAdmin },
  ];

  // Helper konversi angka ke teks jabatan untuk di sudut kanan atas
  const getRoleText = (r) => {
    switch(r) {
      case 1: return 'ADMIN';
      case 2: return 'BPH / ADV';
      case 3: return 'KADEP';
      case 4: return 'KADIV';
      case 5: return 'STAFF';
      default: return 'USER';
    }
  };

  return (
    <>
      {/* ========================================= */}
      {/* 1. TOP NAVBAR (HANYA MUNCUL DI LAPTOP/IPAD) */}
      {/* ========================================= */}
      <nav className="hidden md:block bg-white shadow-sm border-b border-gray-100 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-12">
            
            {/* Bagian Kiri: Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center border border-green-100 overflow-hidden">
                  <img src={tsaLogo} alt="TSA Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-tsa-dark tracking-tight leading-none">
                  TSA USU R.E.W.A.R.D
                </span>
                <span className="text-[9px] font-bold text-gray-400 tracking-widest mt-1">
                  REVIEW, EVALUATION, AND AWARD
                </span>
              </div>
            </div>

            {/* Bagian Tengah: Navigasi Desktop */}
            <div className="flex items-center gap-1">
              {navLinks.filter(link => link.show).map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                
                // Styling khusus untuk tombol Voting agar stand-out
                const isVotingBtn = link.name === 'Voting';

                return (
                  <button
                    key={link.name}
                    onClick={() => navigate(link.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive 
                        ? (isVotingBtn ? 'bg-tsa-gold text-white shadow-sm' : 'bg-green-50 text-tsa-green') 
                        : (isVotingBtn ? 'text-tsa-gold hover:bg-yellow-50' : 'text-gray-500 hover:bg-gray-50 hover:text-tsa-dark')
                    }`}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    {link.name}
                  </button>
                );
              })}
            </div>
            
            {/* Bagian Kanan: Profil Stacked Text & Logout */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-sm font-black text-tsa-dark uppercase">
                    {getRoleText(role)}
                </span>
                {user?.position && (
                  <span className="text-[9px] font-bold text-tsa-green uppercase mt-0.5 tracking-wider">
                    {user.position}
                  </span>
                )}
              </div>
              
              <div className="w-px h-8 bg-gray-200"></div>
              
              <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-700 transition-all uppercase tracking-wider">
                <LogOut size={16} strokeWidth={2.5} />
                Logout
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ========================================= */}
      {/* 2. BOTTOM NAVIGATION BAR (HANYA MUNCUL DI HP) */}
      {/* ========================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 pb-safe">
        <div className="flex justify-around items-center h-16 px-2 overflow-x-auto hide-scrollbar">
          {navLinks.filter(link => link.show).map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            const isVotingBtn = link.name === 'Voting';

            return (
              <button
                key={link.name}
                onClick={() => navigate(link.path)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-full gap-1 transition-all ${
                  isActive 
                    ? (isVotingBtn ? 'text-tsa-gold' : 'text-tsa-green') 
                    : (isVotingBtn ? 'text-yellow-600' : 'text-gray-400 hover:text-gray-600')
                }`}
              >
                <div className={`p-1.5 rounded-full ${isActive ? (isVotingBtn ? 'bg-yellow-50' : 'bg-green-50') : 'bg-transparent'}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[9px] font-bold tracking-wide ${isActive ? (isVotingBtn ? 'text-tsa-gold' : 'text-tsa-green') : 'text-gray-400'}`}>
                  {link.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      
      {/* Spacer untuk HP agar konten paling bawah tidak tertutup Bottom Nav */}
      <div className="h-16 md:hidden"></div>
    </>
  );
};

export default Navbar;