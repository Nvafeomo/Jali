import { Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

// Wraps any page that requires authentication.
// If no token exists in localStorage, redirects to /login.
const ProtectedRoute = ({ children }: Props) => {
  const token = localStorage.getItem('jali_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
