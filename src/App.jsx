import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageUsers from './pages/ManageUsers';
import InputAssessment from './pages/InputAssessment';
import Voting from './pages/Voting';
import Results from './pages/Results';
import { useAuth } from './context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/manage-users" element={<PrivateRoute><ManageUsers /></PrivateRoute>} />
      <Route path="/input-assessment" element={<PrivateRoute><InputAssessment /></PrivateRoute>} />
      <Route path="/voting" element={<PrivateRoute><Voting /></PrivateRoute>} />
      <Route path="/results" element={<PrivateRoute><Results /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;