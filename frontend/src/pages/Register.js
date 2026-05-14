import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/login');
      } else {
        setError(data.error || '注册失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    }
  };

  return (
    <div className="container">
      <div className="card form-container">
        <h2 className="form-title">用户注册</h2>
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
          <div className="form-group">
            <label className="form-label">用户类型</label>
            <select
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="buyer">买家</option>
              <option value="seller">卖家</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary form-btn">
            注册
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
