import { Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

// Wraps any page that requires authentication.
// If no token exists in localStorage, redirects to /login.
// Dev bypass: skip auth while running `npm run dev` so mock UI can be tested.
const ProtectedRoute = ({ children }: Props) => {
  if (import.meta.env.DEV) return <>{children}</>;

  const token = localStorage.getItem('jali_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
