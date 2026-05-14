import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error('获取商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: product.id, quantity: 1 })
      });

      if (response.ok) {
        setToast({ type: 'success', message: '下单成功！' });
        fetchProduct();
      } else {
        const data = await response.json();
        setToast({ type: 'error', message: data.error || '下单失败' });
      }
    } catch (error) {
      setToast({ type: 'error', message: '网络错误，请重试' });
    }

    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px' }}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '40px' }}>
        <div className="empty-state">
          <div className="empty-state-icon">😕</div>
          <div className="empty-state-text">商品不存在</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px' }}>
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <button
        className="btn"
        style={{ marginBottom: '20px', background: '#f0f0f0', color: '#333' }}
        onClick={() => navigate('/products')}
      >
        ← 返回商品列表
      </button>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div>
            <img
              src={product.image_url || 'https://picsum.photos/seed/placeholder/600/400'}
              alt={product.name}
              style={{
                width: '100%',
                height: '400px',
                objectFit: 'cover',
                borderRadius: '8px 0 0 8px'
              }}
              onError={(e) => {
                e.target.src = 'https://picsum.photos/seed/placeholder/600/400';
              }}
            />
          </div>

          <div style={{ padding: '40px 40px 40px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {product.category}
              </span>
              {product.is_promo && (
                <span style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  🔥 促销中
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '32px', marginBottom: '16px', color: '#333' }}>
              {product.name}
            </h1>

            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#e74c3c', marginBottom: '24px' }}>
              ¥{product.price.toFixed(2)}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '12px', color: '#555' }}>商品描述</h3>
              <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.8' }}>
                {product.description}
              </p>
            </div>

            <div style={{
              background: product.stock > 0 ? '#f0f9ff' : '#fff5f5',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <span style={{ fontWeight: 'bold', color: product.stock > 0 ? '#10b981' : '#ef4444' }}>
                {product.stock > 0 ? `库存: ${product.stock} 件` : '已售罄'}
              </span>
            </div>

            <div style={{
              background: '#f8f9fa',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <h4 style={{ marginBottom: '8px', color: '#555' }}>卖家信息</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {product.seller_name?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontWeight: 'bold', color: '#333' }}>{product.seller_name}</span>
              </div>
            </div>

            <button
              className="btn"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '18px',
                background: product.stock > 0
                  ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                  : '#ccc'
              }}
              disabled={product.stock === 0}
              onClick={handleOrder}
            >
              {product.stock === 0 ? '暂无库存' : '立即购买'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
