import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

// Import the AddProductModal component
import AddProductModal from '../components/AddProductModal';

const API_BASE = `${(import.meta.env?.VITE_API_URL || 'https://tutto-baby-backend.onrender.com').replace(/\/$/, '')}/api`;

const EstoquePage = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAddModal, setOpenAddModal] = useState(false); // State for modal

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/produtos/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProdutos(data.produtos || []);
    } catch (e) {
      console.error("Error fetching products:", e);
      setError('Falha ao carregar produtos. Verifique a conexão com o backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  const handleOpenAddModal = () => {
    setOpenAddModal(true);
  };

  const handleCloseAddModal = () => {
    setOpenAddModal(false);
  };

  const handleProductAdded = () => {
    handleCloseAddModal();
    fetchProdutos(); // Refresh the product list
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header and Action Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          Estoque de Produtos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          sx={{ textTransform: 'none' }} // Prevent uppercase text
          onClick={handleOpenAddModal} // Attach handler to open modal
        >
          Adicionar Produto
        </Button>
      </Box>

      {/* Loading and Error States */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* Products Table */}
      {!loading && !error && (
        <TableContainer component={Paper} sx={{ boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead> {/* Removed sx={{ bgcolor: 'background.default' }} to use theme override */}
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Sexo</TableCell>
                <TableCell>Cor/Estampa</TableCell>
                <TableCell>Tamanho</TableCell>
                <TableCell>Qtd.</TableCell>
                <TableCell>Custo</TableCell>
                <TableCell>Preço Venda</TableCell>
                <TableCell>Fornecedor</TableCell>
                <TableCell>Data Compra</TableCell>
                {/* Add Actions column header if needed */}
              </TableRow>
            </TableHead>
            <TableBody>
              {produtos.length > 0 ? (
                produtos.map((produto) => (
                  <TableRow
                    key={produto.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <TableCell component="th" scope="row">
                      {produto.nome}
                    </TableCell>
                    <TableCell>{produto.sexo}</TableCell>
                    <TableCell>{produto.cor_estampa}</TableCell>
                    <TableCell>{produto.tamanho}</TableCell>
                    <TableCell>{produto.quantidade_atual}</TableCell>
                    <TableCell>R$ {produto.custo?.toFixed(2)}</TableCell>
                    <TableCell>R$ {produto.preco_venda?.toFixed(2)}</TableCell>
                    <TableCell>{produto.nome_fornecedor}</TableCell>
                    <TableCell>{new Date(produto.data_compra).toLocaleDateString("pt-BR")}</TableCell>
                    {/* Add Actions cell if needed */}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    Nenhum produto encontrado no estoque.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Render the AddProductModal */}
      <AddProductModal 
        open={openAddModal} 
        onClose={handleCloseAddModal} 
        onSuccess={handleProductAdded} 
      />

    </Container>
  );
};

export default EstoquePage;

