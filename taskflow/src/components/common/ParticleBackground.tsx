import React from 'react';

interface ParticleBackgroundProps {
  isZenMode?: boolean;
}

// Simple alternative to tsparticles that won't cause errors
const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ isZenMode = false }) => {
  const dotCount = isZenMode ? 30 : 60;
  const bgColor = isZenMode ? 'rgba(21, 26, 48, 0.8)' : 'rgba(21, 26, 48, 0.95)';
  
  return (
    <div 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: bgColor,
        overflow: 'hidden',
        zIndex: 0
      }}
    >
      {/* Generate static dots as fallback to animation */}
      {Array.from({ length: dotCount }).map((_, i) => {
        const size = Math.random() * 4 + 1;
        const top = `${Math.random() * 100}%`;
        const left = `${Math.random() * 100}%`;
        const opacity = Math.random() * 0.5 + 0.1;
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top,
              left,
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              opacity,
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
            }}
          />
        );
      })}
    </div>
  );
};

export default ParticleBackground; 