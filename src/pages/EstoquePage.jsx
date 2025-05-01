import React, { useState, useEffect } from 'react';
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

const EstoquePage = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProdutos = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("https://tutto-baby-backend.onrender.com/api/produtos/");
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
    };

    fetchProdutos();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}> {/* Use MUI Container */}
      {/* Page Header and Action Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          Estoque de Produtos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          sx={{ textTransform: 'none' }} // Prevent uppercase text
          // onClick={() => { /* TODO: Implement add product modal/page */ }}
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
            <TableHead sx={{ bgcolor: 'background.default' }}> {/* Use theme background */}
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Sexo</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Cor/Estampa</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Tamanho</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Qtd.</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Custo</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Preço Venda</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Fornecedor</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Data Compra</TableCell>
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
                    <TableCell component="th" scope="row" sx={{ color: 'text.primary' }}>
                      {produto.nome}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{produto.sexo}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{produto.cor_estampa}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{produto.tamanho}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{produto.quantidade_atual}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>R$ {produto.custo?.toFixed(2)}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>R$ {produto.preco_venda?.toFixed(2)}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{produto.nome_fornecedor}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{new Date(produto.data_compra).toLocaleDateString("pt-BR")}</TableCell>
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
    </Container>
  );
};

export default EstoquePage;

