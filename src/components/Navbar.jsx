import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import tsaLogo from '../assets/tsa-logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();

  // Helper untuk menampilkan Departemen di bawah nama
  // Jika Admin -> Tampilkan "Admin"
  // Jika BPH/Member -> Tampilkan Dept-nya (misal "BPH", "ADV", "ERBD")
  const userDept = user?.role === 'admin' ? 'ADMIN' : user?.dept;

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
      {/* Kiri: Logo & Judul */}
      <div className="flex items-center gap-3">
        <img src={tsaLogo} alt="Logo" className="h-10 w-auto" />
        <div className="hidden md:block">
          <h1 className="text-base font-bold text-tsa-green leading-tight tracking-tight">TSA USU R.E.W.A.R.D</h1>
          <p className="text-[10px] text-tsa-dark/60 font-bold uppercase tracking-widest">
            REVIEW, EVALUATION, AND AWARD
          </p>
        </div>
      </div>

      {/* Kanan: Profil & Logout */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          {/* NAMA LENGKAP */}
          <p className="text-sm font-bold text-tsa-dark uppercase">{user?.full_name || user?.username}</p>
          {/* DEPARTEMEN (Bukan Role) */}
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-tsa-green/10 text-tsa-green font-bold border border-tsa-green/20 uppercase">
            {userDept}
          </span>
        </div>
        
        <div className="h-8 w-[1px] bg-gray-200 mx-1"></div>

        <button 
          onClick={logout}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all text-xs font-bold uppercase tracking-wider"
          title="Logout"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">LOGOUT</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;