import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Layout.css';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/pedidos', label: 'Orders', icon: '🧺' },
    { path: '/clientes', label: 'Customers', icon: '👥' },
  ];

  // Add role-specific links
  if (user?.role === 'admin') {
    navLinks.push({ path: '/admin', label: 'Admin', icon: '⚙️' });
  }

  return (
    <div className="layout-container">
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <div className="logo-icon">💧</div>
          <h2>LAVALAVA</h2>
        </div>
        
        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{user?.username?.charAt(0).toUpperCase() || 'U'}</div>
            <div className="user-details">
              <span className="user-name">{user?.username || 'User'}</span>
              <span className="user-role">{user?.role || 'Staff'}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout 🚪
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="search-bar">
            <span>🔍</span>
            <input type="text" placeholder="Search orders, customers..." className="input-field" />
          </div>
          <div className="topbar-actions">
            <button className="notification-btn">🔔</button>
          </div>
        </header>
        
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
