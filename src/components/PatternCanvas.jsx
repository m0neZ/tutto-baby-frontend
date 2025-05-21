// src/components/PatternCanvas.jsx
import React, { useRef, useEffect } from 'react';

export default function PatternCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const image = new Image();
    image.src = new URL('../assets/llama_illustration_2.png', import.meta.url).href;

    const drawPattern = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);

      const spacing = 80; // spacing between images
      const size = 40;    // llama size in pixels
      for (let y = -spacing; y < height + spacing; y += spacing) {
        for (let x = -spacing; x < width + spacing; x += spacing) {
          const angle = (Math.random() - 0.5) * 0.3; // small random rotation
          ctx.save();
          ctx.globalAlpha = 0.3; // slight transparency
          ctx.translate(x + spacing / 2, y + spacing / 2);
          ctx.rotate(angle);
          ctx.drawImage(image, -size / 2, -size / 2, size, size);
          ctx.restore();
        }
      }
    };

    image.onload = () => {
      drawPattern();
      window.addEventListener('resize', drawPattern);
    };
    return () => window.removeEventListener('resize', drawPattern);
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
        zIndex: 0,
      }}
    />
  );
}
