import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';

function Home() {
  const { user } = useAuth();

  return (
    <div className="container">
      <div className="welcome-section">
        <h1 className="welcome-title">欢迎来到二手交易平台</h1>
        <p className="welcome-subtitle">
          安全、便捷、可靠的二手商品交易社区
        </p>
        
        <div className="feature-grid">
          <div className="card feature-card">
            <div className="feature-icon">🛍️</div>
            <h3 className="feature-title">海量商品</h3>
            <p className="feature-desc">
              各种二手商品应有尽有，从电子产品到家居用品
            </p>
          </div>
          
          <div className="card feature-card">
            <div className="feature-icon">💰</div>
            <h3 className="feature-title">超值价格</h3>
            <p className="feature-desc">
              以优惠的价格购买高品质商品，省钱又环保
            </p>
          </div>
          
          <div className="card feature-card">
            <div className="feature-icon">🔒</div>
            <h3 className="feature-title">安全交易</h3>
            <p className="feature-desc">
              严格的卖家认证和订单跟踪系统，保障交易安全
            </p>
          </div>
        </div>

        <div style={{ marginTop: '50px' }}>
          {user ? (
            <Link to="/products">
              <button className="btn btn-primary" style={{ fontSize: '18px', padding: '16px 40px' }}>
                开始购物 →
              </button>
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <Link to="/login">
                <button className="btn btn-primary" style={{ fontSize: '16px', padding: '14px 32px' }}>
                  立即登录
                </button>
              </Link>
              <Link to="/register">
                <button className="btn btn-secondary" style={{ fontSize: '16px', padding: '14px 32px' }}>
                  免费注册
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
