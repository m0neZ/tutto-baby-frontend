// src/components/ExchangeForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Divider,
  Box,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { authFetch } from '../api';
import ProductSelectionModal from './ProductSelectionModal';
import SaleSelectionModal from './SaleSelectionModal';

const ExchangeForm = ({ open, onClose, onSave }) => {
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
      PaperProps={{ sx: { maxHeight: '90vh' } }}
    >
      <DialogTitle>Registrar Troca</DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Original Sale Selection */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1">
                Venda Original
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setIsSaleModalOpen(true)}
                color="primary"
              >
                {formData.venda_original ? 'Trocar Venda' : 'Selecionar Venda'}
              </Button>
            </Box>
            
            {errors.venda_original && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.venda_original}
              </Alert>
            )}
            
            {formData.venda_original && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle2">
                  Venda #{formData.venda_original.id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cliente: {formData.venda_original.cliente_nome} {formData.venda_original.cliente_sobrenome}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Data: {new Date(formData.venda_original.data_venda).toLocaleDateString('pt-BR')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Valor: R$ {parseFloat(formData.venda_original.valor_total || 0).toFixed(2).replace('.', ',')}
                </Typography>
              </Paper>
            )}
          </Grid>
          
          {/* Customer Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Informações do Cliente que está Trocando
            </Typography>
            <Typography variant="caption" color="text.secondary" paragraph>
              Pode ser diferente do cliente original (em caso de presente, por exemplo)
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="nome"
              label="Nome"
              value={formData.nome}
              onChange={handleChange}
              fullWidth
              error={!!errors.nome}
              helperText={errors.nome}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="sobrenome"
              label="Sobrenome"
              value={formData.sobrenome}
              onChange={handleChange}
              fullWidth
              error={!!errors.sobrenome}
              helperText={errors.sobrenome}
              required
            />
          </Grid>
          
          {/* Returned Products Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Produtos Devolvidos
            </Typography>
            
            {errors.produtos_devolvidos && (
              <Typography variant="caption" color="error" paragraph>
                {errors.produtos_devolvidos}
              </Typography>
            )}
            
            {formData.produtos_devolvidos.length > 0 ? (
              <Paper variant="outlined" sx={{ maxHeight: '200px', overflow: 'auto', mb: 3 }}>
                <List dense>
                  {formData.produtos_devolvidos.map((product, index) => (
                    <ListItem key={index} divider={index < formData.produtos_devolvidos.length - 1}>
                      <ListItemText
                        primary={product.nome}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {`${product.tamanho} | ${product.cor_estampa}`}
                            </Typography>
                            <br />
                            {`R$ ${parseFloat(product.preco_venda).toFixed(2).replace('.', ',')}`}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleRemoveReturnedProduct(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2, mb: 2 }}>
                Nenhum produto selecionado para devolução
              </Typography>
            )}
          </Grid>
          
          {/* New Products Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1">
                Produtos Novos
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddNewProduct}
                color="primary"
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
              <Paper variant="outlined" sx={{ maxHeight: '200px', overflow: 'auto' }}>
                <List dense>
                  {formData.produtos_novos.map((product, index) => (
                    <ListItem key={index} divider={index < formData.produtos_novos.length - 1}>
                      <ListItemText
                        primary={product.nome}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {`${product.tamanho} | ${product.cor_estampa}`}
                            </Typography>
                            <br />
                            {`R$ ${parseFloat(product.preco_venda).toFixed(2).replace('.', ',')}`}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleRemoveNewProduct(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                Nenhum produto novo selecionado
              </Typography>
            )}
          </Grid>
          
          {/* Price Difference */}
          {(formData.produtos_devolvidos.length > 0 || formData.produtos_novos.length > 0) && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2">Valor Devolvido:</Typography>
                    <Typography variant="body1">
                      R$ {calculateReturnedTotal().toFixed(2).replace('.', ',')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2">Valor Novos Produtos:</Typography>
                    <Typography variant="body1">
                      R$ {calculateNewTotal().toFixed(2).replace('.', ',')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2">Diferença a {priceDifference > 0 ? 'Pagar' : 'Receber'}:</Typography>
                    <Typography 
                      variant="body1" 
                      color={priceDifference > 0 ? 'error.main' : 'success.main'}
                      fontWeight="bold"
                    >
                      R$ {Math.abs(priceDifference).toFixed(2).replace('.', ',')}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? 'Registrando...' : 'Registrar Troca'}
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
