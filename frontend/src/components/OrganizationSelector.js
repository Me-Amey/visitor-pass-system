import React, { useState, useEffect } from 'react';
import API from '../api';
import '../styles/OrganizationSelector.css';

function OrganizationSelector({ onSelect }) {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const { data } = await API.get('/organizations');
      setOrganizations(data);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (org) => {
    setSelectedOrg(org);
    onSelect(org);
  };

  if (loading) {
    return (
      <div className="org-selector-loading">
        <div className="spinner"></div>
        <p>Loading organizations...</p>
      </div>
    );
  }

  return (
    <div className="org-selector-container">
      <div className="org-selector-header">
        <h2>Select Organization</h2>
        <p>Choose an organization to continue</p>
      </div>

      <div className="org-grid">
        {organizations.map(org => (
          <div
            key={org._id}
            className={`org-card ${selectedOrg?._id === org._id ? 'selected' : ''}`}
            onClick={() => handleSelect(org)}
          >
            <div className="org-logo">
              {org.logo ? (
                <img src={org.logo} alt={org.name} />
              ) : (
                <div className="org-logo-placeholder">
                  {org.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="org-info">
              <h3>{org.name}</h3>
              <p className="org-code">{org.code}</p>
              <div className="org-status">
                <span className={`status-badge ${org.isActive ? 'active' : 'inactive'}`}>
                  {org.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="plan-badge">{org.subscription.plan}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {organizations.length === 0 && (
        <div className="org-empty">
          <p>No organizations available</p>
        </div>
      )}
    </div>
  );
}

export default OrganizationSelector;
