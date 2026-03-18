import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { ShieldCheck, Lock, Save, Loader2, ShieldAlert } from 'lucide-react';

const UpdatePassword = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validasi terhadap password default yang baru
    if (newPassword === 'tsausu2026') {
      return setErrorMsg('New password cannot be the same as the default password!');
    }
    if (newPassword.length < 6) {
      return setErrorMsg('Password must be at least 6 characters long for security purposes.');
    }
    if (newPassword !== confirmPassword) {
      return setErrorMsg('Password confirmation does not match!');
    }

    setLoading(true);
    try {
      // 1. Update password di database Supabase
      const { error } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', user.id);

      if (error) throw error;

      alert('Security Update Successful! Your password has been changed.');
      
      // 2. Update session di LocalStorage
      const currentSession = JSON.parse(localStorage.getItem('tsa_session'));
      if (currentSession) {
        currentSession.needsPasswordUpdate = false;
        localStorage.setItem('tsa_session', JSON.stringify(currentSession));
      }
      
      // 3. Paksa reload di dashboard
      window.location.href = '/dashboard'; 

    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ornaments (Aksen Hijau Samar di Belakang) */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-green-50/80 to-transparent z-0 pointer-events-none"></div>
      
      <div className="max-w-md w-full animate-fade-in-up relative z-10">
        
        {/* Header Security (Menggunakan Tema Hijau TSA) */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-green-50 shadow-[0_0_30px_rgba(22,163,74,0.15)] relative overflow-hidden">
            <div className="absolute inset-0 bg-tsa-green opacity-10 animate-pulse"></div>
            <ShieldCheck size={36} className="text-tsa-green relative z-10" />
          </div>
          <h1 className="text-3xl font-black text-tsa-dark tracking-tight">Account Security</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium leading-relaxed px-4">
            Your account (<strong className="text-tsa-green font-black">{user?.username}</strong>) is currently using the default password. You are <strong className="text-tsa-dark font-black">required</strong> to update it immediately to proceed.
          </p>
        </div>

        {/* Form Update (Dengan Frame TSA USU) */}
        <div className="relative bg-white rounded-[2rem] shadow-xl p-8 sm:p-10 w-full">
          
          {/* TSA USU Frame Overlay */}
          <div className="absolute inset-0 border-[3px] border-tsa-green rounded-[2rem] pointer-events-none z-0 opacity-80"></div>
          <div className="absolute inset-[6px] border-2 border-tsa-gold rounded-[1.6rem] pointer-events-none z-0 opacity-60"></div>

          <div className="relative z-10">
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-2xl text-center flex items-center justify-center gap-2 shadow-sm">
                <ShieldAlert size={16} className="shrink-0" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-tsa-green uppercase tracking-widest pl-1">New Password</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-tsa-green transition-colors" />
                  <input 
                    type="password" 
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-tsa-dark focus:outline-none focus:border-tsa-green focus:ring-1 focus:ring-tsa-green focus:bg-white shadow-inner transition-all"
                    placeholder="Minimum 6 characters..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-tsa-green uppercase tracking-widest pl-1">Confirm Password</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-tsa-green transition-colors" />
                  <input 
                    type="password" 
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-tsa-dark focus:outline-none focus:border-tsa-green focus:ring-1 focus:ring-tsa-green focus:bg-white shadow-inner transition-all"
                    placeholder="Re-type your new password..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-8 bg-tsa-green text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-emerald-800 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {loading ? 'Securing Account...' : 'Update & Continue'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UpdatePassword;