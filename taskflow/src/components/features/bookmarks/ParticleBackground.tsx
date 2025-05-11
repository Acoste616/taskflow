import React, { useCallback } from 'react';
import { Box } from '@chakra-ui/react';
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import type { Engine } from "tsparticles-engine";

interface ParticleBackgroundProps {
  isZenMode?: boolean;
}

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ isZenMode = false }) => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  return (
    <Box
      position="absolute"
      top="0"
      left="0"
      right="0"
      bottom="0"
      zIndex="0"
      pointerEvents="none"
    >
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          fullScreen: false,
          background: {
            color: {
              value: "transparent",
            },
          },
          fpsLimit: 60,
          particles: {
            color: {
              value: "#ffffff",
            },
            links: {
              color: "#3182CE",
              distance: 150,
              enable: true,
              opacity: isZenMode ? 0.2 : 0.4,
              width: 1,
            },
            collisions: {
              enable: false,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: {
                default: "bounce",
              },
              random: true,
              speed: isZenMode ? 0.3 : 0.8,
              straight: false,
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: isZenMode ? 30 : 80,
            },
            opacity: {
              value: isZenMode ? 0.3 : 0.5,
            },
            shape: {
              type: "circle",
            },
            size: {
              value: { min: 1, max: 3 },
            },
          },
          detectRetina: true,
        }}
      />
    </Box>
  );
};

export default ParticleBackground; 