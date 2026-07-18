import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import './DashboardPage.css';

function DashboardPage() {
  const { user } = useAuth();

  return (
    <Layout>
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.fullName || 'User'}! 👋</h1>
          <p style={{ color: 'var(--text-muted)' }}>Here's what's happening with your laundry business today.</p>
        </div>
        <button className="btn-primary">
          <span>+</span> New Order
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card glass-panel">
          <span className="metric-title">New Orders</span>
          <span className="metric-value">24</span>
          <span className="metric-trend trend-up">↑ 12% from yesterday</span>
        </div>
        <div className="metric-card glass-panel">
          <span className="metric-title">In Progress</span>
          <span className="metric-value">18</span>
          <span className="metric-trend" style={{ color: 'var(--text-muted)' }}>Currently washing</span>
        </div>
        <div className="metric-card glass-panel">
          <span className="metric-title">Ready for Pickup</span>
          <span className="metric-value">7</span>
          <span className="metric-trend trend-down">Needs attention</span>
        </div>
        <div className="metric-card glass-panel">
          <span className="metric-title">Revenue</span>
          <span className="metric-value">$428</span>
          <span className="metric-trend trend-up">↑ 5% from yesterday</span>
        </div>
      </div>

      <div className="recent-activity glass-panel">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          {[
            { id: 1, title: 'Order #1024 completed', time: '10 minutes ago', icon: '✨' },
            { id: 2, title: 'New order #1025 received', time: '25 minutes ago', icon: '📥' },
            { id: 3, title: 'Payment of $45.00 received', time: '1 hour ago', icon: '💵' },
            { id: 4, title: 'Order #1020 picked up', time: '2 hours ago', icon: '🛍️' },
          ].map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">{activity.icon}</div>
              <div className="activity-details">
                <div className="activity-title">{activity.title}</div>
                <div className="activity-time">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </Layout>
  );
}

export default DashboardPage;
