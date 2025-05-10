import { Box, Flex, VStack, Text, Icon, Divider, useColorModeValue } from '@chakra-ui/react';
import { NavLink as RouterLink } from 'react-router-dom';
import { FiHome, FiCheckSquare, FiFolder, FiPieChart, FiSettings } from 'react-icons/fi';

// Helper component for sidebar links
interface NavItemProps {
  icon: React.ElementType;
  children: React.ReactNode;
  to: string;
}

const NavItem = ({ icon, children, to }: NavItemProps) => {
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.700', 'blue.200');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  
  return (
    <Box
      as={RouterLink}
      to={to}
      display="block"
      w="full"
      py={2}
      px={4}
      borderRadius="md"
      _hover={{ bg: hoverBg }}
      _activeLink={{ bg: activeBg, color: activeColor, fontWeight: 'semibold' }}
    >
      <Flex align="center">
        <Icon as={icon} fontSize="lg" mr={3} />
        <Text fontSize="md">{children}</Text>
      </Flex>
    </Box>
  );
};

const Sidebar = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      as="nav"
      position="fixed"
      left="0"
      top="60px"
      h="calc(100vh - 60px)"
      w="250px"
      bg={bgColor}
      borderRightWidth="1px"
      borderRightColor={borderColor}
      py={6}
      overflowY="auto"
    >
      <VStack spacing={1} align="stretch">
        <NavItem icon={FiHome} to="/">
          Dashboard
        </NavItem>
        <NavItem icon={FiCheckSquare} to="/tasks">
          Tasks
        </NavItem>
        <NavItem icon={FiFolder} to="/projects">
          Projects
        </NavItem>
        <NavItem icon={FiPieChart} to="/analytics">
          Analytics
        </NavItem>
        
        <Divider my={4} />
        
        <NavItem icon={FiSettings} to="/settings">
          Settings
        </NavItem>
      </VStack>
    </Box>
  );
};

export default Sidebar; 