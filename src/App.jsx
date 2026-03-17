import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Semua Halaman (Sudah disesuaikan dengan nama file baru)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Assessment from './pages/Assessment';
import Attendance from './pages/Attendance';
import OurTeam from './pages/OurTeam';
import Report from './pages/Report';
import EndOfTerm from './pages/EndOfTerm';
import UpdatePassword from './pages/UpdatePassword';

// ==========================================
// KOMPONEN PROTEKSI RUTE (INLINE)
// ==========================================
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-tsa-green">
        Loading Workspace...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // PROTEKSI FASE 8: Force Password Change
  // Menggunakan flag needsPasswordUpdate (Akan diatur di AuthContext)
  const isDefaultPassword = user.needsPasswordUpdate || user.password === 'tsausu2026';

  if (isDefaultPassword && location.pathname !== '/update-password') {
    return <Navigate to="/update-password" replace />;
  }

  // Jika password sudah aman, cegah user mengakses halaman update-password lagi
  if (!isDefaultPassword && location.pathname === '/update-password') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ==========================================
// ARSITEKTUR ROUTING UTAMA
// ==========================================
const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Routes (URL Path dirapikan) */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/update-password" element={<PrivateRoute><UpdatePassword /></PrivateRoute>} />
        <Route path="/admin-panel" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
        <Route path="/assessment" element={<PrivateRoute><Assessment /></PrivateRoute>} />
        <Route path="/attendance" element={<PrivateRoute><Attendance /></PrivateRoute>} />
        <Route path="/our-team" element={<PrivateRoute><OurTeam /></PrivateRoute>} />
        <Route path="/report" element={<PrivateRoute><Report /></PrivateRoute>} />
        <Route path="/end-of-term" element={<PrivateRoute><EndOfTerm /></PrivateRoute>} />
        
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;