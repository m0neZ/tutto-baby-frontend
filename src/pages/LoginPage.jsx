// src/pages/LoginPage.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import PatternCanvas from '../components/PatternCanvas';

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100vh' }}>
      <PatternCanvas />
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          position: 'relative',
          maxWidth: 360,
          mx: 'auto',
          mt: 8,
          p: 4,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          Bem-vindos à Tutto Baby
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          label="Email"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Senha"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          sx={{ mb: 3 }}
        />
        <Button type="submit" variant="contained" fullWidth>
          Entrar
        </Button>
      </Box>
    </Box>
  );
}
