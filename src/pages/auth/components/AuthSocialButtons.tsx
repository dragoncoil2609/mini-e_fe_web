import { FaApple, FaFacebookF, FaGoogle } from 'react-icons/fa';

export default function AuthSocialButtons() {
  return (
    <div className="auth-socials">
      <button type="button" className="auth-social-btn">
        <FaGoogle />
        <span>Google</span>
      </button>

      <button type="button" className="auth-social-btn">
        <FaFacebookF />
        <span>Facebook</span>
      </button>

      <button type="button" className="auth-social-btn">
        <FaApple />
        <span>Apple</span>
      </button>
    </div>
  );
}