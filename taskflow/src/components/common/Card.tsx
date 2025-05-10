import { Box } from '@chakra-ui/react';
import type { BoxProps } from '@chakra-ui/react';
import React from 'react';

interface CardProps extends BoxProps {
  children: React.ReactNode;
}

const Card = ({ children, ...rest }: CardProps) => {
  return (
    <Box
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
      p={5}
      _dark={{
        bg: 'gray.800',
      }}
      {...rest}
    >
      {children}
    </Box>
  );
};

export default Card; 