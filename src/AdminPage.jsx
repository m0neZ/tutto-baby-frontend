import React, { useState } from 'react';
import OptionManager from './components/OptionManager';
import './styles/theme.css';
import './styles/AdminPage.css';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('size');

  return (
    <main className="admin-page">
      <h1 className="admin-title">Gerenciar Campos</h1>

      <div className="admin-buttons">
        <button
          className={`admin-tab ${activeTab === 'size' ? 'active' : ''}`}
          onClick={() => setActiveTab('size')}
        >
          Tamanhos
        </button>
        <button
          className={`admin-tab ${activeTab === 'color_print' ? 'active' : ''}`}
          onClick={() => setActiveTab('color_print')}
        >
          Cores / Estampas
        </button>
        <button
          className={`admin-tab ${activeTab === 'supplier' ? 'active' : ''}`}
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
