// src/components/FifoIndicator.jsx
import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import dayjs from 'dayjs';

/**
 * Component to display a visual FIFO indicator showing when a product would be sold
 * based on its purchase date (data_compra)
 */
const FifoIndicator = ({ dataCompra, fifoRank }) => {
  // Format the date for display
  const formattedDate = dataCompra ? dayjs(dataCompra).format('DD/MM/YYYY') : 'Data não disponível';
  
  // Determine color based on FIFO rank (1 = next to be sold)
  const getColor = (rank) => {
    if (rank === 1) return 'error.main'; // Red for next to be sold
    if (rank <= 3) return 'warning.main'; // Orange for soon to be sold
    if (rank <= 10) return 'info.main'; // Blue for middle priority
    return 'success.main'; // Green for later in the queue
  };

  // Get text based on FIFO rank
  const getFifoText = (rank) => {
    if (rank === 1) return 'Próximo a ser vendido (FIFO)';
    if (rank <= 3) return `${rank}º a ser vendido (FIFO)`;
    if (rank <= 10) return `${rank}º na fila FIFO`;
    return `${rank}º na fila FIFO`;
  };

  return (
    <Tooltip 
      title={
        <React.Fragment>
          <Typography variant="body2">
            {getFifoText(fifoRank)}
          </Typography>
          <Typography variant="caption">
            Data de compra: {formattedDate}
          </Typography>
        </React.Fragment>
      }
      arrow
    >
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          color: getColor(fifoRank),
          cursor: 'help'
        }}
      >
        <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
        <Typography variant="caption" fontWeight="bold">
          {fifoRank}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default FifoIndicator;
