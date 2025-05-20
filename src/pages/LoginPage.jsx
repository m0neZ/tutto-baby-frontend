// src/pages/LoginPage.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import { Box, Paper, Typography, TextField, Button, useTheme } from '@mui/material';
import PatternCanvas from '../components/PatternCanvas';
import bgImage from '../assets/LoginPage.jpg';

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    console.log('🚀 Login attempt for', email);
    try {
      await login(email, password);
      console.log('✅ Login succeeded');
      navigate('/', { replace: true });
    } catch (err) {
      console.error('❌ Login failed', err);
      setError(err.message);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* LEFT: Form with Canvas pattern background */}
      <Box
        sx={{
          flex: 0.4,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: theme.palette.primary.main,
          p: 2,
        }}
      >
        <PatternCanvas />
        <Paper elevation={6} sx={{ zIndex: 1, width: '100%', maxWidth: 360, p: 4 }}>
          <Typography variant="h5" align="center" color="primary" gutterBottom>
            Bem‐vindos à Tutto Baby
          </Typography>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}
          >
            <TextField
              label="E‐mail"
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
      <Box sx={{ flex: 0.6, position: 'relative' }}>
        <Box
          component="img"
          src={bgImage}
          alt="Tutto Baby Background"
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            bgcolor: 'rgba(255,255,255,0.3)',
          }}
        />
      </Box>
    </Box>
  );
}
