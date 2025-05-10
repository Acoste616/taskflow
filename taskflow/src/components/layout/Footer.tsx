import { Box, Text, Flex } from '@chakra-ui/react';

const Footer = () => {
  return (
    <Box as="footer" py={4} mt={8}>
      <Flex 
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align="center"
        maxW="container.xl"
        mx="auto"
        px={4}
      >
        <Text fontSize="sm" color="gray.500">
          TaskFlow Personal Edition &copy; {new Date().getFullYear()}
        </Text>
        <Text fontSize="sm" color="gray.500">
          Manage your personal projects with ease
        </Text>
      </Flex>
    </Box>
  );
};

export default Footer; 