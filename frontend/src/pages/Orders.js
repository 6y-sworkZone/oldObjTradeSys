import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setOrders(data || []);
    } catch (error) {
      console.error('获取订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <div className="container">
      <h1 style={{ margin: '24px 0', color: '#333' }}>
        {user?.role === 'seller' ? '销售订单' : '我的订单'}
      </h1>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="orders-container">
          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">暂无订单记录</div>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="card order-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <img
                  src={order.product_image || 'https://picsum.photos/seed/order/100/100'}
                  alt={order.product_name}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                  onError={(e) => {
                    e.target.src = 'https://picsum.photos/seed/order/100/100';
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div className="order-header">
                    <span className="order-id">订单 #{order.id}</span>
                    <span style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {order.product_category}
                    </span>
                    <span className="order-status">{order.status === 'completed' ? '已完成' : order.status}</span>
                  </div>
                  <h3 style={{ margin: '8px 0', color: '#333' }}>{order.product_name}</h3>
                  <div className="order-details">
                    <div className="order-detail-item">
                      <strong>数量:</strong> {order.quantity} 件
                    </div>
                    <div className="order-detail-item">
                      <strong>总价:</strong> ¥{order.total_price.toFixed(2)}
                    </div>
                    {user?.role === 'seller' && (
                      <div className="order-detail-item">
                        <strong>买家ID:</strong> {order.buyer_id}
                      </div>
                    )}
                    <div className="order-detail-item">
                      <strong>下单时间:</strong> {formatDate(order.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Orders;
