import { Box, Flex, Heading, Button, useColorMode as useChakraColorMode, useColorModeValue as useChakraColorModeValue } from '@chakra-ui/react';
import { FiMoon, FiSun, FiSettings } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';

const Header = () => {
  const { colorMode, toggleColorMode } = useChakraColorMode();
  const bgColor = useChakraColorModeValue('white', 'gray.800');
  const borderColor = useChakraColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box 
      as="header" 
      position="fixed" 
      top="0" 
      width="full" 
      zIndex="10"
      bg={bgColor} 
      boxShadow="sm"
      borderBottomWidth="1px" 
      borderBottomColor={borderColor}
    >
      <Flex 
        justify="space-between" 
        align="center" 
        maxW="container.xl" 
        mx="auto" 
        px={4} 
        py={3}
      >
        <Flex align="center">
          <Heading 
            as="h1" 
            size="md" 
            fontWeight="bold" 
            color="blue.500"
          >
            <Box as={RouterLink} to="/">
              TaskFlow
            </Box>
          </Heading>
        </Flex>
        
        <Flex align="center">
          <Button
            aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
            variant="ghost"
            onClick={toggleColorMode}
            mx={2}
          >
            {colorMode === 'light' ? <FiMoon /> : <FiSun />}
          </Button>
          
          <Button
            as={RouterLink}
            to="/settings"
            aria-label="Settings"
            variant="ghost"
            mx={2}
          >
            <FiSettings />
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header; 