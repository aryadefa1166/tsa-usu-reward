import { useAuth } from '../context/AuthContext';
import { LogOut, UserCircle } from 'lucide-react';
import tsaLogo from '../assets/tsa-logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      {/* Kiri: Logo Kecil */}
      <div className="flex items-center gap-3">
        <img src={tsaLogo} alt="Logo" className="h-8 w-auto" />
        <div className="hidden md:block">
          <h1 className="text-sm font-bold text-slate-800 leading-tight">TSA USU R.E.W.A.R.D</h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Internal System</p>
        </div>
      </div>

      {/* Kanan: Profil & Logout */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-700">{user?.username || 'User'}</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200 uppercase">
            {user?.role}
          </span>
        </div>
        
        <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>

        <button 
          onClick={logout}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all text-sm font-medium"
          title="Keluar Sistem"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;