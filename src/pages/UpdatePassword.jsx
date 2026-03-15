import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { ShieldAlert, Lock, Save, Loader2 } from 'lucide-react';
import tsaLogo from '../assets/tsa-logo.png'; // Pastikan path logo sesuai

const UpdatePassword = () => {
  const { user, login } = useAuth(); // Asumsi ada fungsi untuk me-refresh state user
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword === '123') {
      return setErrorMsg('Password baru tidak boleh sama dengan password default (123)!');
    }
    if (newPassword.length < 6) {
      return setErrorMsg('Password minimal harus 6 karakter demi keamanan.');
    }
    if (newPassword !== confirmPassword) {
      return setErrorMsg('Konfirmasi password tidak cocok!');
    }

    setLoading(true);
    try {
      // Update password di database public.users
      const { error } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', user.id);

      if (error) throw error;

      alert('Security Update Successful! Password berhasil diubah.');
      
      // Paksa reload agar state AuthContext ter-refresh dengan data password baru
      window.location.href = '/dashboard'; 
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full animate-fade-in-up">
        
        {/* Header Security */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500 opacity-20 animate-pulse"></div>
            <ShieldAlert size={32} className="text-red-500 relative z-10" />
          </div>
          <h1 className="text-2xl font-black text-tsa-dark tracking-tight">Security Alert</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            Akun Anda (<strong className="text-tsa-dark">{user?.username}</strong>) masih menggunakan password default. Anda <strong>wajib</strong> menggantinya sekarang untuk melanjutkan.
          </p>
        </div>

        {/* Form Update */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-tsa-green uppercase tracking-wider">New Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-3.5 text-gray-400" />
                <input 
                  type="password" 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-tsa-green focus:ring-1 focus:ring-tsa-green transition-all font-mono"
                  placeholder="Minimal 6 karakter..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-tsa-green uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-3.5 text-gray-400" />
                <input 
                  type="password" 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-tsa-green focus:ring-1 focus:ring-tsa-green transition-all font-mono"
                  placeholder="Ketik ulang password baru..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 bg-tsa-dark text-white py-3.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {loading ? 'Securing Account...' : 'Update & Continue'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default UpdatePassword;