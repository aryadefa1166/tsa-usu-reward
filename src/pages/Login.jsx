import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { KeyRound, User, Loader2 } from 'lucide-react';
import tsaLogo from '../assets/tsa-logo.png'; 

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError('Akses ditolak. Periksa Username/Password.');
    }
    setLoading(false);
  };

  return (
    // 1. BACKGROUND: Hijau Khas TSA (Menggunakan Hex Code spesifik logo: #064e3b)
    // Dibuat gradasi halus ke bawah supaya tidak terlalu 'flat' tapi tetap hijau dominan
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#064e3b] to-[#022c22] p-6">
      
      <div className="bg-white w-full max-w-[400px] rounded-2xl shadow-2xl border border-emerald-900/10 overflow-hidden relative">
        
        {/* 2. TOP BAR: Warna Kunyit (Turmeric) - Hex #d97706 (Amber gelap) */}
        <div className="h-2 w-full bg-[#d97706]"></div>

        <div className="p-8 pt-10">
          {/* HEADER */}
          <div className="flex flex-col items-center mb-8">
            <img 
              src={tsaLogo} 
              alt="Logo TSA USU" 
              className="h-24 w-auto object-contain mb-4 drop-shadow-sm"
            />
            <h1 className="text-xl font-bold text-[#064e3b] tracking-tight text-center">TSA USU R.E.W.A.R.D</h1>
            
            {/* 3. TEKS REVISI: Sesuai Workplan */}
            <p className="text-slate-500 text-[11px] font-semibold mt-1 uppercase tracking-widest text-center">
              Review, Evaluation, and Award
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-100 text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Input Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#064e3b] ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  {/* Ikon: Warna Kunyit saat fokus */}
                  <User size={18} className="text-slate-400 group-focus-within:text-[#d97706] transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Masukkan NIM"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  // Border fokus warna Hijau TSA
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b] transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#064e3b] ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  {/* Ikon: Warna Kunyit saat fokus */}
                  <KeyRound size={18} className="text-slate-400 group-focus-within:text-[#d97706] transition-colors" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b] transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Button Submit */}
            <button
              type="submit"
              disabled={loading}
              // TOMBOL: Hijau TSA (#064e3b)
              className="w-full mt-2 bg-[#064e3b] text-white py-2.5 rounded-lg font-bold text-sm hover:bg-[#043327] transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk Sistem'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
              <p className="text-[10px] text-slate-400 font-medium">
                  &copy; 2026 Tanoto Scholars Association USU
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;