import React, { useState, useEffect } from 'react';
import API from '../api';
import '../styles/Appointments.css';

function Appointments({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    visitor: '', host: user._id, purpose: '', scheduledDate: '', scheduledTime: ''
  });

  useEffect(() => {
    fetchAppointments();
    fetchVisitors();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data } = await API.get('/appointments');
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchVisitors = async () => {
    try {
      const { data } = await API.get('/visitors');
      setVisitors(data);
    } catch (error) {
      console.error('Error fetching visitors:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/appointments', formData);
      setShowForm(false);
      setFormData({
        visitor: '', host: user._id, purpose: '', scheduledDate: '', scheduledTime: ''
      });
      fetchAppointments();
      alert('Appointment created successfully!');
    } catch (error) {
      console.error('Appointment creation error:', error);
      alert('Error creating appointment: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await API.patch(`/appointments/${id}/status`, { status });
      fetchAppointments();
    } catch (error) {
      alert('Error updating status');
    }
  };

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h1>Appointments</h1>
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Create Appointment'}
        </button>
      </div>

      {showForm && (
        <div className="appointment-form-card">
          <h3>Schedule New Appointment</h3>
          <form onSubmit={handleSubmit} className="appointment-form">
            <div className="form-field">
              <label>Select Visitor</label>
              <select value={formData.visitor} onChange={(e) => setFormData({...formData, visitor: e.target.value})} required>
                <option value="">Choose a visitor</option>
                {visitors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Purpose of Visit</label>
              <input 
                placeholder="Enter purpose" 
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})} 
                required 
              />
            </div>
            <div className="form-field">
              <label>Date</label>
              <input 
                type="date" 
                value={formData.scheduledDate}
                onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})} 
                required 
              />
            </div>
            <div className="form-field">
              <label>Time</label>
              <input 
                type="time" 
                value={formData.scheduledTime}
                onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})} 
                required 
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-submit">Create Appointment</button>
            </div>
          </form>
        </div>
      )}

      <div className="appointments-table-card">
        {appointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <p>No appointments scheduled yet</p>
          </div>
        ) : (
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Host</th>
                <th>Purpose</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(apt => (
                <tr key={apt._id}>
                  <td>{apt.visitor?.name}</td>
                  <td>{apt.host?.name}</td>
                  <td>{apt.purpose}</td>
                  <td>{new Date(apt.scheduledDate).toLocaleDateString()}</td>
                  <td>{apt.scheduledTime}</td>
                  <td>
                    <span className={`status-badge status-${apt.status}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td>
                    {apt.status === 'pending' && (
                      <div className="action-buttons">
                        <button className="btn-approve" onClick={() => handleStatusChange(apt._id, 'approved')}>
                          ✓ Approve
                        </button>
                        <button className="btn-reject" onClick={() => handleStatusChange(apt._id, 'rejected')}>
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Appointments;
