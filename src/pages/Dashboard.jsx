import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { ROLES, PERMISSIONS } from '../utils/constants';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();

  // 1. Tampilan Khusus ADMIN
  const AdminPanel = () => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h2 className="text-lg font-bold text-slate-800 mb-4">⚙️ Admin Control Center</h2>
      <p className="text-sm text-slate-600 mb-4">Menu untuk membuka periode penilaian & manajemen user.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* TOMBOL 1: Link ke Manage Users */}
        <Link 
          to="/manage-users" 
          className="block p-4 bg-slate-50 border border-slate-200 rounded-lg text-left hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
        >
          <h3 className="font-bold text-slate-700 group-hover:text-[#064e3b]">Manajemen User</h3>
          <p className="text-xs text-slate-500 mt-1">Tambah/Hapus Anggota Database</p>
        </Link>

        {/* TOMBOL 2: Masih Dummy */}
        <button className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-left hover:bg-slate-100 opacity-60 cursor-not-allowed">
          <h3 className="font-bold text-slate-700">Setting Periode</h3>
          <p className="text-xs text-slate-500 mt-1">Segera Hadir</p>
        </button>
      </div>
    </div>
  );

  // 2. Tampilan Hasil (ResultBoard - UPDATED)
  const ResultBoard = () => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-800">🏆 Hall of Fame (Kuartal 1)</h2>
        
        {/* BUTTON LIHAT HASIL */}
        <Link 
            to="/results" 
            className="text-sm font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
        >
            Lihat Detail <span className="text-lg">&rarr;</span>
        </Link>
      </div>
      
      {/* Logic Tampilan Preview Singkat */}
      {PERMISSIONS.CAN_VIEW_REALTIME_RESULTS.includes(user.role) ? (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-sm border border-emerald-100 flex justify-between items-center">
          <div>
             <strong>Status: Real-time Access</strong>
             <p className="text-xs mt-1">Anda memiliki akses admin untuk melihat rekapitulasi nilai sementara.</p>
          </div>
          <Link to="/results" className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-800">
             Buka Rekap
          </Link>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-100 border-dashed">
          <p className="text-slate-500 font-medium">✨ Hasil Kuartal ini belum dipublikasikan.</p>
          <p className="text-xs text-slate-400 mt-1">Admin akan membuka akses setelah Awarding Night.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {/* HEADER DASHBOARD */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Beranda</h1>
          <p className="text-slate-500 text-sm">Selamat datang di panel <span className="font-semibold text-emerald-700 capitalize">{user.role}</span></p>
        </div>

        {/* --- AREA KONTEN BERDASARKAN ROLE --- */}

        {/* 1. Jika ADMIN -> Tampilkan Panel Admin */}
        {user.role === ROLES.ADMIN && <AdminPanel />}

        {/* 2. Jika LEADER/EB -> Tampilkan Tombol Penilaian (Input Nilai) */}
        {PERMISSIONS.CAN_JUDGE_ATTITUDE.includes(user.role) && (
          <Link to="/input-assessment">
            <div className="bg-emerald-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden group cursor-pointer hover:shadow-emerald-900/20 hover:scale-[1.01] transition-all">
              <div className="relative z-10">
                <h2 className="text-xl font-bold mb-1">Mulai Penilaian Anggota</h2>
                <p className="text-emerald-100 text-sm">Input nilai Attitude & Kinerja Tim untuk periode aktif.</p>
              </div>
              {/* Dekorasi Background */}
              <div className="absolute right-0 top-0 h-32 w-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            </div>
          </Link>
        )}

        {/* 3. Jika MEMBER -> Tampilkan Tombol Voting */}
        {user.role === ROLES.MEMBER && (
          <Link to="/voting">
            <div className="bg-amber-500 text-white p-6 rounded-xl shadow-lg relative overflow-hidden cursor-pointer hover:bg-amber-600 transition-all group">
              <div className="relative z-10">
                <h2 className="text-xl font-bold mb-1">Voting The Spark ✨</h2>
                <p className="text-white/90 text-sm">Pilih teman terasik dan EB terfavorit kamu!</p>
              </div>
              {/* Hiasan */}
              <div className="absolute right-0 bottom-0 h-24 w-24 bg-white/20 rounded-full blur-xl -mr-6 -mb-6 group-hover:scale-150 transition-transform duration-500"></div>
            </div>
          </Link>
        )}

        {/* 4. TAMPILKAN HASIL (Semua Role Punya Ini) */}
        <ResultBoard />

      </main>
    </div>
  );
};

export default Dashboard;