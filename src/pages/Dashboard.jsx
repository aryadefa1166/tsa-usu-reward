import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Lock, Unlock, Users, Trophy, ClipboardList, CheckSquare } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const PeriodCard = ({ title, status, description, icon: Icon, isLocked, onClick }) => (
    <div onClick={!isLocked ? onClick : undefined} className={`relative p-6 rounded-2xl border transition-all ${isLocked ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed' : 'bg-white border-tsa-green shadow-sm hover:shadow-md cursor-pointer'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${isLocked ? 'bg-gray-200 text-gray-500' : 'bg-green-50 text-tsa-green'}`}><Icon size={24} /></div>
        <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${isLocked ? 'bg-gray-200 text-gray-500' : 'bg-tsa-green text-white'}`}>
          {isLocked ? <Lock size={12} /> : <Unlock size={12} />} {status}
        </div>
      </div>
      <h3 className="font-bold text-tsa-dark text-lg">{title}</h3>
      <p className="text-xs text-gray-500 mt-2">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6 mt-6">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-tsa-dark tracking-tight">Dashboard</h1>
          {/* Bahasa Inggris dan fallback ke 'User' jika full_name di DB kosong */}
          <p className="text-gray-500 mt-1">Welcome back, <span className="font-bold text-tsa-green">{user?.full_name || 'User'}</span></p>
        </div>

        {/* Hak Akses EKSLUSIF hanya untuk role 'admin' */}
        {user?.role === 'admin' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8">
            <h2 className="text-lg font-bold text-tsa-dark mb-4 flex items-center gap-2"><Users size={20} className="text-tsa-green" /> Admin Control Center</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div onClick={() => navigate('/manage-users')} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer transition-all">
                <h3 className="font-bold text-sm">User Management</h3>
                <p className="text-xs text-gray-500 mt-1">Add, Edit, or Delete Members & Profile Pictures</p>
              </div>
              <div className="p-4 border border-gray-100 rounded-xl bg-gray-50 opacity-70">
                <h3 className="font-bold text-sm text-gray-500 flex items-center gap-2">Period Settings <Lock size={14} /></h3>
                <p className="text-xs text-gray-500 mt-1">Lock/Unlock evaluation periods (Coming Soon)</p>
              </div>
            </div>
          </div>
        )}

        {user?.position === 'Secretary' && (
           <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl mb-8 flex justify-between items-center cursor-pointer hover:bg-blue-100 transition-all" onClick={() => navigate('/input-attendance')}>
              <div>
                <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2"><ClipboardList size={20} /> Secretary Access: Input Attendance</h2>
                <p className="text-xs text-blue-700 mt-1">Input actual member attendance records for Blueprint metrics calculation.</p>
              </div>
           </div>
        )}

        <h2 className="text-xl font-bold text-tsa-dark mb-4">Evaluation Roadmap</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <PeriodCard title="Quarter 1" status="ACTIVE" description="Initial performance assessment based on a 1-5 scale." icon={CheckSquare} isLocked={false} onClick={() => navigate('/input-assessment')} />
          <PeriodCard title="Quarter 2" status="LOCKED" description="Locked. Waiting for the evaluation period." icon={CheckSquare} isLocked={true} />
          <PeriodCard title="Quarter 3" status="LOCKED" description="Locked. Waiting for the evaluation period." icon={CheckSquare} isLocked={true} />
          <PeriodCard title="Quarter 4" status="LOCKED" description="Locked. Waiting for the evaluation period." icon={CheckSquare} isLocked={true} />
        </div>

        <div className="bg-gradient-to-r from-tsa-dark to-gray-900 p-8 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden mb-12">
            <Trophy size={160} className="absolute -left-10 -bottom-10 text-white opacity-5 transform -rotate-12" />
            <div className="z-10">
                <h2 className="text-2xl font-black text-white">End of Term Awards</h2>
                <p className="text-sm text-gray-400 mt-2 max-w-xl">
                    Cumulative calculation of Q1-Q4, BPH Evaluation, and <strong>Weighted Voting System</strong> for Most Favorite EB, Best Project, etc., based on the Blueprint.
                </p>
            </div>
            <div className="z-10 flex flex-col gap-3 min-w-[200px]">
                <button disabled className="bg-gray-800 text-gray-500 py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed border border-gray-700">
                    <Lock size={16} /> Voting Locked
                </button>
                <button onClick={() => navigate('/results')} className="bg-tsa-gold text-tsa-dark py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-yellow-500 transition-all flex items-center justify-center gap-2">
                    View Q1 Leaderboard
                </button>
            </div>
        </div>
      </main>
    </div>
  );
};
export default Dashboard;