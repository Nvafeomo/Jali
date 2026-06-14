import { Routes, Route, Navigate } from 'react-router-dom';
import TreePage from './pages/TreePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CheckEmailPage from './pages/CheckEmailPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Email verification + password reset */}
      <Route path="/check-email" element={<CheckEmailPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* App */}
      <Route
        path="/tree"
        element={
          <ProtectedRoute>
            <TreePage />
          </ProtectedRoute>
        }
      />

      {/* Default: redirect root to tree (ProtectedRoute will catch unauthenticated users) */}
      <Route path="*" element={<Navigate to="/tree" replace />} />
    </Routes>
  );
}

export default App;
