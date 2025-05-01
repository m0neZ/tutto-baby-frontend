import React, { useState } from 'react';
import OptionManager from './components/OptionManager';

const AdminPage = () => {
  const tabs = [
    { key: 'size', label: 'Tamanhos' },
    { key: 'color_print', label: 'Cores / Estampas' },
    { key: 'supplier', label: 'Fornecedores' },
    // Add other manageable fields if needed
  ];

  const [activeTab, setActiveTab] = useState(tabs[0].key); // Default to the first tab

  const tabBaseClasses = "px-4 py-2 rounded-t-md text-sm font-medium transition-colors duration-200 border-b-2 border-transparent hover:border-accent hover:text-primary focus:outline-none";
  const tabActiveClasses = "border-primary text-primary font-semibold"; // Active tab has colored border and text

  return (
    // Use container styles consistent with other pages
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold text-primary mb-6">Gerenciar Opções</h1>

      {/* Tab Buttons Container - Refined */}
      <div className="mb-6 border-b border-accent/50">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`${tabBaseClasses} ${activeTab === tab.key ? tabActiveClasses : "text-text-secondary"}`}
              aria-current={activeTab === tab.key ? "page" : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Render OptionManager for the active tab */}
      {/* Wrap OptionManager in a themed container - Refined */}
      <div className="bg-white p-6 rounded-md shadow-sm border border-accent/50">
        <OptionManager type={activeTab} />
      </div>
    </div>
  );
};

export default AdminPage;

