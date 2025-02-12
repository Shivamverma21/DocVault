import AuthForm from "../components/Auth";
import { Link } from "react-router-dom";

const Login = () => {
  return (
    <div className="auth-page">
      <AuthForm type="login" />
      <p className="switch-auth">
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
};

export default Login;
