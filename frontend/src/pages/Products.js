import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [toast, setToast] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, [page, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) {
        fetchProducts();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 8,
        sort: sortBy,
        order: sortOrder,
        ...(search && { search })
      });

      const response = await fetch(`/api/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setProducts(data.products || []);
      setTotalPages(data.pages || 1);
    } catch (error) {
      console.error('获取商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async (productId) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 })
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ type: 'success', message: '下单成功！' });
        fetchProducts();
      } else {
        setToast({ type: 'error', message: data.error || '下单失败' });
      }
    } catch (error) {
      setToast({ type: 'error', message: '网络错误，请重试' });
    }

    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="container">
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <h1 style={{ margin: '24px 0', color: '#333' }}>商品列表</h1>

      <div className="filters">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 搜索商品名称或描述..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="select-input"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}
        >
          <option value="created_at">最新发布</option>
          <option value="price">价格排序</option>
          <option value="stock">库存排序</option>
        </select>
        <select
          className="select-input"
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(e.target.value);
            setPage(1);
          }}
        >
          <option value="desc">降序</option>
          <option value="asc">升序</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((product) => (
              <div key={product.id} className="card product-card">
                {product.is_promo && (
                  <div className="product-promo">🔥 促销中</div>
                )}
                <img
                  src={product.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                  alt={product.name}
                  className="product-image"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <div className="product-price">¥{product.price.toFixed(2)}</div>
                  <div className={`product-stock ${product.stock === 0 ? 'out' : product.stock <= 3 ? 'low' : ''}`}>
                    {product.stock === 0 ? '已售罄' : `库存: ${product.stock} 件`}
                  </div>
                  <button
                    className="btn btn-success"
                    style={{ width: '100%' }}
                    disabled={product.stock === 0}
                    onClick={() => handleOrder(product.id)}
                  >
                    {product.stock === 0 ? '暂无库存' : '立即购买'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">😕</div>
              <div className="empty-state-text">暂无商品</div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`page-btn ${p === page ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Products;
