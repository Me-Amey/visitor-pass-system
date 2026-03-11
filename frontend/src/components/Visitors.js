import React, { useState, useEffect } from 'react';
import API from '../api';
import '../styles/Visitors.css';

function Visitors() {
  const [visitors, setVisitors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '', 
    email: '', 
    phone: '', 
    idType: 'license', 
    idNumber: '', 
    company: '',
    address: '',
    photo: null
  });

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      const { data } = await API.get('/visitors', {
        params: { search: searchTerm }
      });
      setVisitors(data);
    } catch (error) {
      console.error('Error fetching visitors:', error);
    }
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchVisitors();
      }
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Photo size should be less than 5MB');
        return;
      }
      setFormData({...formData, photo: file});
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      await API.post('/visitors', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setShowForm(false);
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        idType: 'license', 
        idNumber: '', 
        company: '',
        address: '',
        photo: null
      });
      setPhotoPreview(null);
      fetchVisitors();
      alert('Visitor registered successfully!');
    } catch (error) {
      alert('Error creating visitor: ' + (error.response?.data?.message || error.message));
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'ID Type', 'ID Number', 'Company', 'Registered Date'];
    const csvData = visitors.map(v => [
      v.name,
      v.email,
      v.phone,
      v.idType,
      v.idNumber,
      v.company || '-',
      new Date(v.createdAt).toLocaleDateString()
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `visitors_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="visitors-container">
      <div className="visitors-header">
        <h1>Visitors</h1>
        <div className="header-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search visitors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="btn-export" onClick={exportToCSV}>
            📊 Export CSV
          </button>
          <button className="btn-add" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Add Visitor'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="visitor-form-card">
          <h3>Register New Visitor</h3>
          <form onSubmit={handleSubmit} className="visitor-form">
            <div className="form-row">
              <div className="form-field">
                <label>Full Name *</label>
                <input 
                  placeholder="Enter full name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-field">
                <label>Email Address *</label>
                <input 
                  type="email" 
                  placeholder="Enter email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Phone Number *</label>
                <input 
                  placeholder="Enter phone number" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-field">
                <label>Company</label>
                <input 
                  placeholder="Enter company name" 
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})} 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>ID Type *</label>
                <select value={formData.idType} onChange={(e) => setFormData({...formData, idType: e.target.value})}>
                  <option value="license">Driver's License</option>
                  <option value="passport">Passport</option>
                  <option value="national_id">National ID / Aadhaar</option>
                </select>
              </div>
              <div className="form-field">
                <label>ID Number *</label>
                <input 
                  placeholder="Enter ID number" 
                  value={formData.idNumber}
                  onChange={(e) => setFormData({...formData, idNumber: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="form-field full-width">
              <label>Address</label>
              <textarea 
                placeholder="Enter full address" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})} 
                rows="2"
              />
            </div>

            <div className="form-field full-width">
              <label>Photo (Optional - Max 5MB)</label>
              <div className="photo-upload-section">
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  id="photo-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="photo-upload" className="photo-upload-btn">
                  📷 Choose Photo
                </label>
                {photoPreview && (
                  <div className="photo-preview">
                    <img src={photoPreview} alt="Preview" />
                    <button 
                      type="button" 
                      className="remove-photo"
                      onClick={() => {
                        setPhotoPreview(null);
                        setFormData({...formData, photo: null});
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => {
                setShowForm(false);
                setPhotoPreview(null);
              }}>
                Cancel
              </button>
              <button type="submit" className="btn-submit">Register Visitor</button>
            </div>
          </form>
        </div>
      )}

      <div className="visitors-table-card">
        {visitors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>No visitors registered yet</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="visitors-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>ID Type</th>
                  <th>ID Number</th>
                  <th>Company</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map(visitor => (
                  <tr key={visitor._id}>
                    <td>
                      <div className="visitor-photo">
                        {visitor.photo ? (
                          <img src={visitor.photo} alt={visitor.name} />
                        ) : (
                          <div className="photo-placeholder">
                            {visitor.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td><strong>{visitor.name}</strong></td>
                    <td>{visitor.email}</td>
                    <td>{visitor.phone}</td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {visitor.idType.replace('_', ' ')}
                    </td>
                    <td>{visitor.idNumber}</td>
                    <td>{visitor.company || '-'}</td>
                    <td>{new Date(visitor.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Visitors;
