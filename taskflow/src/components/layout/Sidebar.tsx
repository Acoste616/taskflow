import { 
  Box, 
  Flex, 
  VStack, 
  Text, 
  Icon, 
  Divider, 
  useColorModeValue,
  Tooltip,
  Badge,
  Collapse,
  useDisclosure,
  IconButton,
  HStack
} from '@chakra-ui/react';
import { NavLink as RouterLink, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiCheckSquare, 
  FiFolder, 
  FiPieChart, 
  FiSettings, 
  FiBookmark,
  FiChevronDown,
  FiChevronRight,
  FiStar,
  FiArchive
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useBookmarkContext } from '../../contexts/BookmarkContext';

// Helper component for sidebar links
interface NavItemProps {
  icon: React.ElementType;
  children: React.ReactNode;
  to: string;
  badge?: number;
  isCollapsible?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const NavItem = ({ 
  icon, 
  children, 
  to, 
  badge,
  isCollapsible,
  isExpanded,
  onToggle 
}: NavItemProps) => {
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.700', 'blue.200');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const location = useLocation();
  const isActive = location.pathname === to;
  
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
      position="relative"
      transition="all 0.2s"
    >
      <Flex align="center" justify="space-between">
        <Flex align="center">
          <Icon 
            as={icon} 
            fontSize="lg" 
            mr={3} 
            color={isActive ? activeColor : undefined}
          />
          <Text fontSize="md">{children}</Text>
        </Flex>
        <HStack spacing={2}>
          {badge !== undefined && badge > 0 && (
            <Badge 
              colorScheme="blue" 
              borderRadius="full" 
              px={2}
              fontSize="xs"
            >
              {badge}
            </Badge>
          )}
          {isCollapsible && (
            <IconButton
              aria-label="Toggle submenu"
              icon={isExpanded ? <FiChevronDown /> : <FiChevronRight />}
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onToggle?.();
              }}
            />
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

// Submenu component for bookmarks
const BookmarkSubmenu = () => {
  const { isOpen, onToggle } = useDisclosure();
  const { favoriteBookmarks, archivedBookmarks } = useBookmarkContext();
  const submenuBg = useColorModeValue('gray.50', 'gray.700');
  
  return (
    <Box>
      <NavItem 
        icon={FiBookmark} 
        to="/bookmarks"
        isCollapsible
        isExpanded={isOpen}
        onToggle={onToggle}
      >
        Bookmarks
      </NavItem>
      <Collapse in={isOpen}>
        <Box pl={8} bg={submenuBg}>
          <NavItem icon={FiStar} to="/bookmarks?view=favorites">
            Favorites
            <Badge ml={2} colorScheme="yellow" borderRadius="full">
              {favoriteBookmarks.length}
            </Badge>
          </NavItem>
          <NavItem icon={FiArchive} to="/bookmarks?view=archived">
            Archive
            <Badge ml={2} colorScheme="gray" borderRadius="full">
              {archivedBookmarks.length}
            </Badge>
          </NavItem>
        </Box>
      </Collapse>
    </Box>
  );
};

const Sidebar = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
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
      transition="all 0.2s"
      boxShadow={isScrolled ? 'sm' : 'none'}
      zIndex="sticky"
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
        
        <BookmarkSubmenu />
        
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