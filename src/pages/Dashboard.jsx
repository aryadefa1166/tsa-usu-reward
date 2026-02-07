import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { ROLES, PERMISSIONS } from '../utils/constants';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Users, CalendarClock, Trophy, Star } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  // 1. ADMIN PANEL (ENGLISH)
  const AdminPanel = () => (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl mb-8">
      <h2 className="text-xl font-bold text-tsa-dark mb-2 flex items-center gap-2">
        <div className="p-2 bg-tsa-green/10 rounded-lg text-tsa-green"><Users size={20}/></div>
        Admin Control Center
      </h2>
      <p className="text-sm text-gray-500 mb-6 ml-11">Manage users, database, and evaluation periods.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link 
          to="/manage-users" 
          className="p-5 bg-gray-50 border border-gray-200 rounded-2xl text-left hover:bg-green-50 hover:border-tsa-green transition-all group relative overflow-hidden"
        >
          <div className="relative z-10">
            <h3 className="font-bold text-tsa-dark group-hover:text-tsa-green transition-colors">User Management</h3>
            <p className="text-xs text-gray-500 mt-2">Add, Edit, or Delete Members</p>
          </div>
        </Link>

        <button className="p-5 bg-gray-50 border border-gray-200 rounded-2xl text-left opacity-60 cursor-not-allowed">
          <h3 className="font-bold text-gray-400 flex items-center gap-2">
            Period Settings <CalendarClock size={16}/>
          </h3>
          <p className="text-xs text-gray-400 mt-2">Coming Soon</p>
        </button>
      </div>
    </div>
  );

  // 2. RESULT BOARD (ENGLISH)
  const ResultBoard = () => (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl mt-6 relative overflow-hidden">
      {/* Dekorasi Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-tsa-gold/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

      <div className="flex justify-between items-center mb-6 relative z-10">
        <h2 className="text-xl font-bold text-tsa-dark flex items-center gap-2">
            <div className="p-2 bg-tsa-gold/10 rounded-lg text-tsa-gold"><Trophy size={20}/></div>
            Hall of Fame (Quarter 1)
        </h2>
        
        <Link 
            to="/results" 
            className="text-sm font-bold text-tsa-green hover:text-emerald-800 hover:underline flex items-center gap-1"
        >
            View Details <ArrowRight size={16} />
        </Link>
      </div>
      
      {PERMISSIONS.CAN_VIEW_REALTIME_RESULTS.includes(user.role) ? (
        <div className="p-6 bg-green-50 border border-green-100 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
          <div>
             <strong className="text-tsa-green flex items-center gap-2"><Lock size={16}/> Status: Real-time Access</strong>
             <p className="text-xs text-green-800 mt-1 opacity-80">You have privileged access to view temporary recapitulation.</p>
          </div>
          <Link to="/results" className="bg-tsa-green text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-emerald-900 shadow-lg shadow-green-900/10 transition-all">
             Open Recap
          </Link>
        </div>
      ) : (
        <div className="p-10 text-center bg-gray-50 rounded-2xl border border-gray-200 border-dashed relative z-10">
          <p className="text-gray-500 font-medium">✨ Results have not been published yet.</p>
          <p className="text-xs text-gray-400 mt-1">Please wait for the Awarding Night!</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* HEADER DASHBOARD */}
        <div className="mt-4">
          <h1 className="text-3xl font-bold text-tsa-dark">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, <span className="font-bold text-tsa-green capitalize">{user.username}</span></p>
        </div>

        {/* --- AREA KONTEN BERDASARKAN ROLE --- */}

        {user.role === ROLES.ADMIN && <AdminPanel />}

        {PERMISSIONS.CAN_JUDGE_ATTITUDE.includes(user.role) && (
          <Link to="/input-assessment">
            <div className="bg-gradient-to-r from-tsa-green to-emerald-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all border border-emerald-800">
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    Start Assessment <ArrowRight className="group-hover:translate-x-2 transition-transform"/>
                </h2>
                <p className="text-emerald-100 text-sm max-w-lg">Input Attitude & Teamwork scores for your members in this active period.</p>
              </div>
              <div className="absolute right-0 top-0 h-40 w-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-white/20 transition-all"></div>
            </div>
          </Link>
        )}

        {user.role === ROLES.MEMBER && (
          <Link to="/voting">
            <div className="bg-gradient-to-r from-tsa-gold to-amber-500 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden cursor-pointer hover:shadow-2xl transition-all group border border-amber-400">
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <Star className="fill-white text-white"/> Voting The Spark
                </h2>
                <p className="text-white/90 text-sm max-w-lg">Cast your vote for the most fun member and favorite executive board!</p>
              </div>
              <div className="absolute right-0 bottom-0 h-32 w-32 bg-white/20 rounded-full blur-2xl -mr-6 -mb-6 group-hover:scale-150 transition-transform duration-500"></div>
            </div>
          </Link>
        )}

        <ResultBoard />

      </main>
    </div>
  );
};

export default Dashboard;