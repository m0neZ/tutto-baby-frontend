import React, { useEffect, useState } from 'react';

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

  const loadOptions = async () => {
    try {
      const res = await fetch(`${API_BASE}/fields/${type}?active=false`);
      const data = await res.json();
      setOptions(data);
    } catch (err) {
      console.error('Erro ao carregar opções:', err);
      setError('Erro ao se comunicar com o servidor');
    }
  };

  useEffect(() => {
    loadOptions();
    setNewValue('');
    setError('');
  }, [type]);

  const addOption = async () => {
    if (!newValue.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/fields/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newValue })
      });

      if (res.ok) {
        setNewValue('');
        await loadOptions();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao adicionar');
      }
    } catch (err) {
      console.error('Erro no POST:', err);
      setError('Erro ao se comunicar com o servidor');
    }
  };

  const toggleActive = async (id, isActive) => {
    try {
      const res = await fetch(`${API_BASE}/fields/${id}/${isActive ? 'deactivate' : 'activate'}`, {
        method: 'PATCH'
      });

      if (!res.ok) {
        throw new Error('Erro ao atualizar opção');
      }

      await loadOptions();
    } catch (err) {
      console.error('Erro ao atualizar:', err);
      setError('Erro ao atualizar opção');
    }
  };

  const active = options.filter(o => o.is_active);
  const inactive = options.filter(o => !o.is_active);

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>{labels[type]}</h2>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          placeholder={`Adicionar novo ${labels[type].toLowerCase()}`}
          style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
        />
        <button className="button-primary" onClick={addOption}>Adicionar</button>
      </div>

      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

      <div>
        {active.map(opt => (
          <div key={opt.id} style={{
            backgroundColor: '#fff',
            padding: '0.75rem 1rem',
            marginBottom: '0.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{opt.value}</span>
            <button onClick={() => toggleActive(opt.id, true)}>Desativar</button>
          </div>
        ))}

        {inactive.length > 0 && (
          <>
            <h4 style={{ marginTop: '2rem', marginBottom: '0.5rem' }}>Inativos</h4>
            {inactive.map(opt => (
              <div key={opt.id} style={{
                backgroundColor: '#f3f3f3',
                padding: '0.75rem 1rem',
                marginBottom: '0.5rem',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontStyle: 'italic',
                color: '#999'
              }}>
                <span>{opt.value}</span>
                <button onClick={() => toggleActive(opt.id, false)}>Reativar</button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default OptionManager;
