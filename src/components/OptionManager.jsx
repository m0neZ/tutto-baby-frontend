import React, { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

// MUI Icons
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RestoreIcon from '@mui/icons-material/Restore';

const API_BASE = `${(import.meta.env?.VITE_API_URL || 'https://tutto-baby-backend.onrender.com').replace(/\/$/, '')}/api`;

const config = {
  tamanho: {
    label: 'Tamanhos',
    endpoint: `${API_BASE}/opcoes_campo/tamanho/`,
    dataKey: 'opcoes',
    valueKey: 'value',
  },
  cor_estampa: {
    label: 'Cores / Estampas',
    endpoint: `${API_BASE}/opcoes_campo/cor_estampa/`,
    dataKey: 'opcoes',
    valueKey: 'value',
  },
  fornecedor: {
    label: 'Fornecedores',
    endpoint: `${API_BASE}/fornecedores/`,
    dataKey: 'fornecedores',
    valueKey: 'nome',
  },
};

const OptionManager = ({ type }) => {
  const [options, setOptions] = useState([]);
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currentConfig = config[type];

  const loadOptions = useCallback(async () => {
    if (!currentConfig) {
      setError('Tipo de opção inválido.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${currentConfig.endpoint}?incluir_inativos=true`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Falha ao carregar ${currentConfig.label.toLowerCase()}`);
      }

      const allOptions = data[currentConfig.dataKey] || [];
      setOptions(allOptions.sort((a, b) => (a[currentConfig.valueKey] || '').localeCompare(b[currentConfig.valueKey] || '')));

    } catch (err) {
      console.error(`Erro ao carregar ${type}:`, err);
      setError(err.message || `Erro ao carregar ${currentConfig.label.toLowerCase()} do servidor.`);
    } finally {
      setLoading(false);
    }
  }, [type, currentConfig]);

  useEffect(() => {
    loadOptions();
    setNewValue('');
    setError('');
  }, [type, loadOptions]);

  const addOption = async () => {
    if (!newValue.trim() || !currentConfig) return;
    setError('');
    setLoading(true);
    try {
      const payload = { [currentConfig.valueKey]: newValue };
      const res = await fetch(currentConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setNewValue('');
        await loadOptions();
      } else {
        setError(data.error || `Erro ao adicionar ${currentConfig.label.slice(0, -1).toLowerCase()}.`);
      }
    } catch (err) {
      console.error('Erro no POST:', err);
      setError(`Erro de comunicação ao adicionar ${currentConfig.label.slice(0, -1).toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id, isActive) => {
    if (!currentConfig) return;
    setError('');
    setLoading(true);
    try {
      const action = isActive ? 'deactivate' : 'activate';
      const res = await fetch(`${currentConfig.endpoint}${id}/${action}`, {
        method: 'PATCH',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Erro ao atualizar status da ${currentConfig.label.slice(0, -1).toLowerCase()}`);
      }
      await loadOptions();
    } catch (err) {
      console.error('Erro ao atualizar:', err);
      setError(err.message || `Erro ao atualizar status da ${currentConfig.label.slice(0, -1).toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  if (!currentConfig) {
    return <Alert severity="error">Tipo de gerenciador de opções inválido: {type}</Alert>;
  }

  const activeOptions = options.filter(o => o.is_active);
  const inactiveOptions = options.filter(o => !o.is_active);

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ color: 'primary.main', mb: 2, fontWeight: 600 }}>
        {currentConfig.label}
      </Typography>

      {/* Add New Option Form */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          placeholder={`Adicionar ${currentConfig.label.slice(0, -1)}...`}
          disabled={loading}
        />
        <Button
          variant="contained"
          onClick={addOption}
          startIcon={<AddIcon />}
          disabled={loading || !newValue.trim()}
          sx={{ textTransform: 'none', flexShrink: 0 }}
        >
          Adicionar
        </Button>
      </Stack>

      {/* Error and Loading Messages */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Active Options List */}
      {!loading && activeOptions.length > 0 && (
        <Paper variant="outlined" sx={{ mb: 3 }}>
          <List dense disablePadding>
            {activeOptions.map((opt, index) => (
              <React.Fragment key={opt.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem>
                  <ListItemText primary={opt[currentConfig.valueKey]} sx={{ color: 'text.primary' }} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      title="Desativar"
                      onClick={() => toggleActive(opt.id, true)}
                      disabled={loading}
                      color="error"
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Inactive Options List */}
      {!loading && inactiveOptions.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 1, fontWeight: 500 }}>
            Inativos
          </Typography>
          <Paper variant="outlined" sx={{ bgcolor: 'action.hover' }}>
            <List dense disablePadding>
              {inactiveOptions.map((opt, index) => (
                <React.Fragment key={opt.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem sx={{ opacity: 0.7 }}>
                    <ListItemText primary={opt[currentConfig.valueKey]} sx={{ fontStyle: 'italic', color: 'text.secondary' }} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="restore"
                        title="Reativar"
                        onClick={() => toggleActive(opt.id, false)}
                        disabled={loading}
                        color="success"
                      >
                        <RestoreIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Box>
      )}

      {/* Show message if no options exist */}
      {!loading && options.length === 0 && (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', mt: 3, py: 3 }}>
          Nenhuma opção cadastrada para {currentConfig.label.toLowerCase()}.
        </Typography>
      )}
    </Box>
  );
};

export default OptionManager;
