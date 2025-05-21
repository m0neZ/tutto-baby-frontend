// src/components/PatternCanvas.jsx
import React, { useRef, useEffect } from 'react';

export default function PatternCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const image = new Image();
    image.src = new URL('../assets/llama_illustration_2.png', import.meta.url).href;

    let animationId;

    function resizeCanvas() {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    function drawPattern() {
      const scale = 0.2;
      const imgW = image.width * scale;
      const imgH = image.height * scale;
      const spacing = imgW * 1.5;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let x = 0; x < canvas.width + imgW; x += spacing) {
        for (let y = 0; y < canvas.height + imgH; y += spacing) {
          ctx.save();
          ctx.globalAlpha = 0.6;
          const jitter = spacing * 0.2;
          const dx = (Math.random() - 0.5) * jitter;
          const dy = (Math.random() - 0.5) * jitter;
          const angle = Math.random() * Math.PI * 2;  // <— full random each draw
          ctx.translate(x + dx, y + dy);
          ctx.rotate(angle);
          ctx.drawImage(image, -imgW / 2, -imgH / 2, imgW, imgH);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    }

    function animate() {
      drawPattern();
      animationId = requestAnimationFrame(animate);
    }

    image.onload = () => {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      animate();     // <— kick off continuous animation
    };

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
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
        zIndex: 0,
      }}
    />
  );
}
