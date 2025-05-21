// src/pages/LoginPage.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';
import { Box, Paper, Typography, TextField, Button, useTheme } from '@mui/material';
import bgImage from '../assets/LoginPage.jpg';
import PatternCanvas from '../components/PatternCanvas';

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await login(email, password);
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',        // <— prevent that tiny vertical scroll
      }}
    >
      {/* LEFT: Form with Canvas pattern background */}
      <Box
        sx={{
          flex: 0.3,
          position: 'relative',
          bgcolor: theme.palette.primary.main,  // <— now truly your green
          p: 2,
        }}
      >
        <PatternCanvas />
        <Paper elevation={6} sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 360, p: 4 }}>
          <Typography variant="h5" align="center" color="primary.contrastText" gutterBottom>
            Bem‐vindos à Tutto Baby
          </Typography>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="E-mail"
              type="email"
              required
              fullWidth
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <TextField
              label="Senha"
              type="password"
              required
              fullWidth
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 1,
                backgroundColor: theme.palette.primary.dark,
                '&:hover': { backgroundColor: theme.palette.primary.main },
              }}
            >
              Entrar
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* RIGHT: Background image */}
      <Box
        sx={{
          flex: 0.7,
          position: 'relative',
          '& img': { width: '100%', height: '100%', objectFit: 'cover' },
        }}
      >
        <img src={bgImage} alt="Tutto Baby Background" />
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.3)' }} />
      </Box>
    </Box>
  );
}
