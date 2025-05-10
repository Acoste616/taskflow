import { Box } from '@chakra-ui/react';
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <Box minH="100vh">
      <Header />
      <Sidebar />
      <Box
        as="main"
        ml={{ base: 0, md: '250px' }}
        pt="60px"
        transition="margin-left .3s ease-in-out"
      >
        <Box p={6} maxW="container.xl" mx="auto">
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout; 