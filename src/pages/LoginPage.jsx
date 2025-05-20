// src/pages/LoginPage.jsx

import React, { useState, useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';
import {
  Grid,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  useTheme
} from '@mui/material';
import { styled } from '@mui/system';

// Vite/ESM–safe way to reference a static asset in src/
const backgroundUrl = new URL('../assets/LoginPage.jpg', import.meta.url).href;

// Left‐side form container
const FormContainer = styled(Paper)(({ theme }) => ({
  margin: theme.spacing(4),
  padding: theme.spacing(4),
  maxWidth: 400,
  width: '100%',
  [theme.breakpoints.down('sm')]: {
    margin: theme.spacing(2),
    padding: theme.spacing(2),
  },
}));

// Right‐side background image with semi-transparent overlay
const ImageContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  width: '100%',
  backgroundImage: `url(${backgroundUrl})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor:
      theme.palette.mode === 'light'
        ? 'rgba(255,255,255,0.6)'
        : 'rgba(0,0,0,0.6)',
  },
}));

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
    <Grid container sx={{ minHeight: '100vh' }}>
      {/* Form side */}
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <FormContainer elevation={6}>
          <Typography
            variant="h5"
            align="center"
            color="primary"
            gutterBottom
          >
            Bem-vindos à Tutto Baby
          </Typography>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              mt: 1,
            }}
          >
            <TextField
              label="E-mail"
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
        </FormContainer>
      </Grid>

      {/* Image side (hidden on small screens) */}
      <Grid item xs={false} md={6}>
        <ImageContainer />
      </Grid>
    </Grid>
  );
}
