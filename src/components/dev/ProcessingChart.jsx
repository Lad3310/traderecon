import React from 'react';
import { useEffect, useRef } from 'react';

const ProcessingChart = ({ data }) => {
  const canvasRef = useRef(null);

  const drawChart = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);

    // No data case
    if (!data.length) {
      ctx.fillStyle = '#6c757d';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', width / 2, height / 2);
      return;
    }

    // Calculate scales
    const maxCount = Math.max(...data.map(d => d.total));
    const timeScale = width / Math.min(20, data.length);
    const countScale = (height - 40) / (maxCount || 1);

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#dee2e6';
    ctx.moveTo(30, 10);
    ctx.lineTo(30, height - 30);
    ctx.lineTo(width - 10, height - 30);
    ctx.stroke();

    // Draw data lines
    const drawLine = (points, color) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      points.forEach((point, i) => {
        const x = width - (points.length - i) * timeScale;
        const y = height - 30 - (point * countScale);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    // Draw lines for different message types
    drawLine(data.map(d => d.mt518), '#28a745'); // MT518 in green
    drawLine(data.map(d => d.mt509), '#007bff'); // MT509 in blue
    drawLine(data.map(d => d.matches), '#ffc107'); // Matches in yellow

    // Draw legend
    const legend = [
      { label: 'MT518', color: '#28a745' },
      { label: 'MT509', color: '#007bff' },
      { label: 'Matches', color: '#ffc107' }
    ];

    legend.forEach((item, i) => {
      const x = 40 + i * 100;
      const y = height - 15;
      
      ctx.beginPath();
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2;
      ctx.moveTo(x, y);
      ctx.lineTo(x + 20, y);
      ctx.stroke();

      ctx.fillStyle = '#212529';
      ctx.font = '12px Arial';
      ctx.fillText(item.label, x + 25, y + 4);
    });
  };

  useEffect(() => {
    drawChart();
  }, [data]);

  return (
    <div className="processing-chart" style={{ marginTop: '1rem' }}>
      <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Processing History</h4>
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={200}
        style={{
          width: '100%',
          height: '200px',
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }}
      />
    </div>
  );
};

export default ProcessingChart; 