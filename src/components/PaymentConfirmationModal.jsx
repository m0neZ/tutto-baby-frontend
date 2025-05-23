// src/components/PaymentConfirmationModal.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import CurrencyInput from 'react-currency-input-field';

const PaymentConfirmationModal = ({ open, onClose, onConfirm, sale }) => {
  const [formData, setFormData] = useState({
    valor_pago: sale?.valor_total || 0,
    data_pagamento: dayjs(),
    observacoes: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Calculate discount percentage
  const originalTotal = sale?.produtos?.reduce(
    (sum, item) => sum + parseFloat(item.preco_original || item.preco_venda || 0), 
    0
  ) || 0;
  
  const discountAmount = originalTotal - formData.valor_pago;
  const discountPercentage = originalTotal > 0 
    ? (discountAmount / originalTotal) * 100 
    : 0;

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
      data_pagamento: date
    }));
    
    if (errors.data_pagamento) {
      setErrors(prev => ({
        ...prev,
        data_pagamento: null
      }));
    }
  };

  const handleValueChange = (value) => {
    const numericValue = value ? parseFloat(value.replace(',', '.')) : 0;
    setFormData(prev => ({
      ...prev,
      valor_pago: numericValue
    }));
    
    if (errors.valor_pago) {
      setErrors(prev => ({
        ...prev,
        valor_pago: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.valor_pago <= 0) {
      newErrors.valor_pago = 'Valor pago deve ser maior que zero';
    }
    
    if (!formData.data_pagamento) {
      newErrors.data_pagamento = 'Data de pagamento é obrigatória';
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
      const paymentData = {
        valor_pago: formData.valor_pago,
        data_pagamento: formData.data_pagamento.format('YYYY-MM-DD'),
        observacoes: formData.observacoes,
        desconto_valor: discountAmount > 0 ? discountAmount : 0,
        desconto_percentual: discountPercentage > 0 ? discountPercentage : 0
      };
      
      await onConfirm(sale.id, paymentData);
      onClose();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>Confirmar Pagamento</DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Venda para: {sale?.cliente_nome} {sale?.cliente_sobrenome}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {sale?.produtos?.length || 0} produto(s)
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>
              Valor Original: R$ {originalTotal.toFixed(2).replace('.', ',')}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Valor Pago (R$)
              </Typography>
              <CurrencyInput
                id="valor_pago"
                name="valor_pago"
                placeholder="0,00"
                defaultValue={formData.valor_pago.toFixed(2).replace('.', ',')}
                decimalsLimit={2}
                decimalSeparator=","
                groupSeparator="."
                onValueChange={handleValueChange}
                className={`MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl ${
                  errors.valor_pago ? 'Mui-error' : ''
                }`}
                style={{
                  padding: '16.5px 14px',
                  borderRadius: '4px',
                  border: errors.valor_pago ? '1px solid #d32f2f' : '1px solid rgba(0, 0, 0, 0.23)',
                  width: '100%',
                  fontSize: '1rem'
                }}
              />
              {errors.valor_pago && (
                <Typography variant="caption" color="error">
                  {errors.valor_pago}
                </Typography>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
              <DatePicker
                label="Data do Pagamento"
                value={formData.data_pagamento}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!errors.data_pagamento,
                    helperText: errors.data_pagamento
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Desconto Aplicado
              </Typography>
              <Typography variant="body1" color={discountAmount > 0 ? 'success.main' : 'text.secondary'}>
                {discountAmount > 0 
                  ? `R$ ${discountAmount.toFixed(2).replace('.', ',')} (${discountPercentage.toFixed(2).replace('.', ',')}%)`
                  : 'Nenhum desconto'
                }
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              name="observacoes"
              label="Observações"
              value={formData.observacoes}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
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
          {isLoading ? 'Confirmando...' : 'Confirmar Pagamento'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentConfirmationModal;
