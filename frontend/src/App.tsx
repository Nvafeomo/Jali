import { Routes, Route, Navigate } from 'react-router-dom';
import TreePage from './pages/TreePage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
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
