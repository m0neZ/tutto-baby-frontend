import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';
import avatar from './assets/avatar.png';

const Header = ({ onOpenForm }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#fff',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #eee',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <img src={logo} alt="Tutto Baby" style={{ height: 70 }} />
        <button onClick={onOpenForm}>+ Produto</button>
      </div>

      <div style={{ position: 'relative' }}>
        <img
          src={avatar}
          alt="User"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ height: 36, width: 36, borderRadius: '50%', cursor: 'pointer' }}
        />
        {menuOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            backgroundColor: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderRadius: 8,
            padding: '0.5rem 0',
            minWidth: 160
          }}>
            <button
              onClick={() => {
                navigate('/admin');
                setMenuOpen(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                padding: '0.5rem 1rem',
                cursor: 'pointer'
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
