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
      // BAHASA INGGRIS: Pesan error
      setError('Access denied. Please check your Username/Password.');
    }
    setLoading(false);
  };

  return (
    // Container utama flex untuk menengahkan kartu
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-tsa-green to-[#004d36]">
      
      {/* CARD LOGIN */}
      {/* REVISI 2: Aksen emas dipertebal dari border-t-4 menjadi 'border-t-8' */}
      <div className="bg-white w-full max-w-[400px] rounded-3xl shadow-tsa border-t-8 border-tsa-gold overflow-hidden relative z-10">
        
        {/* Hiasan Latar Belakang di dalam Card */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-tsa-green/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-tsa-gold/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Konten Card - Pastikan teks di dalam kartu berwarna gelap (tsa-dark) */}
        <div className="p-8 pt-12 relative z-20 text-tsa-dark">
          {/* HEADER */}
          <div className="flex flex-col items-center mb-8">
            <img 
              src={tsaLogo} 
              alt="Logo TSA USU" 
              // REVISI 3: Hapus class 'drop-shadow' agar logo menyatu dengan background putih
              className="h-24 w-auto object-contain mb-4"
            />
            <h1 className="text-2xl font-bold text-tsa-green tracking-tight text-center">TSA USU R.E.W.A.R.D</h1>
            
            {/* Subtitle sudah dalam Bahasa Inggris */}
            <p className="text-tsa-dark/60 text-[11px] font-semibold mt-2 uppercase tracking-widest text-center">
              Review, Evaluation, and Award
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 text-xs font-medium rounded-xl border border-red-100 text-center flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Input Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-tsa-green ml-1">Username</label> {/* Bahasa Inggris */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User size={20} className="text-black/30 group-focus-within:text-tsa-gold transition-colors" />
                </div>
                <input
                  type="text"
                  // REVISI 4: Ubah placeholder jadi "Enter Username"
                  placeholder="Enter Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-100 rounded-xl text-sm text-tsa-dark placeholder:text-black/30 focus:outline-none focus:border-tsa-green focus:ring-0 transition-all"
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-tsa-green ml-1">Password</label> {/* Bahasa Inggris */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <KeyRound size={20} className="text-black/30 group-focus-within:text-tsa-gold transition-colors" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-100 rounded-xl text-sm text-tsa-dark placeholder:text-black/30 focus:outline-none focus:border-tsa-green focus:ring-0 transition-all"
                  required
                />
              </div>
            </div>

            {/* Button Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-tsa-green to-[#004d36] text-white py-3.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-tsa-green/30 hover:scale-[1.01] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {/* BAHASA INGGRIS: Status loading */}
                  Logging in...
                </>
              ) : (
                // REVISI 5: Ubah teks tombol jadi "Login"
                'Login'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 text-center">
              {/* REVISI 6: Hapus class 'font-serif italic' agar font kembali normal (Poppins) */}
              <p className="text-[10px] text-tsa-dark/50 font-medium">
                  &copy; 2026 Tanoto Scholars Association USU
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;