import React, { useState, useEffect } from 'react';
import { authFetch } from '../api';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Paper,
  Divider,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const OptionManager = ({ type }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newOption, setNewOption] = useState('');
  const [editOption, setEditOption] = useState({ id: null, value: '' });
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState('');
  const [dialogItem, setDialogItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [includeInactive, setIncludeInactive] = useState(false);

  // Get field name in Portuguese for display
  const getFieldLabel = () => {
    switch (type) {
      case 'tamanho': return 'Tamanhos';
      case 'cor_estampa': return 'Cores / Estampas';
      case 'fornecedor': return 'Fornecedores';
      default: return type;
    }
  };

  // Load options from API
  const loadOptions = () => {
    setLoading(true);
    setError(null);
    
    authFetch(`/opcoes_campo/${type}?incluir_inativos=${includeInactive}`, { method: 'GET' })
      .then(data => {
        if (Array.isArray(data.opcoes)) {
          setOptions(data.opcoes);
        } else {
          console.warn('OptionManager: expected array, got', data.opcoes);
          setOptions([]);
        }
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'Erro ao carregar opções');
        showSnackbar('Erro ao carregar opções', 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Load options on component mount and when type or includeInactive changes
  useEffect(() => {
    loadOptions();
  }, [type, includeInactive]);

  // Show snackbar notification
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Add new option
  const handleAddOption = async () => {
    if (!newOption.trim()) return;
    
    setLoading(true);
    try {
      const response = await authFetch(`/opcoes_campo/${type}`, {
        method: 'POST',
        body: JSON.stringify({ value: newOption.trim() })
      });
      
      if (response.success) {
        loadOptions();
        setNewOption('');
        showSnackbar('Opção adicionada com sucesso');
      } else {
        throw new Error(response.error || 'Erro ao adicionar opção');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Start editing an option
  const handleStartEdit = (option) => {
    setEditOption({ id: option.id, value: option.value });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditOption({ id: null, value: '' });
  };

  // Save edited option
  const handleSaveEdit = async () => {
    if (!editOption.value.trim()) return;
    
    setLoading(true);
    try {
      const response = await authFetch(`/opcoes_campo/${type}/${editOption.id}`, {
        method: 'PUT',
        body: JSON.stringify({ value: editOption.value.trim() })
      });
      
      if (response.success) {
        loadOptions();
        setEditOption({ id: null, value: '' });
        showSnackbar('Opção atualizada com sucesso');
      } else {
        throw new Error(response.error || 'Erro ao atualizar opção');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle option active status
  const handleToggleActive = async (option) => {
    setLoading(true);
    try {
      const newStatus = !option.is_active;
      const response = await authFetch(`/opcoes_campo/${type}/${option.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: newStatus })
      });
      
      if (response.success) {
        loadOptions();
        showSnackbar(`Opção ${newStatus ? 'ativada' : 'desativada'} com sucesso`);
      } else {
        throw new Error(response.error || `Erro ao ${newStatus ? 'ativar' : 'desativar'} opção`);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogItem(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Adicionar Nova Opção"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          disabled={loading}
          size="small"
          sx={{ mr: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddOption}
          disabled={loading || !newOption.trim()}
        >
          Adicionar
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">
          Lista de Opções
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              color="primary"
            />
          }
          label="Incluir Inativos"
        />
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : options.length === 0 ? (
        <Alert severity="info">
          Nenhuma opção encontrada. Adicione uma nova opção acima.
        </Alert>
      ) : (
        <List sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          {options.map((option, index) => (
            <React.Fragment key={option.id}>
              {index > 0 && <Divider />}
              <ListItem
                sx={{
                  opacity: option.is_active ? 1 : 0.6,
                  bgcolor: option.is_active ? 'inherit' : 'action.hover'
                }}
              >
                {editOption.id === option.id ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <TextField
                      fullWidth
                      value={editOption.value}
                      onChange={(e) => setEditOption({ ...editOption, value: e.target.value })}
                      size="small"
                      sx={{ mr: 2 }}
                      autoFocus
                    />
                    <IconButton
                      edge="end"
                      color="primary"
                      onClick={handleSaveEdit}
                      disabled={!editOption.value.trim()}
                    >
                      <SaveIcon />
                    </IconButton>
                    <IconButton edge="end" color="default" onClick={handleCancelEdit}>
                      <CancelIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <>
                    <ListItemText
                      primary={option.value}
                      secondary={!option.is_active ? 'Inativo' : null}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        color="primary"
                        onClick={() => handleStartEdit(option)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        color={option.is_active ? 'default' : 'primary'}
                        onClick={() => handleToggleActive(option)}
                      >
                        <Switch
                          size="small"
                          checked={option.is_active}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </>
                )}
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OptionManager;
