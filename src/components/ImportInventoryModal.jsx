// src/components/ImportInventoryModal.jsx
import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  Link
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { authFetch } from '../api'; // Import authFetch for authenticated API calls

const ImportInventoryModal = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const steps = ['Selecionar arquivo', 'Validar dados', 'Importar produtos'];

  const resetState = () => {
    setActiveStep(0);
    setFile(null);
    setParsedData([]);
    setPreviewData([]);
    setErrors([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);
    setErrors([]);

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'csv') {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          handleParsedData(results.data);
          setIsLoading(false);
        },
        error: (error) => {
          setErrors([`Erro ao processar arquivo CSV: ${error.message}`]);
          setIsLoading(false);
        }
      });
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          handleParsedData(jsonData);
        } catch (error) {
          setErrors([`Erro ao processar arquivo Excel: ${error.message}`]);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      setErrors([`Formato de arquivo não suportado: ${fileExtension}. Use CSV, XLSX ou XLS.`]);
      setIsLoading(false);
    }
  };

  const handleParsedData = (data) => {
    if (!data || data.length === 0) {
      setErrors(['O arquivo não contém dados ou está em formato incorreto.']);
      return;
    }

    // Normalize field names (handle different case, spaces, etc.)
    const normalizedData = data.map(row => {
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        const lowerKey = key.toLowerCase().trim();
        if (lowerKey.includes('nome')) normalizedRow.nome = row[key];
        else if (lowerKey.includes('sexo')) normalizedRow.sexo = row[key];
        else if (lowerKey.includes('tamanho')) normalizedRow.tamanho = row[key];
        else if (lowerKey.includes('cor') || lowerKey.includes('estampa')) normalizedRow.cor_estampa = row[key];
        else if (lowerKey.includes('fornecedor')) normalizedRow.fornecedor = row[key];
        else if (lowerKey.includes('custo')) normalizedRow.custo = row[key];
        else if (lowerKey.includes('preco') || lowerKey.includes('venda')) normalizedRow.preco_venda = row[key];
        else if (lowerKey.includes('quantidade') || lowerKey.includes('qtd')) normalizedRow.quantidade = row[key];
        else if (lowerKey.includes('data')) normalizedRow.data_compra = row[key];
        else normalizedRow[key] = row[key]; // Keep other fields as is
      });
      return normalizedRow;
    });

    setParsedData(normalizedData);
    setPreviewData(normalizedData.slice(0, 5)); // Show first 5 rows for preview
    validateData(normalizedData);
    setActiveStep(1);
  };

  const validateData = (data) => {
    const validationErrors = [];
    const requiredFields = ['nome', 'sexo', 'tamanho', 'cor_estampa', 'fornecedor', 'custo', 'preco_venda'];
    
    // Check for required fields
    const firstRow = data[0] || {};
    const missingFields = requiredFields.filter(field => !firstRow.hasOwnProperty(field));
    if (missingFields.length > 0) {
      validationErrors.push(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
    }

    // Validate each row
    data.forEach((row, index) => {
      // Check for empty required fields
      requiredFields.forEach(field => {
        if (row.hasOwnProperty(field) && (row[field] === '' || row[field] === null || row[field] === undefined)) {
          validationErrors.push(`Linha ${index + 1}: Campo '${field}' está vazio`);
        }
      });

      // Validate numeric fields
      if (row.custo && isNaN(parseFloat(row.custo))) {
        validationErrors.push(`Linha ${index + 1}: Custo '${row.custo}' não é um número válido`);
      }
      if (row.preco_venda && isNaN(parseFloat(row.preco_venda))) {
        validationErrors.push(`Linha ${index + 1}: Preço de venda '${row.preco_venda}' não é um número válido`);
      }
      if (row.quantidade && isNaN(parseInt(row.quantidade))) {
        validationErrors.push(`Linha ${index + 1}: Quantidade '${row.quantidade}' não é um número válido`);
      }

      // Validate sexo field
      if (row.sexo && !['Masculino', 'Feminino', 'Unissex'].includes(row.sexo)) {
        validationErrors.push(`Linha ${index + 1}: Sexo '${row.sexo}' inválido. Use 'Masculino', 'Feminino' ou 'Unissex'`);
      }
    });

    // Limit to first 10 errors to avoid overwhelming the user
    setErrors(validationErrors.slice(0, 10));
    return validationErrors.length === 0;
  };

  const handleImport = async () => {
    if (errors.length > 0) {
      return; // Don't proceed if there are validation errors
    }

    setIsLoading(true);
    try {
      // Use authFetch instead of fetch to include JWT token
      const response = await authFetch('/produtos/import', {
        method: 'POST',
        body: JSON.stringify({ products: parsedData }),
      });
      
      // Check if response is successful
      if (!response || response.success === false) {
        throw new Error(response?.error || 'Erro desconhecido na importação');
      }
      
      setImportResult(response);
      setActiveStep(2);
    } catch (error) {
      console.error('Import error:', error);
      setErrors([`Erro ao importar: ${error.message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        nome: 'Body Manga Curta',
        sexo: 'Masculino',
        tamanho: 'RN',
        cor_estampa: 'Azul Marinho',
        fornecedor: 'Fornecedor A',
        custo: 25.90,
        preco_venda: 49.90,
        quantidade: 5,
        data_compra: '2025-05-01'
      },
      {
        nome: 'Macacão Longo',
        sexo: 'Feminino',
        tamanho: 'P',
        cor_estampa: 'Rosa Floral',
        fornecedor: 'Fornecedor B',
        custo: 35.50,
        preco_venda: 69.90,
        quantidade: 3,
        data_compra: '2025-05-10'
      }
    ];

    // Create worksheet from sample data
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');
    
    // Generate and download file
    XLSX.writeFile(workbook, 'modelo_importacao_produtos.xlsx');
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current.click()}
              sx={{ mb: 2 }}
            >
              Selecionar Arquivo
            </Button>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Formatos aceitos: CSV, XLSX, XLS
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={downloadSampleTemplate}
            >
              Baixar Modelo
            </Button>
            {file && (
              <Typography variant="body1" sx={{ mt: 2 }}>
                Arquivo selecionado: {file.name}
              </Typography>
            )}
            {isLoading && <CircularProgress sx={{ mt: 2 }} />}
          </Box>
        );
      case 1:
        return (
          <Box>
            {errors.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <AlertTitle>Erros de validação</AlertTitle>
                <ul>
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
                {errors.length === 10 && (
                  <Typography variant="body2">
                    Mostrando apenas os primeiros 10 erros. Corrija-os e tente novamente.
                  </Typography>
                )}
              </Alert>
            )}
            <Typography variant="h6" sx={{ mb: 1 }}>
              Prévia dos dados ({parsedData.length} produtos)
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 2, maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {previewData.length > 0 && Object.keys(previewData[0]).map((key) => (
                      <TableCell key={key}>{key}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Object.values(row).map((value, cellIndex) => (
                        <TableCell key={cellIndex}>{value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Alert severity="info">
              <AlertTitle>Informações importantes</AlertTitle>
              <ul>
                <li>Produtos com quantidade maior que 1 serão divididos em múltiplas unidades individuais.</li>
                <li>Novos valores para tamanho, cor/estampa e fornecedor serão criados automaticamente.</li>
                <li>A data de compra será usada para determinar a ordem FIFO.</li>
              </ul>
            </Alert>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {importResult && (
              <>
                <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Importação concluída com sucesso!
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {importResult.imported} produtos importados
                </Typography>
                {importResult.newOptions && (
                  <Box sx={{ mt: 2, textAlign: 'left' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Novas opções criadas:
                    </Typography>
                    <ul>
                      {importResult.newOptions.tamanhos && importResult.newOptions.tamanhos.length > 0 && (
                        <li>Tamanhos: {importResult.newOptions.tamanhos.join(', ')}</li>
                      )}
                      {importResult.newOptions.cores && importResult.newOptions.cores.length > 0 && (
                        <li>Cores/Estampas: {importResult.newOptions.cores.join(', ')}</li>
                      )}
                      {importResult.newOptions.fornecedores && importResult.newOptions.fornecedores.length > 0 && (
                        <li>Fornecedores: {importResult.newOptions.fornecedores.join(', ')}</li>
                      )}
                    </ul>
                  </Box>
                )}
              </>
            )}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { minHeight: '60vh' } }}
    >
      <DialogTitle>Importar Produtos</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {renderStepContent()}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          {activeStep === 2 ? 'Fechar' : 'Cancelar'}
        </Button>
        {activeStep === 1 && (
          <Button 
            onClick={handleImport} 
            variant="contained" 
            disabled={errors.length > 0 || isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Importar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportInventoryModal;
