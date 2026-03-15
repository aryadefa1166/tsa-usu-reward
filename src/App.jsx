import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Semua Halaman
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageUsers from './pages/ManageUsers';
import InputAssessment from './pages/InputAssessment';
import InputAttendance from './pages/InputAttendance';
import OurTeam from './pages/OurTeam';
import Report from './pages/Report';
import Results from './pages/Results';
import Voting from './pages/Voting';
import UpdatePassword from './pages/UpdatePassword';

// ==========================================
// KOMPONEN PROTEKSI RUTE (INLINE)
// ==========================================
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Tunggu pengecekan sesi selesai agar tidak berkedip ke halaman login
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // 1. Jika belum login, tendang ke Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. PROTEKSI FASE 8: Jika password masih default '123'
  // Dan user mencoba mengakses halaman SELAIN update-password, kunci dan arahkan paksa!
  if (user.password === '123' && location.pathname !== '/update-password') {
    return <Navigate to="/update-password" replace />;
  }

  // 3. Jika password sudah diganti (Aman), tapi iseng mau buka halaman update-password
  // Tendang balik ke Dashboard
  if (user.password !== '123' && location.pathname === '/update-password') {
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Lolos semua proteksi, izinkan akses ke komponen halaman
  return children;
};

// ==========================================
// ARSITEKTUR ROUTING UTAMA
// ==========================================
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected Routes (Dibungkus PrivateRoute) */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/update-password" element={<PrivateRoute><UpdatePassword /></PrivateRoute>} />
          <Route path="/manage-users" element={<PrivateRoute><ManageUsers /></PrivateRoute>} />
          <Route path="/input-assessment" element={<PrivateRoute><InputAssessment /></PrivateRoute>} />
          <Route path="/input-attendance" element={<PrivateRoute><InputAttendance /></PrivateRoute>} />
          <Route path="/our-team" element={<PrivateRoute><OurTeam /></PrivateRoute>} />
          <Route path="/report" element={<PrivateRoute><Report /></PrivateRoute>} />
          <Route path="/results" element={<PrivateRoute><Results /></PrivateRoute>} />
          <Route path="/voting" element={<PrivateRoute><Voting /></PrivateRoute>} />
          
          {/* Fallback Route (Jika mengetik URL ngawur) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;