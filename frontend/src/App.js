import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import CreateProduct from './pages/CreateProduct';
import Orders from './pages/Orders';
import Home from './pages/Home';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setUser(data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        });
    }
  }, [token]);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <Router>
        <div className="App">
          <nav className="navbar">
            <div className="navbar-container">
              <Link to="/" className="navbar-brand">
                🛒 二手交易平台
              </Link>
              <div className="navbar-menu">
                {user ? (
                  <>
                    <Link to="/products" className="navbar-link">商品列表</Link>
                    {user.role === 'seller' && (
                      <Link to="/create-product" className="navbar-link">发布商品</Link>
                    )}
                    <Link to="/orders" className="navbar-link">我的订单</Link>
                    <div className="navbar-user">
                      <span>👤 {user.username} ({user.role === 'seller' ? '卖家' : '买家'})</span>
                      <button onClick={logout} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        退出
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="navbar-link">登录</Link>
                    <Link to="/register" className="navbar-link">注册</Link>
                  </>
                )}
              </div>
            </div>
          </nav>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={user ? <Navigate to="/products" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/products" /> : <Register />} />
            <Route path="/products" element={user ? <Products /> : <Navigate to="/login" />} />
            <Route path="/create-product" element={
              user && user.role === 'seller' ? <CreateProduct /> : <Navigate to="/login" />
            } />
            <Route path="/orders" element={user ? <Orders /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
