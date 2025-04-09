import React, { useEffect, useState } from 'react';
import OptionManager from './components/OptionManager';
import './styles/theme.css';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('size');

  return (
    <main>
      <h1 style={{ marginBottom: '1.5rem' }}>Gerenciar Campos</h1>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className={`button-primary ${activeTab === 'size' ? 'active' : ''}`}
          onClick={() => setActiveTab('size')}
        >
          Tamanhos
        </button>
        <button
          className={`button-primary ${activeTab === 'color_print' ? 'active' : ''}`}
          onClick={() => setActiveTab('color_print')}
        >
          Cores / Estampas
        </button>
        <button
          className={`button-primary ${activeTab === 'supplier' ? 'active' : ''}`}
          onClick={() => setActiveTab('supplier')}
        >
          Fornecedores
        </button>
      </div>

      <OptionManager type={activeTab} />
    </main>
  );
};

export default AdminPage;
