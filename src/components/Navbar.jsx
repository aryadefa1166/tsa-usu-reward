import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 py-3">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-12">
          
          {/* BAGIAN KIRI: Logo Asli */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center border border-green-100 overflow-hidden">
                <img src="/logo-tsa.png" alt="TSA Logo" className="w-full h-full object-contain" onError={(e) => e.target.style.display='none'} />
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
          
          {/* BAGIAN KANAN: Profil & Logout */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-sm font-black text-tsa-dark uppercase">{user?.role || 'USER'}</span>
              <span className="text-[9px] font-bold text-tsa-green bg-green-50 px-2 py-0.5 rounded-full uppercase mt-0.5 tracking-wider">
                {user?.position || 'MEMBER'}
              </span>
            </div>
            
            <div className="w-px h-8 bg-gray-200"></div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-700 transition-all uppercase tracking-wider"
            >
              <LogOut size={16} strokeWidth={2.5} />
              Logout
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;