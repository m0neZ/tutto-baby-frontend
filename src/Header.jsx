import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';
import avatar from './assets/avatar.png';
import './Header.css';

const Header = ({ onOpenForm }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="header">
      <img src={logo} alt="Tutto Baby" className="logo" />

      <div style={{ position: 'relative' }}>
        <img
          src={avatar}
          alt="User"
          className="avatar"
          onClick={() => setMenuOpen(!menuOpen)}
        />
        {menuOpen && (
          <div className="menu">
            <button
              onClick={() => {
                navigate('/admin');
                setMenuOpen(false);
              }}
            >
              Gerenciar Campos
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
