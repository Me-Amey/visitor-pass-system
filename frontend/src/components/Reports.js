import React, { useState, useEffect } from 'react';
import API from '../api';
import '../styles/Reports.css';

function Reports({ user }) {
  const [reportType, setReportType] = useState('visitors');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let response;
      switch (reportType) {
        case 'visitors':
          response = await API.get('/visitors');
          setData(response.data);
          calculateVisitorStats(response.data);
          break;
        case 'appointments':
          response = await API.get('/appointments');
          setData(response.data);
          calculateAppointmentStats(response.data);
          break;
        case 'passes':
          response = await API.get('/passes');
          setData(response.data);
          calculatePassStats(response.data);
          break;
        case 'checklogs':
          response = await API.get('/checklogs', {
            params: {
              startDate: dateRange.startDate,
              endDate: dateRange.endDate
            }
          });
          setData(response.data);
          calculateCheckLogStats(response.data);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateVisitorStats = (visitors) => {
    const total = visitors.length;
    const withCompany = visitors.filter(v => v.company).length;
    const byIdType = visitors.reduce((acc, v) => {
      acc[v.idType] = (acc[v.idType] || 0) + 1;
      return acc;
    }, {});

    setStats({
      total,
      withCompany,
      withoutCompany: total - withCompany,
      byIdType
    });
  };

  const calculateAppointmentStats = (appointments) => {
    const total = appointments.length;
    const byStatus = appointments.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    setStats({
      total,
      byStatus
    });
  };

  const calculatePassStats = (passes) => {
    const total = passes.length;
    const byStatus = passes.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    setStats({
      total,
      byStatus
    });
  };

  const calculateCheckLogStats = (logs) => {
    const total = logs.length;
    const checkIns = logs.filter(l => l.type === 'check-in').length;
    const checkOuts = logs.filter(l => l.type === 'check-out').length;
    const byScanMethod = logs.reduce((acc, l) => {
      acc[l.scanMethod] = (acc[l.scanMethod] || 0) + 1;
      return acc;
    }, {});

    setStats({
      total,
      checkIns,
      checkOuts,
      byScanMethod
    });
  };

  const exportToCSV = () => {
    let headers = [];
    let csvData = [];

    switch (reportType) {
      case 'visitors':
        headers = ['Name', 'Email', 'Phone', 'ID Type', 'ID Number', 'Company', 'Registered Date'];
        csvData = data.map(v => [
          v.name,
          v.email,
          v.phone,
          v.idType,
          v.idNumber,
          v.company || '-',
          new Date(v.createdAt).toLocaleDateString()
        ]);
        break;
      case 'appointments':
        headers = ['Visitor', 'Host', 'Purpose', 'Date', 'Time', 'Status'];
        csvData = data.map(a => [
          a.visitor?.name || '-',
          a.host?.name || '-',
          a.purpose,
          new Date(a.scheduledDate).toLocaleDateString(),
          a.scheduledTime,
          a.status
        ]);
        break;
      case 'passes':
        headers = ['Pass Number', 'Visitor', 'Host', 'Valid From', 'Valid Until', 'Status', 'Purpose'];
        csvData = data.map(p => [
          p.passNumber,
          p.visitor?.name || '-',
          p.host?.name || '-',
          new Date(p.validFrom).toLocaleString(),
          new Date(p.validUntil).toLocaleString(),
          p.status,
          p.purpose || '-'
        ]);
        break;
      case 'checklogs':
        headers = ['Visitor', 'Type', 'Timestamp', 'Location', 'Scan Method', 'Verified By'];
        csvData = data.map(l => [
          l.visitor?.name || '-',
          l.type,
          new Date(l.timestamp).toLocaleString(),
          l.location || '-',
          l.scanMethod,
          l.verifiedBy?.name || '-'
        ]);
        break;
      default:
        break;
    }

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    alert('PDF export feature coming soon! Use CSV export for now.');
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Reports & Analytics</h1>
        <div className="export-buttons">
          <button className="btn-export-csv" onClick={exportToCSV}>
            📊 Export CSV
          </button>
          <button className="btn-export-pdf" onClick={exportToPDF}>
            📄 Export PDF
          </button>
        </div>
      </div>

      <div className="report-controls">
        <div className="control-group">
          <label>Report Type</label>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            className="report-select"
          >
            <option value="visitors">Visitors Report</option>
            <option value="appointments">Appointments Report</option>
            <option value="passes">Passes Report</option>
            <option value="checklogs">Check-In/Out Logs</option>
          </select>
        </div>

        {reportType === 'checklogs' && (
          <>
            <div className="control-group">
              <label>Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="date-input"
              />
            </div>
            <div className="control-group">
              <label>End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="date-input"
              />
            </div>
          </>
        )}

        <button className="btn-refresh" onClick={fetchReportData}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading report data...</p>
        </div>
      ) : (
        <>
          <div className="stats-summary">
            <h3>Summary Statistics</h3>
            <div className="stats-grid">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="stat-item">
                  <span className="stat-label">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="stat-value">
                    {typeof value === 'object' ? JSON.stringify(value) : value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-data">
            <h3>Detailed Data ({data.length} records)</h3>
            {data.length === 0 ? (
              <div className="empty-state">
                <p>No data available for the selected criteria</p>
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      {reportType === 'visitors' && (
                        <>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>ID Type</th>
                          <th>Company</th>
                          <th>Registered</th>
                        </>
                      )}
                      {reportType === 'appointments' && (
                        <>
                          <th>Visitor</th>
                          <th>Host</th>
                          <th>Purpose</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Status</th>
                        </>
                      )}
                      {reportType === 'passes' && (
                        <>
                          <th>Pass Number</th>
                          <th>Visitor</th>
                          <th>Valid From</th>
                          <th>Valid Until</th>
                          <th>Status</th>
                        </>
                      )}
                      {reportType === 'checklogs' && (
                        <>
                          <th>Visitor</th>
                          <th>Type</th>
                          <th>Timestamp</th>
                          <th>Location</th>
                          <th>Scan Method</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, index) => (
                      <tr key={index}>
                        {reportType === 'visitors' && (
                          <>
                            <td>{item.name}</td>
                            <td>{item.email}</td>
                            <td>{item.phone}</td>
                            <td>{item.idType}</td>
                            <td>{item.company || '-'}</td>
                            <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                          </>
                        )}
                        {reportType === 'appointments' && (
                          <>
                            <td>{item.visitor?.name || '-'}</td>
                            <td>{item.host?.name || '-'}</td>
                            <td>{item.purpose}</td>
                            <td>{new Date(item.scheduledDate).toLocaleDateString()}</td>
                            <td>{item.scheduledTime}</td>
                            <td>
                              <span className={`status-badge status-${item.status}`}>
                                {item.status}
                              </span>
                            </td>
                          </>
                        )}
                        {reportType === 'passes' && (
                          <>
                            <td>{item.passNumber}</td>
                            <td>{item.visitor?.name || '-'}</td>
                            <td>{new Date(item.validFrom).toLocaleString()}</td>
                            <td>{new Date(item.validUntil).toLocaleString()}</td>
                            <td>
                              <span className={`status-badge status-${item.status}`}>
                                {item.status}
                              </span>
                            </td>
                          </>
                        )}
                        {reportType === 'checklogs' && (
                          <>
                            <td>{item.visitor?.name || '-'}</td>
                            <td>
                              <span className={`type-badge type-${item.type}`}>
                                {item.type}
                              </span>
                            </td>
                            <td>{new Date(item.timestamp).toLocaleString()}</td>
                            <td>{item.location || '-'}</td>
                            <td>{item.scanMethod}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Reports;
