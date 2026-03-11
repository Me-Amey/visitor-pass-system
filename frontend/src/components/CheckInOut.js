import React, { useState, useEffect } from 'react';
import API from '../api';
import '../styles/CheckInOut.css';

function CheckInOut({ user }) {
  const [passNumber, setPassNumber] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [type, setType] = useState('check-in');
  const [location, setLocation] = useState('Main Entrance');
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [recentLogs, setRecentLogs] = useState([]);
  const [scanMode, setScanMode] = useState('manual'); // 'manual' or 'qr'
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchRecentLogs();
  }, []);

  const fetchRecentLogs = async () => {
    try {
      const { data } = await API.get('/checklogs?limit=10');
      setRecentLogs(data.slice(0, 10));
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleVerify = async () => {
    try {
      const { data } = await API.post('/passes/verify', { passNumber });
      setVerificationResult(data);
    } catch (error) {
      alert('Error verifying pass');
      setVerificationResult({ valid: false, message: 'Verification failed' });
    }
  };

  const handleQRScan = async (qrData) => {
    try {
      const { data } = await API.post('/passes/scan-qr', { qrData });
      setVerificationResult(data);
      setPassNumber(data.pass?.passNumber || '');
      setScanning(false);
    } catch (error) {
      alert('Invalid QR code');
      setVerificationResult({ valid: false, message: 'Invalid QR code' });
      setScanning(false);
    }
  };

  const handleCheckInOut = async () => {
    if (!verificationResult?.valid) {
      alert('Please verify a valid pass first');
      return;
    }

    try {
      await API.post('/checklogs', {
        passId: verificationResult.pass._id,
        type,
        location,
        notes,
        scanMethod: scanMode === 'qr' ? 'qr' : 'manual',
        temperature: temperature ? parseFloat(temperature) : undefined
      });
      alert(`${type} successful`);
      setPassNumber('');
      setVerificationResult(null);
      setTemperature('');
      setNotes('');
      fetchRecentLogs();
    } catch (error) {
      alert(`Error during ${type}: ${error.response?.data?.message || error.message}`);
    }
  };

  const simulateQRScan = () => {
    const testQR = prompt('Paste QR data or pass number:');
    if (testQR) {
      try {
        JSON.parse(testQR);
        handleQRScan(testQR);
      } catch {
        setPassNumber(testQR);
        handleVerify();
      }
    }
  };

  return (
    <div className="checkinout-container">
      <div className="checkinout-header">
        <h1>Check In / Check Out</h1>
        <div className="scan-mode-toggle">
          <button 
            className={scanMode === 'manual' ? 'active' : ''} 
            onClick={() => setScanMode('manual')}
          >
            ⌨️ Manual
          </button>
          <button 
            className={scanMode === 'qr' ? 'active' : ''} 
            onClick={() => setScanMode('qr')}
          >
            📷 QR Scan
          </button>
        </div>
      </div>
      
      <div className="scanner-card">
        <div className="scanner-icon">
          {scanMode === 'qr' ? '📷' : '🔍'}
        </div>
        <h3>{scanMode === 'qr' ? 'Scan QR Code' : 'Enter Pass Number'}</h3>
        
        {scanMode === 'manual' ? (
          <div className="scanner-input-group">
            <input
              className="scanner-input"
              placeholder="Enter pass number..."
              value={passNumber}
              onChange={(e) => setPassNumber(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
            />
            <button className="btn-verify" onClick={handleVerify}>
              Verify Pass
            </button>
          </div>
        ) : (
          <div className="qr-scanner-section">
            <div className="qr-scanner-placeholder">
              <p>📱 QR Scanner would appear here</p>
              <p className="qr-note">In production, use device camera</p>
            </div>
            <button className="btn-simulate-scan" onClick={simulateQRScan}>
              🧪 Simulate QR Scan
            </button>
          </div>
        )}

        {verificationResult && (
          <div className={`verification-result ${verificationResult.valid ? 'valid' : 'invalid'}`}>
            <div className="result-header">
              <span className="result-icon">{verificationResult.valid ? '✓' : '✕'}</span>
              <h4 className={verificationResult.valid ? 'valid' : 'invalid'}>
                {verificationResult.valid ? 'Valid Pass' : 'Invalid Pass'}
              </h4>
            </div>
            
            {verificationResult.valid ? (
              <>
                <div className="pass-info">
                  <div className="pass-info-row">
                    <span className="pass-info-label">Pass Number</span>
                    <span className="pass-info-value">{verificationResult.pass.passNumber}</span>
                  </div>
                  <div className="pass-info-row">
                    <span className="pass-info-label">Visitor</span>
                    <span className="pass-info-value">{verificationResult.pass.visitor.name}</span>
                  </div>
                  <div className="pass-info-row">
                    <span className="pass-info-label">Email</span>
                    <span className="pass-info-value">{verificationResult.pass.visitor.email}</span>
                  </div>
                  <div className="pass-info-row">
                    <span className="pass-info-label">Host</span>
                    <span className="pass-info-value">{verificationResult.pass.host.name}</span>
                  </div>
                  {verificationResult.pass.purpose && (
                    <div className="pass-info-row">
                      <span className="pass-info-label">Purpose</span>
                      <span className="pass-info-value">{verificationResult.pass.purpose}</span>
                    </div>
                  )}
                  <div className="pass-info-row">
                    <span className="pass-info-label">Valid Until</span>
                    <span className="pass-info-value">
                      {new Date(verificationResult.pass.validUntil).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="checkin-form">
                  <div className="form-row">
                    <label>Action</label>
                    <select 
                      className="checkin-select" 
                      value={type} 
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="check-in">Check In</option>
                      <option value="check-out">Check Out</option>
                    </select>
                  </div>
                  
                  <div className="form-row">
                    <label>Location</label>
                    <select 
                      className="checkin-select" 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)}
                    >
                      <option value="Main Entrance">Main Entrance</option>
                      <option value="Side Gate">Side Gate</option>
                      <option value="Parking">Parking</option>
                      <option value="Reception">Reception</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <label>Temperature (°F) - Optional</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="checkin-input" 
                      placeholder="98.6"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <label>Notes - Optional</label>
                    <textarea 
                      className="checkin-textarea" 
                      placeholder="Additional notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows="2"
                    />
                  </div>
                  
                  <button className="btn-confirm" onClick={handleCheckInOut}>
                    ✓ Confirm {type === 'check-in' ? 'Check In' : 'Check Out'}
                  </button>
                </div>
              </>
            ) : (
              <p className="invalid-message">
                {verificationResult.message || 'This pass is invalid or has expired. Please contact security.'}
              </p>
            )}
          </div>
        )}
      </div>

      {recentLogs.length > 0 && (
        <div className="recent-logs">
          <h3>Recent Activity</h3>
          <div className="logs-list">
            {recentLogs.map(log => (
              <div key={log._id} className="log-item">
                <div className="log-type">
                  <span className={`log-badge ${log.type}`}>
                    {log.type === 'check-in' ? '→' : '←'} {log.type}
                  </span>
                  {log.scanMethod === 'qr' && <span className="scan-badge">📱 QR</span>}
                </div>
                <div className="log-details">
                  <strong>{log.visitor?.name}</strong>
                  <span className="log-time">{new Date(log.timestamp).toLocaleString()}</span>
                  <span className="log-location">📍 {log.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckInOut;
