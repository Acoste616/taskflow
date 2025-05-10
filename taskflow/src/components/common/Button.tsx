import { Button as ChakraButton } from '@chakra-ui/react';
import type { ButtonProps as ChakraButtonProps } from '@chakra-ui/react';
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';

interface CustomButtonProps {
  customVariant?: ButtonVariant;
  children: React.ReactNode;
}

type ButtonProps = Omit<ChakraButtonProps, 'variant'> & CustomButtonProps;

const Button = ({ customVariant = 'primary', children, ...rest }: ButtonProps) => {
  // Map custom variants to Chakra UI variants and colors
  const getButtonStyles = () => {
    switch (customVariant) {
      case 'primary':
        return {
          colorScheme: 'blue',
          variant: 'solid',
        };
      case 'secondary':
        return {
          colorScheme: 'gray',
          variant: 'solid',
        };
      case 'outline':
        return {
          colorScheme: 'blue',
          variant: 'outline',
        };
      case 'ghost':
        return {
          colorScheme: 'blue',
          variant: 'ghost',
        };
      case 'link':
        return {
          colorScheme: 'blue',
          variant: 'link',
        };
      default:
        return {
          colorScheme: 'blue',
          variant: 'solid',
        };
    }
  };

  const buttonStyles = getButtonStyles();

  return (
    <ChakraButton 
      colorScheme={buttonStyles.colorScheme}
      variant={buttonStyles.variant as any}
      borderRadius="md"
      fontWeight="medium"
      {...rest}
    >
      {children}
    </ChakraButton>
  );
};

export default Button; 