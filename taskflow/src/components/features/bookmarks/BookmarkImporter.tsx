import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  FormControl,
  FormLabel,
  Textarea,
  useToast,
  IconButton,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Alert,
  AlertIcon,
  Progress,
  Badge,
  Tooltip,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Flex,
  Select,
  Collapse
} from '@chakra-ui/react';
import {
  FiUpload,
  FiChrome,
  FiTwitter,
  FiYoutube,
  FiFacebook,
  FiLink,
  FiPlus,
  FiInfo,
  FiPaperclip,
  FiClipboard,
  FiX,
  FiCheck
} from 'react-icons/fi';
import type { Bookmark } from '../../../models/Bookmark';

type ImportType = 'chrome' | 'twitter' | 'youtube' | 'facebook' | 'general';

// Utility functions for parsing different bookmark formats
const parseBookmarks = (text: string, type: ImportType): Bookmark[] => {
  switch (type) {
    case 'chrome':
      return parseChromeBookmarks(text);
    case 'twitter':
      return parseTwitterBookmarks(text);
    case 'youtube':
      return parseYoutubeBookmarks(text);
    case 'facebook':
      return parseFacebookBookmarks(text);
    case 'general':
      return parseGeneralUrls(text);
    default:
      throw new Error('Unsupported import type');
  }
};

// Parse Chrome bookmarks HTML export
const parseChromeBookmarks = (html: string): Bookmark[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = doc.getElementsByTagName('a');
  
  return Array.from(links).map(link => ({
    id: crypto.randomUUID(),
    title: link.textContent || link.href,
    url: link.href,
    description: '',
    tags: ['imported', 'chrome'],
    folder: '',
    favicon: `https://www.google.com/s2/favicons?domain=${new URL(link.href).hostname}`,
    isFavorite: false,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};

// Parse Twitter/X URLs
const parseTwitterBookmarks = (text: string): Bookmark[] => {
  const urls = extractUrls(text);
  
  return urls
    .filter(url => url.includes('twitter.com') || url.includes('x.com'))
    .map(url => {
      // Try to extract tweet author and ID from the URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const username = pathParts.length > 1 ? pathParts[1] : '';
      const tweetId = pathParts.length > 3 && pathParts[2] === 'status' ? pathParts[3] : '';
      
      return {
        id: crypto.randomUUID(),
        title: username ? `Tweet by @${username}` : 'Twitter post',
        url,
        description: tweetId ? `Tweet ID: ${tweetId}` : '',
        tags: ['imported', 'twitter', 'social-media'],
        folder: 'Twitter',
        favicon: 'https://abs.twimg.com/responsive-web/web/icon-ios.8ea219d08eafdfa41.png',
        isFavorite: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
};

// Parse YouTube URLs
const parseYoutubeBookmarks = (text: string): Bookmark[] => {
  const urls = extractUrls(text);
  
  return urls
    .filter(url => url.includes('youtube.com') || url.includes('youtu.be'))
    .map(url => {
      // Try to extract video ID and title from URL
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get('v') || urlObj.pathname.substring(1);
      
      return {
        id: crypto.randomUUID(),
        title: 'YouTube video', // We don't have the title without API access
        url,
        description: videoId ? `Video ID: ${videoId}` : '',
        tags: ['imported', 'youtube', 'video'],
        folder: 'YouTube',
        favicon: 'https://www.youtube.com/favicon.ico',
        isFavorite: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
};

// Parse Facebook URLs
const parseFacebookBookmarks = (text: string): Bookmark[] => {
  const urls = extractUrls(text);
  
  return urls
    .filter(url => url.includes('facebook.com'))
    .map(url => {
      return {
        id: crypto.randomUUID(),
        title: 'Facebook content',
        url,
        description: '',
        tags: ['imported', 'facebook', 'social-media'],
        folder: 'Facebook',
        favicon: 'https://www.facebook.com/favicon.ico',
        isFavorite: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
};

// General URL parsing
const parseGeneralUrls = (text: string): Bookmark[] => {
  const urls = extractUrls(text);
  return urls.map(url => {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Detect common domains for auto-tagging
    const tags = ['imported'];
    if (domain.includes('github')) tags.push('github', 'development');
    if (domain.includes('stackoverflow')) tags.push('stackoverflow', 'development');
    if (domain.includes('medium')) tags.push('medium', 'article');
    if (domain.includes('linkedin')) tags.push('linkedin', 'professional');
    
    return {
      id: crypto.randomUUID(),
      title: domain,
      url,
      description: '',
      tags,
      folder: '',
      favicon: `https://www.google.com/s2/favicons?domain=${domain}`,
      isFavorite: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
};

// Helper to extract URLs from text
const extractUrls = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

interface BookmarkImporterProps {
  onImport: (bookmarks: Bookmark[]) => void;
}

// Main component for bookmark importing
const BookmarkImporter: React.FC<BookmarkImporterProps> = ({ onImport }) => {
  const { isOpen, onToggle } = useDisclosure();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<ImportType>('general');
  const [file, setFile] = useState<File | null>(null);
  const [urls, setUrls] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const bgColor = useColorModeValue('white', 'gray.800');
  
  // Handle file upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFile(file);
    setIsLoading(true);

    try {
      const text = await file.text();
      const bookmarks = parseBookmarks(text, importType);
      onImport(bookmarks);
      
      toast({
        title: 'Import successful',
        description: `Successfully imported ${bookmarks.length} bookmarks`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import bookmarks',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle pasted URLs
  const handleUrlsPaste = () => {
    if (!urls.trim()) return;

    try {
      const bookmarks = parseBookmarks(urls, importType);
      onImport(bookmarks);
      
      toast({
        title: 'Import successful',
        description: `Successfully imported ${bookmarks.length} bookmarks`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setUrls('');
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import bookmarks',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Reset the import process
  const resetImport = () => {
    setFile(null);
    setUrls('');
    setCurrentStep(1);
  };
  
  return (
    <Box>
      <Button
        leftIcon={<FiUpload />}
        onClick={onToggle}
        variant="outline"
        colorScheme="blue"
      >
        Import Bookmarks
      </Button>

      <Collapse in={isOpen} animateOpacity>
        <Box
          mt={4}
          p={4}
          borderWidth={1}
          borderRadius="md"
          bg={bgColor}
        >
          <VStack spacing={4} align="stretch">
            <Select
              value={importType}
              onChange={(e) => setImportType(e.target.value as ImportType)}
            >
              <option value="general">General URLs</option>
              <option value="chrome">Chrome Bookmarks</option>
              <option value="twitter">Twitter Bookmarks</option>
              <option value="youtube">YouTube Bookmarks</option>
              <option value="facebook">Facebook Bookmarks</option>
            </Select>

            <Box>
              <Text mb={2}>Import from file:</Text>
              <Input
                type="file"
                accept=".html,.txt"
                onChange={handleFileChange}
                isDisabled={isLoading}
              />
            </Box>

            <Box>
              <Text mb={2}>Or paste URLs:</Text>
              <Textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="Paste URLs here (one per line)"
                isDisabled={isLoading}
              />
              <Button
                mt={2}
                leftIcon={<FiLink />}
                onClick={handleUrlsPaste}
                isDisabled={!urls.trim() || isLoading}
                colorScheme="blue"
              >
                Import URLs
              </Button>
            </Box>
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default BookmarkImporter; 