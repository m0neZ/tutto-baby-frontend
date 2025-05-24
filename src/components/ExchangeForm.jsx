// src/components/ExchangeForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  Grid,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Box,
  Alert,
  Dialog,
  DialogContent,
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { authFetch } from '../api';
import ProductSelectionModal from './ProductSelectionModal';
import SaleSelectionModal from './SaleSelectionModal';
import { useTheme } from '@mui/material/styles';

const ExchangeForm = ({ open, onClose, onSave }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    venda_original: null,
    produtos_devolvidos: [],
    produtos_novos: []
  });
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        nome: '',
        sobrenome: '',
        venda_original: null,
        produtos_devolvidos: [],
        produtos_novos: []
      });
      setErrors({});
    }
  }, [open]);

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

  const handleSaleSelected = (sale) => {
    setFormData(prev => ({
      ...prev,
      venda_original: sale,
      produtos_devolvidos: sale.produtos || [],
      // Pre-fill customer name if empty
      nome: prev.nome || sale.cliente_nome || '',
      sobrenome: prev.sobrenome || sale.cliente_sobrenome || ''
    }));
    setIsSaleModalOpen(false);
  };

  const handleAddNewProduct = () => {
    setIsProductModalOpen(true);
  };

  const handleProductSelected = (selectedProducts) => {
    setFormData(prev => ({
      ...prev,
      produtos_novos: [...prev.produtos_novos, ...selectedProducts]
    }));
    setIsProductModalOpen(false);
  };

  const handleRemoveNewProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      produtos_novos: prev.produtos_novos.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveReturnedProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      produtos_devolvidos: prev.produtos_devolvidos.filter((_, i) => i !== index)
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
    
    if (!formData.venda_original) {
      newErrors.venda_original = 'Selecione uma venda para troca';
    }
    
    if (formData.produtos_devolvidos.length === 0) {
      newErrors.produtos_devolvidos = 'Selecione pelo menos um produto para devolução';
    }
    
    if (formData.produtos_novos.length === 0) {
      newErrors.produtos_novos = 'Selecione pelo menos um produto novo para a troca';
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
      const exchangeData = {
        cliente_nome: formData.nome,
        cliente_sobrenome: formData.sobrenome,
        venda_original_id: formData.venda_original.id,
        produtos_devolvidos: formData.produtos_devolvidos.map(p => ({
          produto_id: p.id,
          quantidade: 1 // Always 1 in single-unit paradigm
        })),
        produtos_novos: formData.produtos_novos.map(p => ({
          produto_id: p.id,
          quantidade: 1, // Always 1 in single-unit paradigm
          preco_venda: p.preco_venda
        }))
      };
      
      await onSave(exchangeData);
      onClose();
    } catch (error) {
      console.error('Erro ao registrar troca:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate price difference between returned and new products
  const calculateReturnedTotal = () => {
    return formData.produtos_devolvidos.reduce((sum, product) => 
      sum + parseFloat(product.preco_venda || 0), 0);
  };

  const calculateNewTotal = () => {
    return formData.produtos_novos.reduce((sum, product) => 
      sum + parseFloat(product.preco_venda || 0), 0);
  };

  const priceDifference = calculateNewTotal() - calculateReturnedTotal();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { maxHeight: '90vh', borderRadius: '12px' } }}
    >
      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
          <Box sx={{ mb: 4 }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              margin: 0, 
              color: '#111827' 
            }}>
              Registrar Troca
            </h2>
          </Box>

          <Box
            component="form"
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            {/* Original Sale Selection */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151'
                }}>
                  Venda Original <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <Button
                  variant="outlined"
                  onClick={() => setIsSaleModalOpen(true)}
                  sx={{ 
                    borderRadius: '8px',
                    textTransform: 'none',
                    px: 2,
                    py: 1,
                    borderColor: theme.palette.accent.main,
                    color: theme.palette.accent.main,
                    '&:hover': {
                      borderColor: theme.palette.accent.dark,
                      backgroundColor: 'rgba(189, 224, 254, 0.08)'
                    }
                  }}
                >
                  {formData.venda_original ? 'Trocar Venda' : 'Selecionar Venda'}
                </Button>
              </Box>
              
              {errors.venda_original && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
                  {errors.venda_original}
                </Alert>
              )}
              
              {formData.venda_original ? (
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    mb: 3, 
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    Venda #{formData.venda_original.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Cliente: {formData.venda_original.cliente_nome} {formData.venda_original.cliente_sobrenome}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Data: {new Date(formData.venda_original.data_venda).toLocaleDateString('pt-BR')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Valor: R$ {parseFloat(formData.venda_original.valor_total || 0).toFixed(2).replace('.', ',')}
                  </Typography>
                </Paper>
              ) : (
                <Box 
                  sx={{ 
                    p: 3, 
                    mb: 3,
                    border: '1px dashed #e0e0e0', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fafafa'
                  }}
                >
                  <Typography variant="body1" color="text.secondary" align="center">
                    Nenhuma venda selecionada
                  </Typography>
                </Box>
              )}
            </Box>
            
            {/* Customer Information */}
            <Box>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Informações do Cliente que está Trocando
              </label>
              <Typography variant="caption" color="text.secondary" paragraph>
                Pode ser diferente do cliente original (em caso de presente, por exemplo)
              </Typography>
              
              <Box sx={{ 
                display: "grid", 
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                gap: 2,
                mt: 1
              }}>
                <Box>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    Nome <span style={{ color: '#ef4444' }}>*</span>
                  </label>
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
                        '&:hover fieldset': { borderColor: theme.palette.accent.main },
                        '&.Mui-focused fieldset': { borderColor: theme.palette.accent.main },
                      }
                    }}
                  />
                </Box>
                
                <Box>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    Sobrenome <span style={{ color: '#ef4444' }}>*</span>
                  </label>
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
                        '&:hover fieldset': { borderColor: theme.palette.accent.main },
                        '&.Mui-focused fieldset': { borderColor: theme.palette.accent.main },
                      }
                    }}
                  />
                </Box>
              </Box>
            </Box>
            
            {/* Returned Products Section */}
            <Box>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151',
                marginBottom: '0.25rem'
              }}>
                Produtos Devolvidos <span style={{ color: '#ef4444' }}>*</span>
              </label>
              
              {errors.produtos_devolvidos && (
                <Typography variant="caption" color="error" paragraph>
                  {errors.produtos_devolvidos}
                </Typography>
              )}
              
              {formData.produtos_devolvidos.length > 0 ? (
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    maxHeight: '200px', 
                    overflow: 'auto', 
                    mb: 3,
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <List>
                    {formData.produtos_devolvidos.map((product, index) => (
                      <ListItem key={index} divider={index < formData.produtos_devolvidos.length - 1}>
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
                          <IconButton edge="end" onClick={() => handleRemoveReturnedProduct(index)} color="error">
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
                    p: 3, 
                    mb: 3,
                    border: '1px dashed #e0e0e0', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fafafa'
                  }}
                >
                  <Typography variant="body1" color="text.secondary" align="center">
                    Nenhum produto selecionado para devolução
                  </Typography>
                </Box>
              )}
            </Box>
            
            {/* New Products Section */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151'
                }}>
                  Produtos Novos <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddNewProduct}
                  sx={{ 
                    borderRadius: '8px',
                    textTransform: 'none',
                    px: 2,
                    py: 1,
                    backgroundColor: theme.palette.accent.main,
                    color: theme.palette.accent.contrastText,
                    '&:hover': {
                      backgroundColor: theme.palette.accent.dark,
                    }
                  }}
                >
                  Adicionar Produto
                </Button>
              </Box>
              
              {errors.produtos_novos && (
                <Typography variant="caption" color="error" paragraph>
                  {errors.produtos_novos}
                </Typography>
              )}
              
              {formData.produtos_novos.length > 0 ? (
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    maxHeight: '200px', 
                    overflow: 'auto',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <List>
                    {formData.produtos_novos.map((product, index) => (
                      <ListItem key={index} divider={index < formData.produtos_novos.length - 1}>
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
                          <IconButton edge="end" onClick={() => handleRemoveNewProduct(index)} color="error">
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
                    p: 3, 
                    border: '1px dashed #e0e0e0', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fafafa'
                  }}
                >
                  <Typography variant="body1" color="text.secondary" align="center">
                    Nenhum produto novo selecionado
                  </Typography>
                </Box>
              )}
              
              {/* Price Difference */}
              {(formData.produtos_devolvidos.length > 0 && formData.produtos_novos.length > 0) && (
                <Box mt={3} p={2} bgcolor="#f9fafb" borderRadius="8px">
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Total Devolvido:
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        R$ {calculateReturnedTotal().toFixed(2).replace('.', ',')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Total Novos:
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        R$ {calculateNewTotal().toFixed(2).replace('.', ',')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Diferença:
                      </Typography>
                      <Typography 
                        variant="body1" 
                        fontWeight={600} 
                        color={priceDifference > 0 ? 'error' : priceDifference < 0 ? 'success' : 'text.primary'}
                      >
                        {priceDifference > 0 ? '+' : ''}{priceDifference.toFixed(2).replace('.', ',')}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
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
          variant="contained"
          disabled={isLoading}
          sx={{ 
            px: 3, 
            py: 1, 
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500,
            backgroundColor: theme.palette.accent.main,
            color: theme.palette.accent.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.accent.dark,
            }
          }}
        >
          {isLoading ? 'Processando...' : 'Registrar Troca'}
        </Button>
      </DialogActions>
      
      <ProductSelectionModal
        open={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onProductsSelected={handleProductSelected}
      />
      
      <SaleSelectionModal
        open={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSaleSelected={handleSaleSelected}
      />
    </Dialog>
  );
};

export default ExchangeForm;
