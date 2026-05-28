import { Link } from 'react-router-dom';

import bunnyLogo from '../../../assets/brand/bunny_bear_original.png';

type AuthCardVariant = 'compact' | 'wide' | 'hero';

type AuthCardProps = {
  children: React.ReactNode;
  variant?: AuthCardVariant;
  className?: string;
};

export default function AuthCard({
  children,
  variant = 'compact',
  className = '',
}: AuthCardProps) {
  return (
    <main className="auth-page">
      <div className={`auth-shell auth-shell-${variant}`}>
        <Link to="/home" className="auth-logo" aria-label="Quay về trang chủ">
          <div className="auth-logo-face">
            <img src={bunnyLogo} alt="Mochi logo" />
          </div>

          <div>
            <span className="auth-logo-title">Mochi</span>
            <span className="auth-logo-subtitle">Cute things for you ♡</span>
          </div>
        </Link>

        <section className={`auth-card auth-card-${variant} ${className}`}>
          {children}
        </section>
      </div>
    </main>
  );
}