import React, { useState, useEffect } from 'react';
import API from '../api';
import '../styles/Dashboard.css';

function Dashboard({ user }) {
  const [stats, setStats] = useState({
    visitors: 0,
    appointments: 0,
    activePasses: 0,
    todayCheckIns: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
  }, []);

  const fetchStats = async () => {
    try {
      console.log('Fetching dashboard stats...');
      
      // Fetch data with individual error handling
      const results = await Promise.allSettled([
        API.get('/visitors'),
        API.get('/appointments'),
        API.get('/passes'),
        API.get('/checklogs')
      ]);
      
      const visitors = results[0].status === 'fulfilled' ? results[0].value.data : [];
      const appointments = results[1].status === 'fulfilled' ? results[1].value.data : [];
      const passes = results[2].status === 'fulfilled' ? results[2].value.data : [];
      const logs = results[3].status === 'fulfilled' ? results[3].value.data : [];
      
      console.log('Dashboard data fetched:', {
        visitors: visitors.length,
        appointments: appointments.length,
        passes: passes.length,
        logs: logs.length
      });
      
      const today = new Date().toDateString();
      const todayLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp).toDateString();
        const isToday = logDate === today;
        const isCheckIn = log.type === 'check-in';
        console.log('Log:', log.type, logDate, 'isToday:', isToday, 'isCheckIn:', isCheckIn);
        return isToday && isCheckIn;
      });
      
      console.log('Today\'s check-ins:', todayLogs.length);

      setStats({
        visitors: visitors.length,
        appointments: appointments.filter(a => a.status === 'pending').length,
        activePasses: passes.filter(p => p.status === 'active').length,
        todayCheckIns: todayLogs.length
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        visitors: 0,
        appointments: 0,
        activePasses: 0,
        todayCheckIns: 0
      });
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data } = await API.get('/checklogs');
      setRecentActivity(data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching activity:', error);
      setRecentActivity([]);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1 className="greeting">{getGreeting()}, {user.name}! 👋</h1>
          <p className="subtitle">Here's what's happening with your visitor management today</p>
        </div>
        <div className="date-section">
          <div className="date-card">
            <span className="date-label">Today</span>
            <span className="date-value">{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card-1">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Visitors</p>
            <h2 className="stat-value">{loading ? '...' : stats.visitors}</h2>
            <p className="stat-change positive">+12% from last month</p>
          </div>
        </div>

        <div className="stat-card stat-card-2">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Pending Appointments</p>
            <h2 className="stat-value">{loading ? '...' : stats.appointments}</h2>
            <p className="stat-change">Awaiting approval</p>
          </div>
        </div>

        <div className="stat-card stat-card-3">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Active Passes</p>
            <h2 className="stat-value">{loading ? '...' : stats.activePasses}</h2>
            <p className="stat-change">Currently valid</p>
          </div>
        </div>

        <div className="stat-card stat-card-4">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Today's Check-ins</p>
            <h2 className="stat-value">{loading ? '...' : stats.todayCheckIns}</h2>
            <p className="stat-change positive">+{stats.todayCheckIns} today</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="activity-section">
          <div className="section-header">
            <h3>Recent Activity</h3>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className={`activity-icon ${activity.type}`}>
                    {activity.type === 'check-in' ? '→' : '←'}
                  </div>
                  <div className="activity-details">
                    <p className="activity-title">
                      {activity.visitor?.name || 'Visitor'} {activity.type === 'check-in' ? 'checked in' : 'checked out'}
                    </p>
                    <p className="activity-time">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
}

export default Dashboard;
