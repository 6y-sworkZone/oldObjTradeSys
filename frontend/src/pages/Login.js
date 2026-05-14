import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        navigate('/products');
      } else {
        setError(data.error || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    }
  };

  return (
    <div className="container">
      <div className="card form-container">
        <h2 className="form-title">用户登录</h2>
        {error && <div className="toast error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="请输入用户名"
            />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="请输入密码"
            />
          </div>
          <button type="submit" className="btn btn-primary form-btn">
            登录
          </button>
        </form>
        <div style={{ marginTop: '20px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
          <p>测试账号：buyer1 / 123456 (买家)</p>
          <p>测试账号：seller1 / 123456 (卖家)</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
