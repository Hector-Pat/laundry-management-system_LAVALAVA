import { useState } from 'react';
import './PedidosPage.css';

function PedidosPage() {
  const [activeFilter, setActiveFilter] = useState('All');

  const orders = [
    { id: 'ORD-1025', customer: 'Alice Smith', phone: '+1 234-567-8900', items: 3, total: '$45.00', status: 'Washing', date: 'Oct 24, 2023' },
    { id: 'ORD-1024', customer: 'Bob Jones', phone: '+1 987-654-3210', items: 5, total: '$72.50', status: 'Ready', date: 'Oct 23, 2023' },
    { id: 'ORD-1023', customer: 'Charlie Brown', phone: '+1 555-123-4567', items: 2, total: '$28.00', status: 'Delivered', date: 'Oct 22, 2023' },
    { id: 'ORD-1022', customer: 'Diana Prince', phone: '+1 444-987-6543', items: 8, total: '$115.00', status: 'Washing', date: 'Oct 24, 2023' },
  ];

  const getStatusClass = (status) => {
    switch(status) {
      case 'Washing': return 'status-washing';
      case 'Ready': return 'status-ready';
      case 'Delivered': return 'status-delivered';
      default: return '';
    }
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <div>
          <h1>Orders Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track and manage all laundry orders across the system.</p>
        </div>
        <button className="btn-primary">
          <span>+</span> Create Order
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div className="orders-filters">
          {['All', 'Washing', 'Ready', 'Delivered'].map(filter => (
            <button 
              key={filter}
              className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600 }}>{order.id}</td>
                  <td>
                    <div className="customer-info">
                      <span className="customer-name">{order.customer}</span>
                      <span className="customer-phone">{order.phone}</span>
                    </div>
                  </td>
                  <td>{order.date}</td>
                  <td>{order.items} pieces</td>
                  <td style={{ fontWeight: 600 }}>{order.total}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div className="order-actions">
                      <button className="icon-btn" title="View Details">👁️</button>
                      <button className="icon-btn" title="Edit Order">✏️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PedidosPage;
