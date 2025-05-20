// File: src/components/PatternCanvas.jsx
import React, { useRef, useEffect } from 'react';

export default function PatternCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let image = new Image();
    // Load the llama illustration pattern
    image.src = new URL('../assets/llama_illustration_2.png', import.meta.url).href;

    function resizeAndDraw() {
      // Resize canvas to fill parent
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      drawPattern();
    }

    function drawPattern() {
      const scale = 0.4; // 40% size
      const imgW = image.width * scale;
      const imgH = image.height * scale;
      const spacing = imgW * 3; // three times image width spacing
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let x = 0; x < canvas.width + imgW; x += spacing) {
        for (let y = 0; y < canvas.height + imgH; y += spacing) {
          ctx.save();
          const angle = Math.random() * 2 * Math.PI;
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.drawImage(image, -imgW / 2, -imgH / 2, imgW, imgH);
          ctx.restore();
        }
      }
    }

    image.onload = () => {
      resizeAndDraw();
      window.addEventListener('resize', resizeAndDraw);
    };

    return () => {
      window.removeEventListener('resize', resizeAndDraw);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0
      }}
    />
  );
}


// File: src/pages/LoginPage.jsx
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
        {/* Canvas behind */}
        <PatternCanvas />
        {/* Form on top */}
        <Paper
          elevation={6}
          sx={{
            zIndex: 1,
            width: '100%',
            maxWidth: 360,
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
                '&:hover': { backgroundColor: theme.palette.primary.main }
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
          flex: 0.6,
          position: 'relative',
          '& img': { width: '100%', height: '100%', objectFit: 'cover' }
        }}
      >
        <img src={bgImage} alt="Tutto Baby Background" />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(255,255,255,0.3)',
          }}
        />
      </Box>
    </Box>
  );
}
