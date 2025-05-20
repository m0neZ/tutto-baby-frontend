// src/pages/LoginPage.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';
import { Container, TextField, Button, Typography } from '@mui/material';

export default function LoginPage() {
  const { login } = useContext(AuthContext);
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
    <Container maxWidth="xs" style={{ marginTop: '2rem' }}>
      <Typography variant="h5" align="center" gutterBottom>
        Entrar
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth margin="normal"
          label="E-mail" type="email"
          value={email} onChange={e => setEmail(e.target.value)}
        />
        <TextField
          fullWidth margin="normal"
          label="Senha" type="password"
          value={password} onChange={e => setPassword(e.target.value)}
        />
        <Button
          fullWidth variant="contained" type="submit"
          style={{ marginTop: '1rem' }}
        >
          Entrar
        </Button>
      </form>
    </Container>
  );
}
