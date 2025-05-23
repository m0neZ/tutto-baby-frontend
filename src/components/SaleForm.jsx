// src/components/SaleForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Box
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { authFetch } from '../api';
import ProductSelectionModal from './ProductSelectionModal';

const SaleForm = ({ open, onClose, onSave, editData = null }) => {
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    forma_pagamento: '',
    data_venda: dayjs(),
    produtos: []
  });
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch payment methods on component mount
  useEffect(() => {
    const fetchFormasPagamento = async () => {
      try {
        const response = await authFetch('/opcoes_campo/forma_pagamento');
        if (response && response.success && Array.isArray(response.opcoes)) {
          setFormasPagamento(response.opcoes);
        } else {
          // Fallback default payment methods if API fails
          setFormasPagamento([
            { id: 1, value: 'Dinheiro' },
            { id: 2, value: 'Cartão de Crédito' },
            { id: 3, value: 'Cartão de Débito' },
            { id: 4, value: 'PIX' },
            { id: 5, value: 'Transferência Bancária' }
          ]);
        }
      } catch (error) {
        console.error('Erro ao buscar formas de pagamento:', error);
        // Fallback default payment methods if API fails
        setFormasPagamento([
          { id: 1, value: 'Dinheiro' },
          { id: 2, value: 'Cartão de Crédito' },
          { id: 3, value: 'Cartão de Débito' },
          { id: 4, value: 'PIX' },
          { id: 5, value: 'Transferência Bancária' }
        ]);
      }
    };

    fetchFormasPagamento();
  }, []);

  // Set form data if editing
  useEffect(() => {
    if (editData) {
      setFormData({
        nome: editData.nome || '',
        sobrenome: editData.sobrenome || '',
        forma_pagamento: editData.forma_pagamento || '',
        data_venda: editData.data_venda ? dayjs(editData.data_venda) : dayjs(),
        produtos: editData.produtos || []
      });
    } else {
      // Reset form for new sale
      setFormData({
        nome: '',
        sobrenome: '',
        forma_pagamento: '',
        data_venda: dayjs(),
        produtos: []
      });
    }
  }, [editData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      data_venda: date
    }));
    
    if (errors.data_venda) {
      setErrors(prev => ({
        ...prev,
        data_venda: null
      }));
    }
  };

  const handleAddProduct = () => {
    setIsProductModalOpen(true);
  };

  const handleProductSelected = (selectedProducts) => {
    setFormData(prev => ({
      ...prev,
      produtos: [...prev.produtos, ...selectedProducts]
    }));
    setIsProductModalOpen(false);
  };

  const handleRemoveProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      produtos: prev.produtos.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.sobrenome.trim()) {
      newErrors.sobrenome = 'Sobrenome é obrigatório';
    }
    
    if (!formData.forma_pagamento) {
      newErrors.forma_pagamento = 'Forma de pagamento é obrigatória';
    }
    
    if (!formData.data_venda) {
      newErrors.data_venda = 'Data da venda é obrigatória';
    }
    
    if (formData.produtos.length === 0) {
      newErrors.produtos = 'Adicione pelo menos um produto';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Format data for API
      const saleData = {
        cliente_nome: formData.nome,
        cliente_sobrenome: formData.sobrenome,
        forma_pagamento: formData.forma_pagamento,
        data_venda: formData.data_venda.format('YYYY-MM-DD'),
        produtos: formData.produtos.map(p => ({
          produto_id: p.id,
          quantidade: 1, // Always 1 in single-unit paradigm
          preco_venda: p.preco_venda
        })),
        status: 'Pagamento Pendente'
      };
      
      await onSave(saleData, editData?.id);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    return formData.produtos.reduce((sum, product) => sum + parseFloat(product.preco_venda || 0), 0);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { maxHeight: '90vh', borderRadius: '12px' } }}
    >
      <DialogTitle sx={{ 
        fontSize: '1.5rem', 
        fontWeight: 600, 
        pb: 2, 
        borderBottom: '1px solid #eee'
      }}>
        {editData ? 'Editar Venda' : 'Nova Venda'}
      </DialogTitle>
      
      <DialogContent sx={{ p: 4 }}>
        <Grid container spacing={3}>
          {/* Client Information */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body1" fontWeight={500} mb={1}>
              Nome <span style={{ color: '#d32f2f' }}>*</span>
            </Typography>
            <TextField
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              fullWidth
              error={!!errors.nome}
              helperText={errors.nome}
              required
              variant="outlined"
              placeholder="Nome do cliente"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body1" fontWeight={500} mb={1}>
              Sobrenome <span style={{ color: '#d32f2f' }}>*</span>
            </Typography>
            <TextField
              name="sobrenome"
              value={formData.sobrenome}
              onChange={handleChange}
              fullWidth
              error={!!errors.sobrenome}
              helperText={errors.sobrenome}
              required
              variant="outlined"
              placeholder="Sobrenome do cliente"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body1" fontWeight={500} mb={1}>
              Forma de Pagamento <span style={{ color: '#d32f2f' }}>*</span>
            </Typography>
            <FormControl fullWidth error={!!errors.forma_pagamento} required>
              <Select
                name="forma_pagamento"
                value={formData.forma_pagamento}
                onChange={handleChange}
                displayEmpty
                sx={{ 
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: errors.forma_pagamento ? '#d32f2f' : undefined
                  }
                }}
              >
                <MenuItem value="" disabled>Selecione uma forma de pagamento</MenuItem>
                {formasPagamento.map((option) => (
                  <MenuItem key={option.id} value={option.value}>
                    {option.value}
                  </MenuItem>
                ))}
              </Select>
              {errors.forma_pagamento && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors.forma_pagamento}
                </Typography>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body1" fontWeight={500} mb={1}>
              Data da Venda <span style={{ color: '#d32f2f' }}>*</span>
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
              <DatePicker
                value={formData.data_venda}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!errors.data_venda,
                    helperText: errors.data_venda,
                    sx: { 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px'
                      }
                    }
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          {/* Products Section */}
          <Grid item xs={12} sx={{ mt: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="body1" fontWeight={500}>
                Produtos
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddProduct}
                color="primary"
                sx={{ 
                  borderRadius: '8px',
                  textTransform: 'none',
                  px: 2,
                  py: 1,
                  backgroundColor: '#f0f9f0',
                  color: '#2e7d32',
                  borderColor: '#2e7d32',
                  '&:hover': {
                    backgroundColor: '#e0f2e0',
                    borderColor: '#2e7d32'
                  }
                }}
              >
                Adicionar Produto
              </Button>
            </Box>
            
            {errors.produtos && (
              <Typography variant="caption" color="error" paragraph>
                {errors.produtos}
              </Typography>
            )}
            
            {formData.produtos.length > 0 ? (
              <Paper 
                variant="outlined" 
                sx={{ 
                  maxHeight: '300px', 
                  overflow: 'auto',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}
              >
                <List>
                  {formData.produtos.map((product, index) => (
                    <ListItem key={index} divider={index < formData.produtos.length - 1}>
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight={500}>
                            {product.nome}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {`${product.tamanho} | ${product.cor_estampa}`}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2" color="primary" fontWeight={500}>
                              {`R$ ${parseFloat(product.preco_venda).toFixed(2).replace('.', ',')}`}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleRemoveProduct(index)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            ) : (
              <Box 
                sx={{ 
                  p: 4, 
                  border: '1px dashed #e0e0e0', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fafafa'
                }}
              >
                <Typography variant="body1" color="text.secondary" align="center">
                  Nenhum produto adicionado
                </Typography>
              </Box>
            )}
            
            {formData.produtos.length > 0 && (
              <Box mt={3} display="flex" justifyContent="flex-end">
                <Typography variant="h6" fontWeight={600} color="primary">
                  Total: R$ {calculateTotal().toFixed(2).replace('.', ',')}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, borderTop: '1px solid #eee', justifyContent: 'flex-end' }}>
        <Button 
          onClick={onClose} 
          sx={{ 
            px: 3, 
            py: 1, 
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={isLoading}
          sx={{ 
            px: 3, 
            py: 1, 
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          {isLoading ? 'Salvando...' : (editData ? 'Salvar' : 'Adicionar Venda')}
        </Button>
      </DialogActions>
      
      <ProductSelectionModal
        open={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onProductsSelected={handleProductSelected}
      />
    </Dialog>
  );
};

export default SaleForm;
