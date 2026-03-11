import React, { useState, useEffect } from 'react';
import API from '../api';
import { QRCodeSVG } from 'qrcode.react';
import OTPVerification from './OTPVerification';
import '../styles/Passes.css';

function Passes({ user }) {
  const [passes, setPasses] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);
  const [showOTP, setShowOTP] = useState(false);
  const [pendingPass, setPendingPass] = useState(null);
  const [formData, setFormData] = useState({
    visitor: '', 
    host: user._id, 
    validFrom: '', 
    validUntil: '',
    purpose: '',
    accessAreas: ''
  });

  useEffect(() => {
    fetchPasses();
    fetchVisitors();
    fetchHosts();
  }, []);

  const fetchPasses = async () => {
    try {
      const { data } = await API.get('/passes');
      setPasses(data);
    } catch (error) {
      console.error('Error fetching passes:', error);
    }
  };

  const fetchVisitors = async () => {
    try {
      const { data } = await API.get('/visitors');
      console.log('Fetched visitors:', data);
      setVisitors(data);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      alert('Error loading visitors. Please refresh the page.');
    }
  };

  const fetchHosts = async () => {
    try {
      // Fetch users who can be hosts (employees, org_admin, security)
      const { data } = await API.get('/auth/me');
      // For now, just use current user as default host
      // In a full implementation, you'd have an endpoint to fetch all employees
      setHosts([{
        _id: user._id,
        name: user.name,
        email: user.email
      }]);
    } catch (error) {
      console.error('Error fetching hosts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        accessAreas: formData.accessAreas.split(',').map(a => a.trim()).filter(a => a)
      };
      const { data } = await API.post('/passes', submitData);
      
      setShowForm(false);
      setFormData({ 
        visitor: '', 
        host: user._id, 
        validFrom: '', 
        validUntil: '', 
        purpose: '', 
        accessAreas: '' 
      });
      
      // If OTP is required, show OTP modal
      if (data.requireOTP) {
        setPendingPass(data.pass);
        setShowOTP(true);
      } else {
        alert('Pass created and activated successfully!');
        fetchPasses();
      }
    } catch (error) {
      console.error('Pass creation error:', error);
      alert('Error creating pass: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleOTPVerified = () => {
    setShowOTP(false);
    setPendingPass(null);
    alert('Pass activated successfully!');
    fetchPasses();
  };

  const downloadPDF = async (passId) => {
    try {
      const response = await API.get(`/passes/${passId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pass-${passId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error downloading PDF');
    }
  };

  const viewQRCode = (pass) => {
    setSelectedPass(pass);
  };

  const requestOTPForPass = async (pass) => {
    try {
      await API.post('/otp/request/pass-activation', {
        passId: pass._id,
        email: pass.visitor.email
      });
      setPendingPass(pass);
      setShowOTP(true);
    } catch (error) {
      alert('Error requesting OTP: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="passes-container">
      <div className="passes-header">
        <h1>Visitor Passes</h1>
        {(user.role === 'org_admin' || user.role === 'security') && (
          <button className="btn-add" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Issue Pass'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="pass-form-card">
          <h3>Issue New Pass</h3>
          <form onSubmit={handleSubmit} className="pass-form">
            <div className="form-field">
              <label>Select Visitor *</label>
              <select 
                value={formData.visitor} 
                onChange={(e) => setFormData({...formData, visitor: e.target.value})} 
                required
                style={{ cursor: 'pointer' }}
              >
                <option value="">Choose a visitor</option>
                {visitors.length === 0 ? (
                  <option value="" disabled>No visitors available - Please register a visitor first</option>
                ) : (
                  visitors.map(v => (
                    <option key={v._id} value={v._id}>
                      {v.name} - {v.email}
                    </option>
                  ))
                )}
              </select>
              {visitors.length === 0 && (
                <small style={{ color: '#e53e3e', marginTop: '5px', display: 'block' }}>
                  No visitors found. Please register a visitor first from the Visitors page.
                </small>
              )}
            </div>
            <div className="form-field">
              <label>Host *</label>
              <select 
                value={formData.host} 
                onChange={(e) => setFormData({...formData, host: e.target.value})} 
                required
                style={{ cursor: 'pointer' }}
              >
                <option value="">Choose a host</option>
                <option value={user._id}>{user.name} (You)</option>
                {hosts.filter(h => h._id !== user._id).map(h => (
                  <option key={h._id} value={h._id}>{h.name}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Purpose</label>
              <input 
                placeholder="e.g., Meeting, Interview, Delivery" 
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})} 
              />
            </div>
            <div className="form-field">
              <label>Access Areas (comma-separated)</label>
              <input 
                placeholder="e.g., Lobby, Conference Room A, Cafeteria" 
                value={formData.accessAreas}
                onChange={(e) => setFormData({...formData, accessAreas: e.target.value})} 
              />
            </div>
            <div className="form-field">
              <label>Valid From</label>
              <input 
                type="datetime-local" 
                value={formData.validFrom}
                onChange={(e) => setFormData({...formData, validFrom: e.target.value})} 
                required 
              />
            </div>
            <div className="form-field">
              <label>Valid Until</label>
              <input 
                type="datetime-local" 
                value={formData.validUntil}
                onChange={(e) => setFormData({...formData, validUntil: e.target.value})} 
                required 
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-submit">Issue Pass</button>
            </div>
          </form>
        </div>
      )}

      {passes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎫</div>
          <p>No passes issued yet</p>
        </div>
      ) : (
        <div className="passes-grid">
          {passes.map(pass => (
            <div key={pass._id} className="pass-card">
              <div className="pass-card-header">
                <span className="pass-number">{pass.passNumber}</span>
                <span className={`pass-status ${pass.status}`}>{pass.status}</span>
              </div>
              
              {pass.status === 'pending' && (
                <div className="pass-pending-notice">
                  <span>⏳ Awaiting OTP verification</span>
                  <button 
                    className="btn-resend-otp" 
                    onClick={() => requestOTPForPass(pass)}
                  >
                    Resend OTP
                  </button>
                </div>
              )}
              
              <div className="pass-details">
                <div className="pass-detail-row">
                  <span className="pass-detail-label">Visitor</span>
                  <span className="pass-detail-value">{pass.visitor?.name}</span>
                </div>
                <div className="pass-detail-row">
                  <span className="pass-detail-label">Host</span>
                  <span className="pass-detail-value">{pass.host?.name}</span>
                </div>
                {pass.purpose && (
                  <div className="pass-detail-row">
                    <span className="pass-detail-label">Purpose</span>
                    <span className="pass-detail-value">{pass.purpose}</span>
                  </div>
                )}
                <div className="pass-detail-row">
                  <span className="pass-detail-label">Valid From</span>
                  <span className="pass-detail-value">{new Date(pass.validFrom).toLocaleString()}</span>
                </div>
                <div className="pass-detail-row">
                  <span className="pass-detail-label">Valid Until</span>
                  <span className="pass-detail-value">{new Date(pass.validUntil).toLocaleString()}</span>
                </div>
              </div>

              <div className="pass-actions">
                <button 
                  className="btn-qr" 
                  onClick={() => viewQRCode(pass)}
                  disabled={pass.status === 'pending'}
                >
                  📱 View QR
                </button>
                <button 
                  className="btn-download" 
                  onClick={() => downloadPDF(pass._id)}
                  disabled={pass.status === 'pending'}
                >
                  📥 PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPass && (
        <div className="qr-modal" onClick={() => setSelectedPass(null)}>
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="qr-modal-close" onClick={() => setSelectedPass(null)}>✕</button>
            <h3>QR Code - {selectedPass.passNumber}</h3>
            <div className="qr-code-display">
              {selectedPass.qrCode ? (
                <img src={selectedPass.qrCode} alt="QR Code" />
              ) : (
                <QRCodeSVG 
                  value={JSON.stringify({
                    passNumber: selectedPass.passNumber,
                    visitor: selectedPass.visitor._id,
                    validFrom: selectedPass.validFrom,
                    validUntil: selectedPass.validUntil
                  })}
                  size={256}
                  level="H"
                />
              )}
            </div>
            <p className="qr-instructions">Scan this QR code at check-in/check-out</p>
          </div>
        </div>
      )}

      {showOTP && pendingPass && (
        <OTPVerification
          email={pendingPass.visitor.email}
          purpose="pass_activation"
          referenceId={pendingPass._id}
          organizationId={pendingPass.organization._id || pendingPass.organization}
          onVerified={handleOTPVerified}
          onCancel={() => {
            setShowOTP(false);
            setPendingPass(null);
            fetchPasses();
          }}
        />
      )}
    </div>
  );
}

export default Passes;
