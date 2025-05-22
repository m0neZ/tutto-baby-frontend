// src/components/FifoIndicator.jsx
import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';

/**
 * Component to display a visual stock level indicator showing how many units
 * of a product are available
 */
const StockLevelIndicator = ({ quantidade }) => {
  // Determine color based on stock quantity
  const getColor = (qty) => {
    if (qty === 1) return 'error.main'; // Red for only 1 unit left
    if (qty === 2) return 'warning.main'; // Orange for 2 units left
    if (qty <= 5) return 'info.main'; // Blue for 3-5 units
    return 'success.main'; // Green for more than 5 units
  };

  // Get text based on stock quantity
  const getStockText = (qty) => {
    if (qty === 1) return 'Estoque crítico: Apenas 1 unidade disponível';
    if (qty === 2) return 'Estoque baixo: 2 unidades disponíveis';
    if (qty <= 5) return `Estoque moderado: ${qty} unidades disponíveis`;
    return `Estoque adequado: ${qty} unidades disponíveis`;
  };

  return (
    <Tooltip 
      title={
        <React.Fragment>
          <Typography variant="body2">
            {getStockText(quantidade)}
          </Typography>
        </React.Fragment>
      }
      arrow
    >
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          color: getColor(quantidade),
          cursor: 'help'
        }}
      >
        <InventoryIcon fontSize="small" sx={{ mr: 0.5 }} />
        <Typography variant="caption" fontWeight="bold">
          {quantidade}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default StockLevelIndicator;
