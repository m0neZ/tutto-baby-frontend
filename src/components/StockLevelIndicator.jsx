// src/components/StockLevelIndicator.jsx
import React from 'react';
import { Box, Tooltip } from '@mui/material';

/**
 * Component that displays a visual indicator for stock levels
 * 
 * @param {Object} props
 * @param {number} props.quantidade - The quantity of the item in stock
 * @returns {JSX.Element}
 */
const StockLevelIndicator = ({ quantidade }) => {
  // Determine color based on quantity
  let color = '#4CAF50'; // Green (6+ units)
  let label = 'Estoque adequado';
  
  if (quantidade <= 1) {
    color = '#F44336'; // Red (1 unit)
    label = 'Estoque crítico';
  } else if (quantidade <= 2) {
    color = '#FF9800'; // Orange (2 units)
    label = 'Estoque baixo';
  } else if (quantidade <= 5) {
    color = '#2196F3'; // Blue (3-5 units)
    label = 'Estoque moderado';
  }

  return (
    <Tooltip title={`${label} (${quantidade} unidades)`} arrow>
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: color,
          display: 'inline-block',
          ml: 1
        }}
      />
    </Tooltip>
  );
};

export default StockLevelIndicator;
