import React, { useEffect, useState } from 'react';

const SnowEffect = ({ snowflakeCount = 50 }) => {
  const [snowflakes, setSnowflakes] = useState([]);

  useEffect(() => {
    const flakes = Array.from({ length: snowflakeCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: Math.random() * 4 + 3,
      opacity: Math.random() * 0.5 + 0.3,
      size: Math.random() * 10 + 10,
      delay: Math.random() * 5,
    }));
    setSnowflakes(flakes);
  }, [snowflakeCount]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          style={{
            position: 'absolute',
            top: '-20px',
            left: `${flake.left}%`,
            opacity: flake.opacity,
            fontSize: `${flake.size}px`,
            color: 'white',
            animation: `fall ${flake.animationDuration}s linear infinite`,
            animationDelay: `${flake.delay}s`,
            userSelect: 'none',
          }}
        >
          ❄
        </div>
      ))}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default SnowEffect;