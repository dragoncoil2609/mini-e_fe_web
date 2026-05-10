import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import '../style/auth.css';

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  hero?: ReactNode;
}

export function AuthCard({ title, description, children, hero }: AuthCardProps) {
  return (
    <div className="auth-shell">
      <div className="auth-brand-top">
        <Link to="/home" className="auth-brand-link">
          <div className="auth-brand-icon">🛍️</div>

          <div className="auth-brand-text">
            <div className="auth-brand-name">Mini E</div>
            <div className="auth-brand-slogan">Mua sắm thông minh</div>
          </div>
        </Link>
      </div>

      <div className="auth-card">
        {hero ? <div className="auth-hero-center">{hero}</div> : null}

        <h1 className="auth-title">{title}</h1>
        {description ? <p className="auth-description">{description}</p> : null}

        {children}
      </div>
    </div>
  );
}