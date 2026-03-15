import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-tsa-green">Loading Workspace...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // PROTEKSI FASE 8: Force Password Change
  if (user.password === '123' && location.pathname !== '/update-password') {
    return <Navigate to="/update-password" replace />;
  }

  if (user.password !== '123' && location.pathname === '/update-password') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ==========================================
// ARSITEKTUR ROUTING UTAMA (TANPA DOUBLE ROUTER)
// ==========================================
const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/update-password" element={<PrivateRoute><UpdatePassword /></PrivateRoute>} />
        <Route path="/manage-users" element={<PrivateRoute><ManageUsers /></PrivateRoute>} />
        <Route path="/input-assessment" element={<PrivateRoute><InputAssessment /></PrivateRoute>} />
        <Route path="/input-attendance" element={<PrivateRoute><InputAttendance /></PrivateRoute>} />
        <Route path="/our-team" element={<PrivateRoute><OurTeam /></PrivateRoute>} />
        <Route path="/report" element={<PrivateRoute><Report /></PrivateRoute>} />
        <Route path="/results" element={<PrivateRoute><Results /></PrivateRoute>} />
        <Route path="/voting" element={<PrivateRoute><Voting /></PrivateRoute>} />
        
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;