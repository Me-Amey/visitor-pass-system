import React, { useState, useEffect } from 'react';
import API from '../api';
import '../styles/OTPVerification.css';

function OTPVerification({ 
  email, 
  purpose, 
  referenceId, 
  organizationId,
  onVerified, 
  onCancel 
}) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    document.getElementById(`otp-${lastIndex}`).focus();
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await API.post('/otp/verify', {
        email,
        otp: otpCode,
        purpose,
        referenceId
      });

      onVerified();
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0').focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setLoading(true);
    setError('');

    try {
      await API.post('/otp/resend', {
        email,
        purpose,
        referenceId,
        organizationId
      });

      setResendTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0').focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-modal">
      <div className="otp-modal-content">
        <button className="otp-close" onClick={onCancel}>✕</button>
        
        <div className="otp-header">
          <div className="otp-icon">🔐</div>
          <h2>Enter Verification Code</h2>
          <p>We've sent a 6-digit code to</p>
          <p className="otp-email">{email}</p>
        </div>

        <div className="otp-inputs" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="otp-input"
              disabled={loading}
            />
          ))}
        </div>

        {error && <div className="otp-error">{error}</div>}

        <button 
          className="otp-verify-btn" 
          onClick={handleVerify}
          disabled={loading || otp.join('').length !== 6}
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>

        <div className="otp-resend">
          {canResend ? (
            <button onClick={handleResend} disabled={loading}>
              Resend Code
            </button>
          ) : (
            <span>Resend code in {resendTimer}s</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default OTPVerification;
