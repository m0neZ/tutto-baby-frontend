import React, { useEffect, useState } from 'react';
import { Plus, RotateCcw, Trash2 } from 'lucide-react'; // Import icons

// ✅ Use environment-safe and /api-correct backend base
const API_BASE = `${(import.meta.env?.VITE_API_URL || 'https://tutto-baby-backend.onrender.com').replace(/\/$/, '')}/api`;

const labels = {
  size: 'Tamanhos',
  color_print: 'Cores / Estampas',
  supplier: 'Fornecedores'
};

const OptionManager = ({ type }) => {
  const [options, setOptions] = useState([]);
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadOptions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/opcoes_campo/${type}?incluir_inativos=true`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch options');
      }

      // The API now returns all options (active and inactive)
      const allOptions = data.opcoes || [];
      setOptions(allOptions.sort((a, b) => a.value.localeCompare(b.value)));

    } catch (err) {
      console.error('Erro ao carregar opções:', err);
      setError('Erro ao carregar opções do servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Added loadOptions to dependency array as suggested by ESLint warning
  useEffect(() => {
    loadOptions();
    setNewValue('');
    setError('');
  }, [type, loadOptions]);

  const addOption = async () => {
    if (!newValue.trim()) return;
    setError('');
    try {
      const res = await fetch(`${API_BASE}/opcoes_campo/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newValue })
      });

      if (res.ok) {
        setNewValue('');
        await loadOptions(); // Reload options after adding
      } else {
        const data = await res.json();
        setError(data.message || 'Erro ao adicionar opção.');
      }
    } catch (err) {
      console.error('Erro no POST:', err);
      setError('Erro de comunicação ao adicionar opção.');
    }
  };

  const toggleActive = async (id, isActive) => {
    setError('');
    try {
      const action = isActive ? 'deactivate' : 'activate';
      const res = await fetch(`${API_BASE}/opcoes_campo/${id}/${action}`, {
        method: 'PATCH'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao atualizar status da opção');
      }

      await loadOptions(); // Reload options after status change
    } catch (err) {
      console.error('Erro ao atualizar:', err);
      setError(err.message || 'Erro ao atualizar status da opção.');
    }
  };

  const activeOptions = options.filter(o => o.is_active);
  const inactiveOptions = options.filter(o => !o.is_active);

  return (
    <div>
      <h2 className="text-xl font-semibold text-primary mb-4">{labels[type]}</h2>

      {/* Add New Option Form - Refined styling */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          placeholder={`Adicionar ${labels[type].slice(0, -1)}...`}
          className="flex-grow px-3 py-2 border border-accent/70 rounded-md focus:ring-1 focus:ring-primary focus:outline-none focus:border-primary/50 transition-shadow duration-150 shadow-sm"
        />
        <button
          onClick={addOption}
          className="flex items-center bg-primary text-white px-4 py-2 rounded-md shadow-sm hover:bg-secondary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <Plus size={18} className="mr-1" /> Adicionar
        </button>
      </div>

      {/* Error and Loading Messages - Refined */}
      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
      {loading && <p className="text-text-secondary mb-4 text-sm">Carregando...</p>}

      {/* Active Options List - Refined styling */}
      <div className="space-y-2">
        {activeOptions.map(opt => (
          <div
            key={opt.id}
            className="bg-background p-3 rounded-md border border-accent/50 flex justify-between items-center shadow-sm"
          >
            <span className="text-text-primary text-sm font-medium">{opt.value}</span>
            <button
              onClick={() => toggleActive(opt.id, true)}
              title="Desativar"
              className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-100 focus:outline-none focus:ring-1 focus:ring-red-300"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Inactive Options List - Refined styling */}
      {inactiveOptions.length > 0 && (
        <div className="mt-6 pt-4 border-t border-accent/50">
          <h4 className="text-base font-medium text-text-secondary mb-3">Inativos</h4>
          <div className="space-y-2">
            {inactiveOptions.map(opt => (
              <div
                key={opt.id}
                className="bg-gray-50 p-3 rounded-md border border-gray-200 flex justify-between items-center shadow-sm"
              >
                <span className="text-gray-500 italic text-sm">{opt.value}</span>
                <button
                  onClick={() => toggleActive(opt.id, false)}
                  title="Reativar"
                  className="text-green-600 hover:text-green-800 transition-colors p-1 rounded hover:bg-green-100 focus:outline-none focus:ring-1 focus:ring-green-300"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show message if no options exist - Refined */}
      {!loading && options.length === 0 && (
          <p className="text-text-secondary mt-4 text-sm text-center py-5">Nenhuma opção cadastrada para {labels[type].toLowerCase()}.</p>
      )}
    </div>
  );
};

export default OptionManager;

