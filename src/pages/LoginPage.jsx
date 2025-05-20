// File: src/pages/LoginPage.jsx

import React, { useState, useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';
import { Container, Box, TextField, Button, Typography, Paper } from '@mui/material';
import { styled } from '@mui/system';
import babyImage from '../assets/LoginPage.jpg'; // place the image in src/assets/

const StyledPaper = styled(Paper)(({ theme }) => ({
  maxWidth: 400,
  margin: 'auto',
  padding: theme.spacing(4),
  textAlign: 'center',
}));

export default function LoginPage() {
  const { login } = useContext(AuthContext);
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
    <Container sx={{ mt: 8 }}>
      <StyledPaper elevation={3}>
        <Box
          component="img"
          src={babyImage}
          alt="Tutto Baby"
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            objectFit: 'cover',
            mb: 2,
            mx: 'auto',
            border: (theme) => `4px solid ${theme.palette.primary.main}`,
          }}
        />

        <Typography variant="h5" gutterBottom color="primary">
          Bem-vindo ao Tutto Baby
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
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
              backgroundColor: (theme) => theme.palette.primary.main,
              '&:hover': { backgroundColor: (theme) => theme.palette.primary.dark },
            }}
          >
            Entrar
          </Button>
        </Box>
      </StyledPaper>
    </Container>
  );
}
