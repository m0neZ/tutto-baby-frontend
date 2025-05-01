import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react'; // Import icon for button

const EstoquePage = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProdutos = async () => {
      setLoading(true);
      setError(null);
      try {
        // Ensure the backend server is running and accessible
        // The backend is deployed to production
        const response = await fetch("https://tutto-baby-backend.onrender.com/api/produtos/");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProdutos(data.produtos || []); // Adjust based on actual API response structure
      } catch (e) {
        console.error("Error fetching products:", e);
        setError('Falha ao carregar produtos. Verifique se o backend está rodando.');
      } finally {
        setLoading(false);
      }
    };

    fetchProdutos();
  }, []);

  return (
    // Main container for the page content
    <div className="container mx-auto px-6 py-8">
      {/* Page Header and Action Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-primary">Estoque de Produtos</h1>
        {/* Add Product Button - Refined styling */}
        <button className="flex items-center bg-primary text-white px-4 py-2 rounded-md shadow-sm hover:bg-secondary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50">
          <PlusCircle className="w-5 h-5 mr-2" />
          Adicionar Produto
        </button>
      </div>

      {/* Loading and Error States */}
      {loading && <p className="text-center text-text-secondary py-10">Carregando produtos...</p>}
      {error && <p className="text-center text-red-600 bg-red-100 p-4 rounded-md shadow-sm">{error}</p>}

      {/* Products Table */}
      {!loading && !error && (
        // Table container with refined styling
        <div className="bg-white shadow-sm rounded-md overflow-hidden border border-accent/50">
          <table className="min-w-full divide-y divide-accent/30">
            {/* Table Header - Using lightest green background */}
            <thead className="bg-background">
              <tr>
                {/* Header cells styling */}
                <th className="px-6 py-3 text-left text-xs font-medium text-text-primary uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-primary uppercase tracking-wider">Sexo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-primary uppercase tracking-wider">Cor/Estampa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-primary uppercase tracking-wider">Tamanho</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-primary uppercase tracking-wider">Qtd.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-primary uppercase tracking-wider">Custo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-primary uppercase tracking-wider">Preço Venda</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-primary uppercase tracking-wider">Fornecedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-primary uppercase tracking-wider">Data Compra</th>
                {/* Add Actions column if needed */}
              </tr>
            </thead>
            {/* Table Body */}
            <tbody className="bg-white divide-y divide-accent/30">
              {produtos.length > 0 ? (
                produtos.map((produto) => (
                  // Table row with hover effect
                  <tr key={produto.id} className="hover:bg-background transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{produto.nome}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{produto.sexo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{produto.cor_estampa}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{produto.tamanho}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{produto.quantidade_atual}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">R$ {produto.custo?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">R$ {produto.preco_venda?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{produto.nome_fornecedor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{new Date(produto.data_compra).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))
              ) : (
                // Message when no products are found
                <tr>
                  <td colSpan="9" className="px-6 py-10 text-center text-sm text-text-secondary">Nenhum produto encontrado no estoque.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EstoquePage;

