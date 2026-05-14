import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

function CreateProduct() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image_url: '',
    is_promo: false
  });
  const [error, setError] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock)
        })
      });

      if (response.ok) {
        navigate('/products');
      } else {
        const data = await response.json();
        setError(data.error || '发布失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="container">
      <div className="card form-container" style={{ maxWidth: '600px' }}>
        <h2 className="form-title">发布商品</h2>
        {error && <div className="toast error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">商品名称</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="请输入商品名称"
            />
          </div>

          <div className="form-group">
            <label className="form-label">商品描述</label>
            <textarea
              name="description"
              className="form-input form-textarea"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="请输入商品描述"
            />
          </div>

          <div className="form-group">
            <label className="form-label">价格 (元)</label>
            <input
              type="number"
              name="price"
              className="form-input"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="请输入价格"
            />
          </div>

          <div className="form-group">
            <label className="form-label">库存数量</label>
            <input
              type="number"
              name="stock"
              className="form-input"
              value={formData.stock}
              onChange={handleChange}
              required
              min="0"
              placeholder="请输入库存数量"
            />
          </div>

          <div className="form-group">
            <label className="form-label">图片URL</label>
            <input
              type="url"
              name="image_url"
              className="form-input"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="请输入图片链接（可选）"
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                name="is_promo"
                checked={formData.is_promo}
                onChange={handleChange}
              />
              <span className="form-label" style={{ margin: 0 }}>设为促销商品</span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary form-btn">
            发布商品
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateProduct;
