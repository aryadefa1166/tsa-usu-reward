import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Users, CheckSquare, ClipboardList, Trophy, LogOut, Vote } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Home, show: true },
    { name: 'Manage Users', path: '/manage-users', icon: Users, show: user?.role === 'bph' || user?.role === 'adv' },
    { name: 'Input Penilaian', path: '/input-assessment', icon: CheckSquare, show: user?.role !== 'member' },
    { name: 'Input Absensi', path: '/input-attendance', icon: ClipboardList, show: user?.position === 'Secretary' },
    { name: 'Voting', path: '/voting', icon: Vote, show: true },
    { name: 'Leaderboard', path: '/results', icon: Trophy, show: true },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-black text-tsa-dark tracking-tighter">
              TSA<span className="text-tsa-green">REWARD</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.filter(link => link.show).map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                    isActive 
                      ? 'bg-tsa-green text-white shadow-sm' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-tsa-green'
                  }`}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  {link.name}
                </Link>
              );
            })}
            
            <div className="w-px h-6 bg-gray-200 mx-2"></div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
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