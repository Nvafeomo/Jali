import { Link } from 'react-router-dom';

const LoginPage = () => {
  return (
    <div>
      <h1>Login</h1>
      {/* Login form goes here */}
      {import.meta.env.DEV && (
        <p>
          Dev: mock tree is available at <Link to="/tree">/tree</Link> without logging in.
        </p>
      )}
    </div>
  );
};

export default LoginPage;
