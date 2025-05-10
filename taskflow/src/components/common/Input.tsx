import {
  FormControl,
  FormLabel,
  Input as ChakraInput,
  FormHelperText,
  FormErrorMessage,
} from '@chakra-ui/react';
import type { InputProps as ChakraInputProps } from '@chakra-ui/react';
import React from 'react';

interface InputProps extends Omit<ChakraInputProps, 'size'> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  isRequired?: boolean;
}

const Input = ({
  label,
  helperText,
  errorMessage,
  isRequired = false,
  size = 'md',
  id,
  ...rest
}: InputProps) => {
  const hasError = !!errorMessage;
  
  return (
    <FormControl isInvalid={hasError} isRequired={isRequired} mb={4}>
      {label && <FormLabel htmlFor={id}>{label}</FormLabel>}
      
      <ChakraInput
        id={id}
        size={size}
        borderRadius="md"
        {...rest}
      />
      
      {helperText && !hasError && (
        <FormHelperText>{helperText}</FormHelperText>
      )}
      
      {hasError && <FormErrorMessage>{errorMessage}</FormErrorMessage>}
    </FormControl>
  );
};

export default Input; 