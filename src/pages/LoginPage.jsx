// src/pages/LoginPage.jsx

import React, { useState, useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  useTheme
} from '@mui/material';
import bgImage from '../assets/LoginPage.jpg'; // Make sure this file exists

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* LEFT SIDE: Login form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: theme.palette.background.default,
          p: 2,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            width: '100%',
            maxWidth: 400,
            p: 4,
          }}
        >
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
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Senha"
              type="password"
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 1,
                backgroundColor: theme.palette.primary.main,
                '&:hover': { backgroundColor: theme.palette.primary.dark },
              }}
            >
              Entrar
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* RIGHT SIDE: Background image */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        {/* Real img element */}
        <Box
          component="img"
          src={bgImage}
          alt="Tutto Baby Background"
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Semi-transparent overlay */}
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
