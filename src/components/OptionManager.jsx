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

const labels = {
  tamanho: 'Tamanhos',
  cor_estampa: 'Cores / Estampas',
  fornecedor: 'Fornecedores'
};

const OptionManager = ({ type }) => {
  const [options, setOptions] = useState([]);
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // *** FIX: Determine API endpoint based on type ***
  const apiEndpoint = type === 'fornecedor' ? `${API_BASE}/fornecedores` : `${API_BASE}/opcoes_campo/${type}`;
  const dataKey = type === 'fornecedor' ? 'fornecedores' : 'opcoes';
  const valueKey = type === 'fornecedor' ? 'nome' : 'value'; // Key for the option's display value

  const loadOptions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Always include inactive for the manager view
      const res = await fetch(`${apiEndpoint}?incluir_inativos=true`); 
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to fetch ${type} options`);
      }
      
      const allOptions = data[dataKey] || [];
      // Sort by the correct value key
      setOptions(allOptions.sort((a, b) => (a[valueKey] || '').localeCompare(b[valueKey] || ''))); 

    } catch (err) {
      console.error(`Erro ao carregar ${type}:`, err);
      setError(`Erro ao carregar ${labels[type]?.toLowerCase() || 'opções'} do servidor.`);
    } finally {
      setLoading(false);
    }
  }, [type, apiEndpoint, dataKey, valueKey]); // Add new dependencies

  useEffect(() => {
    loadOptions();
    setNewValue('');
    setError('');
  }, [type, loadOptions]);

  const addOption = async () => {
    if (!newValue.trim()) return;
    setError('');
    setLoading(true);
    try {
      // *** FIX: Use correct payload key based on type ***
      const payload = { [valueKey]: newValue }; 
      const res = await fetch(apiEndpoint, { // Use the dynamic endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json(); // Always try to parse response

      if (res.ok && data.success) {
        setNewValue('');
        await loadOptions();
      } else {
        setError(data.error || `Erro ao adicionar ${labels[type]?.slice(0, -1) || 'opção'}.`);
      }
    } catch (err) {
      console.error('Erro no POST:', err);
      setError(`Erro de comunicação ao adicionar ${labels[type]?.slice(0, -1) || 'opção'}.`);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id, isActive) => {
    setError('');
    setLoading(true);
    try {
      const action = isActive ? 'deactivate' : 'activate';
      // *** FIX: Use the dynamic endpoint with ID and action ***
      const res = await fetch(`${apiEndpoint}/${id}/${action}`, { 
        method: 'PATCH'
      });

      const data = await res.json(); // Always try to parse response

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Erro ao atualizar status da ${labels[type]?.slice(0, -1) || 'opção'}`);
      }
      await loadOptions();
    } catch (err) {
      console.error('Erro ao atualizar:', err);
      setError(err.message || `Erro ao atualizar status da ${labels[type]?.slice(0, -1) || 'opção'}.`);
    } finally {
      setLoading(false);
    }
  };

  const activeOptions = options.filter(o => o.is_active);
  const inactiveOptions = options.filter(o => !o.is_active);

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ color: 'primary.main', mb: 2, fontWeight: 600 }}>
        {labels[type] || 'Opções'}
      </Typography>

      {/* Add New Option Form */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          placeholder={`Adicionar ${labels[type]?.slice(0, -1) || 'Opção'}...`}
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
                  {/* *** FIX: Use correct value key *** */}
                  <ListItemText primary={opt[valueKey]} sx={{ color: 'text.primary' }} /> 
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
                    {/* *** FIX: Use correct value key *** */}
                    <ListItemText primary={opt[valueKey]} sx={{ fontStyle: 'italic', color: 'text.secondary' }} /> 
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
          Nenhuma opção cadastrada para {labels[type]?.toLowerCase() || 'este tipo'}.
        </Typography>
      )}
    </Box>
  );
};

export default OptionManager;

