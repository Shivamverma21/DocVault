import AuthForm from "../components/Auth";
import { Link } from "react-router-dom";

const Signup = () => {
  return (
    <div className="auth-page">
      <AuthForm type="signup" />
      <p className="switch-auth">
        Already have an account? <Link to="/">Login</Link>
      </p>
    </div>
  );
};

export default Signup;
