import React, { useState } from 'react';
import './AuthModal.css';
import logo from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';

const AuthModal = () => {
  const { flowState, setFlowState, initiateAuthSubmit } = useAuth();
  const isSignUp = flowState === 'signup';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email or phone number.');
      return;
    }

    if (!password || password.length < 4) {
      setError('Your password must contain between 4 and 60 characters.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    // Trigger browser password save prompt simulation
    initiateAuthSubmit({ email, password }, isSignUp);
  };

  return (
    <div className="netflix-auth-page">
      <div className="auth-background-overlay">
        <div className="auth-radial-vignette"></div>
      </div>

      <header className="auth-header">
        <span className="neplify-brand-logo">NEPLIFY</span>
      </header>

      <main className="auth-card-container">
        <div className="auth-card">
          <h1 className="auth-title">{isSignUp ? 'Sign Up' : 'Sign In'}</h1>

          {error && <div className="auth-error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <input
                type="email"
                id="auth-email"
                className={`auth-input ${email ? 'has-content' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                required
                autoComplete="username"
              />
              <label htmlFor="auth-email" className="auth-floating-label">
                Email or mobile number
              </label>
            </div>

            <div className="form-group">
              <input
                type="password"
                id="auth-password"
                className={`auth-input ${password ? 'has-content' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
              <label htmlFor="auth-password" className="auth-floating-label">
                Password
              </label>
            </div>

            {isSignUp && (
              <div className="form-group">
                <input
                  type="password"
                  id="auth-confirm-password"
                  className={`auth-input ${confirmPassword ? 'has-content' : ''}`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder=" "
                  required
                  autoComplete="new-password"
                />
                <label htmlFor="auth-confirm-password" className="auth-floating-label">
                  Confirm Password
                </label>
              </div>
            )}

            <button type="submit" className="auth-submit-btn">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>

            <div className="auth-options-row">
              <label className="remember-me-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="custom-check"></span>
                <span>Remember me</span>
              </label>
              <a href="#help" className="auth-help-link" onClick={(e) => e.preventDefault()}>
                Need help?
              </a>
            </div>
          </form>

          <div className="auth-footer-switch">
            {isSignUp ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  className="switch-link-btn"
                  onClick={() => {
                    setError('');
                    setFlowState('signin');
                  }}
                >
                  Sign in now.
                </button>
              </p>
            ) : (
              <p>
                New to Neplify?{' '}
                <button
                  type="button"
                  className="switch-link-btn"
                  onClick={() => {
                    setError('');
                    setFlowState('signup');
                  }}
                >
                  Sign up now.
                </button>
              </p>
            )}

            <p className="recaptcha-notice">
              This page is protected by Google reCAPTCHA to ensure you're not a bot.{' '}
              <span className="learn-more">Learn more.</span>
            </p>
          </div>
        </div>
      </main>

      <footer className="auth-simple-footer">
        <div className="footer-content">
          <p className="contact-info">Questions? Call 1-844-505-2993</p>
          <div className="footer-links-grid">
            <a href="#faq" onClick={(e) => e.preventDefault()}>FAQ</a>
            <a href="#help" onClick={(e) => e.preventDefault()}>Help Center</a>
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Use</a>
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy</a>
            <a href="#cookies" onClick={(e) => e.preventDefault()}>Cookie Preferences</a>
            <a href="#corporate" onClick={(e) => e.preventDefault()}>Corporate Information</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthModal;
