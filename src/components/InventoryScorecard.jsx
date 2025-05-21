import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid,
  Skeleton
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import MoneyIcon from '@mui/icons-material/Money';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

/**
 * Formats currency values to Brazilian Real format with thousands separator
 * @param {number} value - The value to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = value => {
  if (value == null || isNaN(value)) return 'R$ 0,00';
  
  // Format with thousands separator (dot) and decimal separator (comma)
  return `R$ ${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Inventory Scorecard Component
 * Displays key metrics about the inventory in card format
 * 
 * @param {Object} props
 * @param {Array} props.products - Array of product objects
 * @param {boolean} props.loading - Whether data is still loading
 */
const InventoryScorecard = ({ products = [], loading = false }) => {
  // Calculate metrics only when products are available and not loading
  const metrics = React.useMemo(() => {
    if (loading || !Array.isArray(products) || products.length === 0) {
      return {
        totalQuantity: 0,
        averageCost: 0,
        totalInventoryValue: 0,
        averageSellingPrice: 0,
        potentialInventoryValue: 0
      };
    }

    // Filter out products with invalid values
    const validProducts = products.filter(p => 
      p && typeof p.quantidade_atual === 'number' && 
      typeof p.custo === 'number' && 
      typeof p.preco_venda === 'number'
    );

    if (validProducts.length === 0) return {
      totalQuantity: 0,
      averageCost: 0,
      totalInventoryValue: 0,
      averageSellingPrice: 0,
      potentialInventoryValue: 0
    };

    // Calculate total quantity
    const totalQuantity = validProducts.reduce((sum, p) => sum + p.quantidade_atual, 0);
    
    // Calculate weighted average cost
    const totalCost = validProducts.reduce((sum, p) => sum + (p.custo * p.quantidade_atual), 0);
    const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
    
    // Total inventory value (cost)
    const totalInventoryValue = totalCost;
    
    // Calculate weighted average selling price
    const totalSellingPrice = validProducts.reduce((sum, p) => sum + (p.preco_venda * p.quantidade_atual), 0);
    const averageSellingPrice = totalQuantity > 0 ? totalSellingPrice / totalQuantity : 0;
    
    // Potential inventory value (selling price)
    const potentialInventoryValue = totalSellingPrice;

    return {
      totalQuantity,
      averageCost,
      totalInventoryValue,
      averageSellingPrice,
      potentialInventoryValue
    };
  }, [products, loading]);

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        {/* Total Quantity */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={2}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <InventoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Quantidade Total
                </Typography>
              </Box>
              {loading ? (
                <Skeleton variant="text" width="60%" height={40} />
              ) : (
                <Typography variant="h5" component="div" fontWeight="bold">
                  {metrics.totalQuantity}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Average Cost */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={2}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MoneyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Custo Médio
                </Typography>
              </Box>
              {loading ? (
                <Skeleton variant="text" width="60%" height={40} />
              ) : (
                <Typography variant="h5" component="div" fontWeight="bold">
                  {formatCurrency(metrics.averageCost)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Total Inventory Value */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={2}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceWalletIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Valor do Estoque
                </Typography>
              </Box>
              {loading ? (
                <Skeleton variant="text" width="60%" height={40} />
              ) : (
                <Typography variant="h5" component="div" fontWeight="bold">
                  {formatCurrency(metrics.totalInventoryValue)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Average Selling Price */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={2}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShoppingCartIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Preço Médio de Venda
                </Typography>
              </Box>
              {loading ? (
                <Skeleton variant="text" width="60%" height={40} />
              ) : (
                <Typography variant="h5" component="div" fontWeight="bold">
                  {formatCurrency(metrics.averageSellingPrice)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Potential Inventory Value */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={2}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Valor Potencial do Estoque
                </Typography>
              </Box>
              {loading ? (
                <Skeleton variant="text" width="60%" height={40} />
              ) : (
                <Typography variant="h5" component="div" fontWeight="bold">
                  {formatCurrency(metrics.potentialInventoryValue)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventoryScorecard;
