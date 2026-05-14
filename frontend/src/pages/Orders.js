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
              <div key={order.id} className="card order-card">
                <div className="order-header">
                  <span className="order-id">订单 #{order.id}</span>
                  <span className="order-status">{order.status === 'completed' ? '已完成' : order.status}</span>
                </div>
                <div className="order-details">
                  <div className="order-detail-item">
                    <strong>商品ID:</strong> {order.product_id}
                  </div>
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
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Orders;
