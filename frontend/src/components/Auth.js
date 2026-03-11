import React, { useState } from 'react';
import API from '../api';
import '../styles/Auth.css';

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'visitor',
    phone: '',
    department: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;
      
      const { data } = await API.post(endpoint, payload);
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.message || `${isLogin ? 'Login' : 'Registration'} failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'visitor',
      phone: '',
      department: ''
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <h1 className="brand-title">Visitor Pass</h1>
          <p className="brand-subtitle">Management System</p>
          
          <div className="brand-features">
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Digital Pass Generation</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Real-time Check-in/out</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-form-container">
          <div className="auth-card">
            <div className="auth-header">
              <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
              <p>{isLogin ? 'Sign in to continue' : 'Register to get started'}</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Role</label>
                    <select name="role" value={formData.role} onChange={handleChange}>
                      <option value="visitor">Visitor</option>
                      <option value="employee">Employee</option>
                      <option value="security">Security</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                    />
                  </div>

                  {(formData.role === 'employee' || formData.role === 'admin') && (
                    <div className="form-group">
                      <label>Department</label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="Enter department"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  isLogin ? 'Sign In' : 'Sign Up'
                )}
              </button>
            </form>

            <div className="auth-toggle">
              <p>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button onClick={toggleMode} className="toggle-btn">
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
