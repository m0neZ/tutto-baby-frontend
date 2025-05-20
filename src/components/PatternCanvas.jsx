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
