import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cek apakah ada sesi tersimpan saat browser di-refresh
  useEffect(() => {
    const session = localStorage.getItem('tsa_session');
    if (session) {
      setUser(JSON.parse(session));
    }
    setLoading(false);
  }, []);

  // Fungsi Login
  const login = async (username, password) => {
    try {
      // 1. Cari user berdasarkan username
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single(); // Ambil satu data saja

      if (error || !data) {
        throw new Error('Username tidak ditemukan!');
      }

      // 2. Cek password (masih plain text sesuai request awal)
      if (data.password !== password) {
        throw new Error('Password salah!');
      }

      // 3. Simpan data user ke State & LocalStorage biar gak log out pas refresh
      const userData = {
        id: data.id,
        username: data.username,
        name: data.username, // Nanti bisa update tabel user tambah kolom 'name' asli
        role: data.role,
        dept: data.dept
      };

      setUser(userData);
      localStorage.setItem('tsa_session', JSON.stringify(userData));
      return { success: true };

    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Fungsi Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('tsa_session');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);