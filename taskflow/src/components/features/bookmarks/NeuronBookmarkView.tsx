import React, { useRef, useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Select, 
  Heading, 
  HStack, 
  Button, 
  useColorModeValue,
  Spinner,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Link,
  Badge,
  IconButton,
  useDisclosure,
  Image,
  VStack,
  Switch,
  FormControl,
  FormLabel,
  Tooltip,
  SimpleGrid,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton
} from '@chakra-ui/react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiZap, FiRefreshCw, FiExternalLink, FiStar, FiInfo, FiTag, FiVolume2, FiVolumeX, FiSettings, FiMoon, FiSun, FiBell, FiCpu } from 'react-icons/fi';
import type { Bookmark } from '../../../models/Bookmark';
import { soundEffectService, SoundEffectType } from '../../../services/soundEffectService';
import { aiBookmarkService } from '../../../services/aiBookmarkService';
import ParticleBackground from './ParticleBackground';
import BookmarkContentAnalysis from './BookmarkContentAnalysis';

// Color mapping for categories
const CATEGORY_COLORS = {
  ai: '#4FD1C5', // teal
  business: '#ED8936', // orange
  development: '#9F7AEA', // purple
  science: '#4299E1', // blue
  entertainment: '#ED64A6', // pink
  health: '#48BB78', // green
  news: '#ECC94B', // yellow
  education: '#76E4F7', // cyan
  twitter: '#1DA1F2', // twitter blue
  youtube: '#FF0000', // youtube red
  github: '#6e6e6e', // github gray
  facebook: '#1877F2', // facebook blue
  linkedin: '#0077B5' // linkedin blue
};

// Glow intensities
const GLOW_INTENSITY = {
  normal: 10,
  hover: 20,
  selected: 25
};

// Animation settings
const PULSE_ANIMATION = {
  duration: 2,
  repeatType: 'reverse' as const,
  repeat: Infinity
};

interface Node {
  id: string;
  name: string;
  val: number;
  color: string;
  url: string;
  category?: string;
  group?: string;
  description?: string;
  x?: number;
  y?: number;
  isFavorite?: boolean;
  favicon?: string;
  tags?: string[];
}

interface Link {
  source: string | Node;
  target: string | Node;
  value: number;
  color?: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface NeuronBookmarkViewProps {
  bookmarks: Bookmark[];
  onOpenBookmark: (url: string) => void;
  isLoading: boolean;
}

// Hook to initialize AudioContext only after user interaction
function useInitAudioContext() {
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  useEffect(() => {
    const initAudio = () => {
      if (!isAudioInitialized) {
        try {
          // Create AudioContext on first user interaction
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            // Just create the context - it becomes the default for the page
            new AudioContextClass();
            setIsAudioInitialized(true);
          }
        } catch (error) {
          console.error('Failed to initialize AudioContext:', error);
        }
      }
    };

    // Add listeners for common user interactions
    const eventTypes = ['click', 'touchstart', 'keydown'];
    eventTypes.forEach(type => window.addEventListener(type, initAudio, { once: true }));

    return () => {
      eventTypes.forEach(type => window.removeEventListener(type, initAudio));
    };
  }, [isAudioInitialized]);

  return isAudioInitialized;
}

const NeuronBookmarkView: React.FC<NeuronBookmarkViewProps> = ({
  bookmarks,
  onOpenBookmark,
  isLoading
}) => {
  const graphRef = useRef<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [pulse, setPulse] = useState(true);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [soundPreset, setSoundPreset] = useState('digital');
  const [useAi, setUseAi] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState<Bookmark[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const settingsDisclosure = useDisclosure();
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const nodeColor = useColorModeValue('#2D3748', '#E2E8F0');
  const bgColor = useColorModeValue('#151a30', '#111111');
  const textColor = useColorModeValue('white', 'white');
  const tooltipBg = 'rgba(0, 0, 0, 0.8)';
  const toast = useToast();

  // Initialize audio only after user interaction
  const isAudioInitialized = useInitAudioContext();

  // Extract categories from bookmarks
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    
    bookmarks.forEach(bookmark => {
      bookmark.tags.forEach(tag => {
        if (Object.keys(CATEGORY_COLORS).includes(tag.toLowerCase())) {
          uniqueCategories.add(tag.toLowerCase());
        }
      });
    });
    
    return Array.from(uniqueCategories);
  }, [bookmarks]);

  // Process bookmarks into graph data
  useEffect(() => {
    if (bookmarks.length === 0) return;

    // Convert bookmarks to nodes and links
    const nodes: Node[] = [];
    const links: Link[] = [];
    const nodeMap = new Map<string, Node>();
    const categoryNodes: Record<string, string> = {};

    // First create category nodes if they don't exist as central hubs
    categories.forEach(category => {
      const categoryNodeId = `category-${category}`;
      const categoryNode: Node = {
        id: categoryNodeId,
        name: category.toUpperCase(),
        val: 15, // Larger size for category nodes
        color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#888888',
        url: '',
        category: category
      };
      nodes.push(categoryNode);
      nodeMap.set(categoryNodeId, categoryNode);
      categoryNodes[category] = categoryNodeId;
    });

    // Create a central hub node
    const hubNode: Node = {
      id: 'hub',
      name: 'BOOKMARKS',
      val: 20,
      color: '#3182CE', // Blue color for the hub
      url: ''
    };
    nodes.push(hubNode);
    nodeMap.set('hub', hubNode);

    // Link categories to the hub
    categories.forEach(category => {
      links.push({
        source: categoryNodes[category],
        target: 'hub',
        value: 5,
        color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#888888'
      });
    });

    // Add bookmark nodes and link them to categories
    bookmarks.forEach(bookmark => {
      // Create node for the bookmark
      const bookmarkNode: Node = {
        id: bookmark.id,
        name: bookmark.title,
        val: 5 + (bookmark.isFavorite ? 5 : 0), // Larger size for favorites
        color: bookmark.isFavorite ? '#F6E05E' : nodeColor, // Yellow for favorites
        url: bookmark.url,
        description: bookmark.description,
        isFavorite: bookmark.isFavorite,
        favicon: bookmark.favicon,
        tags: bookmark.tags
      };
      nodes.push(bookmarkNode);
      nodeMap.set(bookmark.id, bookmarkNode);

      // Determine which categories this bookmark belongs to
      const bookmarkCategories = bookmark.tags.filter(tag => 
        Object.keys(CATEGORY_COLORS).includes(tag.toLowerCase())
      );

      if (bookmarkCategories.length > 0) {
        // Connect to each category it belongs to
        bookmarkCategories.forEach(category => {
          links.push({
            source: bookmark.id,
            target: categoryNodes[category.toLowerCase()],
            value: 2,
            color: CATEGORY_COLORS[category.toLowerCase() as keyof typeof CATEGORY_COLORS] || '#888888'
          });
        });
      } else {
        // If no category, connect directly to hub
        links.push({
          source: bookmark.id,
          target: 'hub',
          value: 1,
          color: '#888888'
        });
      }

      // Add connections between bookmarks with similar tags (other than categories)
      bookmarks.forEach(otherBookmark => {
        if (bookmark.id !== otherBookmark.id) {
          const commonTags = bookmark.tags.filter(tag => 
            otherBookmark.tags.includes(tag) && 
            !Object.keys(CATEGORY_COLORS).includes(tag.toLowerCase())
          );
          
          if (commonTags.length > 0) {
            links.push({
              source: bookmark.id,
              target: otherBookmark.id,
              value: commonTags.length,
              color: '#CBD5E0' // Light gray for tag connections
            });
          }
        }
      });
    });

    setGraphData({ nodes, links });
  }, [bookmarks, categories, nodeColor]);

  // Filter graph data based on selected category
  const filteredGraphData = useMemo(() => {
    if (selectedCategory === 'all') return graphData;

    const categoryNodeId = `category-${selectedCategory}`;
    const connectedNodeIds = new Set<string>([categoryNodeId, 'hub']);
    
    graphData.links.forEach(link => {
      if (link.source === categoryNodeId || link.target === categoryNodeId) {
        connectedNodeIds.add(typeof link.source === 'string' ? link.source : link.source.id);
        connectedNodeIds.add(typeof link.target === 'string' ? link.target : link.target.id);
      }
    });

    return {
      nodes: graphData.nodes.filter(node => connectedNodeIds.has(node.id)),
      links: graphData.links.filter(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        return connectedNodeIds.has(sourceId) && connectedNodeIds.has(targetId);
      })
    };
  }, [graphData, selectedCategory]);

  // Handle node click to show modal
  const handleNodeClick = (node: Node) => {
    if (node.id === 'hub' || node.id.startsWith('category-')) {
      // If clicking on hub or category, just highlight it
      setSelectedNode(node);
      // Play sound effect
      soundEffectService.play(SoundEffectType.CLICK);
      return;
    }
    
    // Record AI interaction
    if (useAi) {
      aiBookmarkService.recordInteraction(node.id, 'click');
    }
    
    // For bookmark nodes, set selected and show modal
    setSelectedNode(node);
    // Play sound effect
    soundEffectService.play(SoundEffectType.CLICK);
    onOpen();
  };

  // Handle opening the bookmark
  const handleOpenBookmark = (url: string) => {
    // Play sound effect
    soundEffectService.play(SoundEffectType.OPEN);
    onOpenBookmark(url);
    onClose();
  };

  // Handle node hover
  const handleNodeHover = (node: Node | null) => {
    // Play hover sound if node changed and not null
    if (node && (!hoverNode || node.id !== hoverNode.id)) {
      soundEffectService.play(SoundEffectType.HOVER);
      
      // Record AI interaction for hovering on actual bookmarks
      if (useAi && node.id !== 'hub' && !node.id.startsWith('category-')) {
        aiBookmarkService.recordInteraction(node.id, 'hover');
      }
    }
    
    setHoverNode(node);
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());

    if (node) {
      setHighlightNodes(new Set([node.id]));
      
      // Highlight connections
      graphData.links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        
        if (sourceId === node.id || targetId === node.id) {
          setHighlightLinks(prev => new Set([...prev, link]));
          setHighlightNodes(prev => new Set([...prev, sourceId, targetId]));
        }
      });
    }
  };

  // Toggle pulse animation
  const togglePulse = () => {
    setPulse(!pulse);
  };

  // Custom node rendering with glow effects
  const paintNode = useMemo(() => {
    return (node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
      // Node radius
      const nodeR = Math.sqrt(node.val || 5) * 3;
      
      // Get current time for animation
      const now = Date.now();
      
      // Generate a semi-random pulse based on node id (consistent per node)
      // This ensures each node pulses at a slightly different rate
      const nodeIdSum = node.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const pulseOffset = nodeIdSum % 2000; // Random offset between 0-2000ms
      const pulsePeriod = 2000 + (nodeIdSum % 1000); // Random period between 2000-3000ms
      
      // Calculate pulse factor (0-1-0) for organic pulsing
      const pulseTime = (now + pulseOffset) % pulsePeriod;
      const pulseFactor = pulse ? 
        Math.sin((pulseTime / pulsePeriod) * Math.PI) * 0.15 : 0; // Max 15% variation
      
      // Apply pulse to radius and glow
      const pulsedRadius = nodeR * (1 + pulseFactor);
      const pulsedGlow = pulseFactor * 5; // Additional glow during pulse
      
      // Check if this node is highlighted
      const isHighlighted = highlightNodes.has(node.id);
      const isHovered = hoverNode && hoverNode.id === node.id;
      const isSelected = selectedNode && selectedNode.id === node.id;
      
      ctx.save();
      
      // Create gradient fill
      const gradient = ctx.createRadialGradient(
        node.x || 0, node.y || 0, 0,
        node.x || 0, node.y || 0, pulsedRadius
      );
      
      // Determine gradient colors based on node type
      let mainColor = node.color;
      let glowColor = node.color;
      let secondaryColor = adjustColor(node.color, 30);
      
      if (node.id.startsWith('category-')) {
        mainColor = node.color;
        glowColor = node.color;
        secondaryColor = adjustColor(node.color, 60);
      } else if (node.id === 'hub') {
        mainColor = '#3182CE';
        glowColor = '#3182CE';
        secondaryColor = '#64B5F6';
      } else if (node.isFavorite) {
        mainColor = '#F6E05E';
        glowColor = '#FFC000';
        secondaryColor = '#FFEB3B';
      }
      
      // Set gradient colors with more vibrant effect
      gradient.addColorStop(0, secondaryColor);
      gradient.addColorStop(0.6, mainColor);
      gradient.addColorStop(1, adjustColor(mainColor, -20));
      
      // Draw glow effect with stronger intensity
      ctx.beginPath();
      
      // Determine glow intensity
      let glowIntensity = GLOW_INTENSITY.normal;
      if (isHovered) glowIntensity = GLOW_INTENSITY.hover;
      if (isSelected) glowIntensity = GLOW_INTENSITY.selected;
      
      // Enhanced glow with 3D effect and pulsing
      if (isHighlighted || isHovered || isSelected || node.id.startsWith('category-') || node.id === 'hub') {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowIntensity * 1.5 + pulsedGlow;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.arc(node.x || 0, node.y || 0, pulsedRadius * 1.2, 0, 2 * Math.PI, false);
        ctx.fillStyle = adjustColor(glowColor, 20);
        ctx.fill();
      }
      
      // Draw the node with 3D effect
      ctx.beginPath();
      ctx.arc(node.x || 0, node.y || 0, pulsedRadius, 0, 2 * Math.PI, false);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Add subtle inner border for 3D effect
      ctx.beginPath();
      ctx.arc(node.x || 0, node.y || 0, pulsedRadius * 0.85, 0, 2 * Math.PI, false);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // For category nodes, add a double ring
      if (node.id.startsWith('category-') || node.id === 'hub') {
        ctx.beginPath();
        ctx.arc(node.x || 0, node.y || 0, pulsedRadius, 0, 2 * Math.PI, false);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Add second ring
        ctx.beginPath();
        ctx.arc(node.x || 0, node.y || 0, pulsedRadius * 1.2, 0, 2 * Math.PI, false);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // Draw favorite indicator (star shape)
      if (node.id !== 'hub' && !node.id.startsWith('category-') && node.isFavorite) {
        const starSize = pulsedRadius * 0.5;
        drawStar(ctx, node.x || 0, node.y || 0, 5, starSize, starSize / 2);
      }
      
      // Add labels INSIDE the nodes with appropriate sizing
      const displayName = node.name;
      const maxTextWidth = pulsedRadius * 1.5; // Maximum width for text
      
      // Set up text style
      ctx.font = `${Math.max(10, Math.min(14, pulsedRadius / 3))}px 'Space Grotesk', Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      
      // Add shadow to text for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Measure text width
      const textWidth = ctx.measureText(displayName).width;
      
      // If text is too wide, truncate it
      let finalText = displayName;
      if (textWidth > maxTextWidth) {
        const ratio = maxTextWidth / textWidth;
        const numChars = Math.floor(displayName.length * ratio) - 3;
        finalText = displayName.substring(0, numChars) + '...';
      }
      
      // Display node name inside the node
      ctx.fillText(finalText, node.x || 0, node.y || 0);
      
      ctx.restore();
    };
  }, [highlightNodes, hoverNode, selectedNode, pulse]);

  // Helper function to adjust color brightness
  const adjustColor = (color: string, amount: number): string => {
    let usePound = false;
  
    if (color[0] === '#') {
      color = color.slice(1);
      usePound = true;
    }
  
    const num = parseInt(color, 16);
    
    let r = (num >> 16) + amount;
    r = Math.max(Math.min(255, r), 0);
    
    let g = ((num >> 8) & 0x00FF) + amount;
    g = Math.max(Math.min(255, g), 0);
    
    let b = (num & 0x0000FF) + amount;
    b = Math.max(Math.min(255, b), 0);
    
    return (usePound ? '#' : '') + (g | (r << 8) | (b << 16)).toString(16).padStart(6, '0');
  };

  // Draw star shape for favorites
  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = '#FEFCBF';
    ctx.fill();
  };

  // Custom link rendering with glow effects
  const paintLink = useMemo(() => {
    return (link: Link, ctx: CanvasRenderingContext2D) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      // Check if link is highlighted
      const isHighlighted = highlightLinks.has(link);
      
      ctx.save();
      
      // Improved link appearance with gradient
      const start = graphData.nodes.find(node => node.id === sourceId);
      const end = graphData.nodes.find(node => node.id === targetId);
      
      if (start && end && start.x !== undefined && start.y !== undefined && 
          end.x !== undefined && end.y !== undefined) {
        // Create gradient for the link
        const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        const baseColor = link.color || '#CBD5E0';
        
        gradient.addColorStop(0, adjustColor(baseColor, 20) + '40'); // 25% opacity
        gradient.addColorStop(0.5, baseColor + '60'); // 37.5% opacity
        gradient.addColorStop(1, adjustColor(baseColor, -20) + '40'); // 25% opacity
        
        // Set stroke style with gradient
        ctx.strokeStyle = gradient;
        
        // Thinner lines by default, thicker when highlighted
        ctx.lineWidth = isHighlighted ? (link.value || 1) * 1.5 : Math.max(0.5, (link.value || 1) * 0.7);
        
        // Add glow effect for highlighted links
        if (isHighlighted) {
          ctx.shadowColor = baseColor;
          ctx.shadowBlur = 5;
        }
        
        // Draw curved links
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Draw the path
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        
        // For longer connections, create curved lines
        if (dist > 80) {
          // Calculate control points for the curve
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          const curveFactor = 0.3;
          const controlX = midX - dy * curveFactor;
          const controlY = midY + dx * curveFactor;
          
          ctx.quadraticCurveTo(controlX, controlY, end.x, end.y);
        } else {
          // For shorter connections, use straight lines
          ctx.lineTo(end.x, end.y);
        }
        
        ctx.stroke();
        
        // Add subtle pulsing particles along the link if not in zen mode
        if (pulse && !isZenMode) {
          const particleCount = Math.floor(dist / 30);
          const now = Date.now() / 1000;
          
          // For curved connections, we need the control points for particle positioning
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          const curveFactor = 0.3;
          const controlX = midX - dy * curveFactor;
          const controlY = midY + dx * curveFactor;
          
          for (let i = 0; i < particleCount; i++) {
            const t = (now / 3 + i / particleCount) % 1;
            
            let x, y;
            if (dist > 80) {
              // For curved links, calculate position along the curve
              const tt = 1 - t;
              const tt2 = tt * tt;
              const t2 = t * t;
              
              x = tt2 * start.x + 2 * tt * t * controlX + t2 * end.x;
              y = tt2 * start.y + 2 * tt * t * controlY + t2 * end.y;
            } else {
              // For straight links, linear interpolation
              x = start.x + dx * t;
              y = start.y + dy * t;
            }
            
            // Draw pulse particle
            ctx.beginPath();
            const particleSize = isHighlighted ? 2.5 : 1.5;
            ctx.arc(x, y, particleSize, 0, 2 * Math.PI);
            ctx.fillStyle = isHighlighted ? 
              `rgba(255, 255, 255, ${0.7 * Math.sin(t * Math.PI)})` :
              `rgba(255, 255, 255, ${0.5 * Math.sin(t * Math.PI)})`;
            ctx.fill();
          }
        }
      }
      
      ctx.restore();
    };
  }, [graphData.nodes, highlightLinks, pulse, isZenMode]);

  // Reset zoom to fit all nodes
  const handleResetZoom = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (graphRef.current) {
        graphRef.current.zoomToFit(400, 50);
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Set initial zoom when graph data is loaded
  useEffect(() => {
    if (graphRef.current && filteredGraphData.nodes.length > 0) {
      // Small delay to ensure the graph has rendered
      setTimeout(() => {
        graphRef.current.zoomToFit(400, 50);
      }, 500);
    }
  }, [filteredGraphData]);

  // Show tooltip for hovered node
  const renderTooltip = () => {
    if (!hoverNode || !hoverNode.x || !hoverNode.y) return null;
    
    // Don't show tooltip for category nodes
    if (hoverNode.id.startsWith('category-') || hoverNode.id === 'hub') return null;
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            top: `${hoverNode.y + 20}px`,
            left: `${hoverNode.x + 20}px`,
            background: tooltipBg,
            padding: '12px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(255,255,255,0.1)',
            pointerEvents: 'none',
            zIndex: 1000,
            maxWidth: '300px'
          }}
        >
          <Flex align="center" mb={2}>
            {hoverNode.favicon && (
              <Image 
                src={hoverNode.favicon} 
                boxSize="16px" 
                mr={2}
                fallbackSrc="https://via.placeholder.com/16"
                borderRadius="sm" 
              />
            )}
            <Text color="white" fontWeight="bold" fontSize="sm">{hoverNode.name}</Text>
            {hoverNode.isFavorite && <FiStar color="#F6E05E" style={{ marginLeft: '8px' }} />}
          </Flex>
          
          {hoverNode.url && (
            <Text color="white" fontSize="xs" opacity={0.8} mb={1}>{hoverNode.url}</Text>
          )}
          
          {hoverNode.description && (
            <Text color="white" fontSize="xs" mt={1}>{hoverNode.description}</Text>
          )}
          
          {hoverNode.tags && hoverNode.tags.length > 0 && (
            <Flex mt={2} flexWrap="wrap" gap={1}>
              {hoverNode.tags.map(tag => (
                <Badge key={tag} bg="rgba(255,255,255,0.2)" color="white" fontSize="2xs" borderRadius="full" px={1}>
                  {tag}
                </Badge>
              ))}
            </Flex>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  // Toggle sound effects
  const toggleSound = () => {
    const newMuted = soundEffectService.toggleMute();
    setIsMuted(newMuted);
    
    toast({
      title: newMuted ? 'Sound effects muted' : 'Sound effects enabled',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };
  
  // Change sound preset
  const changeSoundPreset = (preset: string) => {
    soundEffectService.setPreset(preset);
    setSoundPreset(preset);
    
    // Play a test sound
    soundEffectService.play(SoundEffectType.SUCCESS);
  };
  
  // Toggle Zen mode
  const toggleZenMode = () => {
    setIsZenMode(!isZenMode);
    
    toast({
      title: !isZenMode ? 'Zen mode activated' : 'Zen mode deactivated',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };
  
  // Toggle AI features
  const toggleAI = () => {
    setUseAi(!useAi);
    
    toast({
      title: !useAi ? 'AI recommendations enabled' : 'AI recommendations disabled',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };
  
  // Get sound settings on component mount
  useEffect(() => {
    const settings = soundEffectService.getSettings();
    setIsMuted(settings.isMuted);
    setSoundPreset(settings.currentPreset);
  }, []);
  
  // Load AI suggestions
  useEffect(() => {
    if (useAi && bookmarks.length > 0) {
      const suggestions = aiBookmarkService.getRecommendedBookmarks(bookmarks, 3);
      setAiSuggestions(suggestions);
    }
  }, [bookmarks, useAi]);

  // Render AI Suggestions panel
  const renderAiSuggestions = () => {
    if (!useAi || aiSuggestions.length === 0) return null;
    
    return (
      <Box 
        position="absolute" 
        right="20px" 
        top="80px" 
        zIndex="10" 
        bg="rgba(0,0,0,0.7)"
        backdropFilter="blur(10px)"
        borderRadius="md"
        p={3}
        border="1px solid rgba(255,255,255,0.1)"
        maxWidth="300px"
      >
        <Flex align="center" mb={2}>
          <FiCpu color="#4FD1C5" style={{ marginRight: '8px' }} />
          <Text fontSize="sm" fontWeight="bold" color={textColor}>AI Suggestions</Text>
        </Flex>
        <VStack align="stretch" spacing={2}>
          {aiSuggestions.map(bookmark => (
            <Box 
              key={bookmark.id}
              p={2}
              borderRadius="md"
              bg="rgba(255,255,255,0.05)"
              _hover={{ bg: "rgba(255,255,255,0.1)" }}
              cursor="pointer"
              onClick={() => {
                // Find the corresponding node and trigger click
                const node = graphData.nodes.find(n => n.id === bookmark.id);
                if (node) {
                  handleNodeClick(node);
                }
              }}
            >
              <Flex align="center">
                {bookmark.favicon && (
                  <Image 
                    src={bookmark.favicon} 
                    boxSize="16px" 
                    mr={2}
                    fallbackSrc="https://via.placeholder.com/16"
                    borderRadius="sm" 
                  />
                )}
                <Text fontSize="xs" noOfLines={1}>{bookmark.title}</Text>
              </Flex>
            </Box>
          ))}
        </VStack>
      </Box>
    );
  };

  // Render settings panel
  const renderSettings = () => {
    return (
      <Popover
        isOpen={settingsDisclosure.isOpen}
        onClose={settingsDisclosure.onClose}
        placement="bottom-end"
        closeOnBlur={true}
      >
        <PopoverTrigger>
          <IconButton
            aria-label="Settings"
            icon={<FiSettings />}
            size="md"
            variant="ghost"
            colorScheme="blue"
            onClick={settingsDisclosure.onOpen}
          />
        </PopoverTrigger>
        <PopoverContent bg="rgba(0,0,0,0.8)" backdropFilter="blur(10px)" borderColor="rgba(255,255,255,0.1)">
          <PopoverArrow bg="rgba(0,0,0,0.8)" />
          <PopoverCloseButton color={textColor} />
          <PopoverHeader borderColor="rgba(255,255,255,0.1)" fontWeight="bold" color={textColor}>
            Network Settings
          </PopoverHeader>
          <PopoverBody>
            <VStack align="stretch" spacing={4}>
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel htmlFor="zen-mode" mb="0" color={textColor} fontSize="sm">
                  <Flex align="center">
                    <FiMoon style={{ marginRight: '8px' }} />
                    Zen Mode
                  </Flex>
                </FormLabel>
                <Switch 
                  id="zen-mode" 
                  isChecked={isZenMode}
                  onChange={toggleZenMode}
                  colorScheme="blue"
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel htmlFor="sound-effects" mb="0" color={textColor} fontSize="sm">
                  <Flex align="center">
                    {isMuted ? <FiVolumeX style={{ marginRight: '8px' }} /> : <FiVolume2 style={{ marginRight: '8px' }} />}
                    Sound Effects
                  </Flex>
                </FormLabel>
                <Switch 
                  id="sound-effects" 
                  isChecked={!isMuted}
                  onChange={toggleSound}
                  colorScheme="blue"
                />
              </FormControl>
              
              {!isMuted && (
                <FormControl>
                  <FormLabel htmlFor="sound-preset" color={textColor} fontSize="sm">
                    Sound Style
                  </FormLabel>
                  <Select
                    id="sound-preset"
                    size="sm"
                    value={soundPreset}
                    onChange={(e) => changeSoundPreset(e.target.value)}
                    bg="rgba(0,0,0,0.3)"
                    borderColor="rgba(255,255,255,0.2)"
                    color={textColor}
                  >
                    <option value="digital">Digital</option>
                    <option value="minimal">Minimal</option>
                    <option value="sci_fi">Sci-Fi</option>
                  </Select>
                </FormControl>
              )}
              
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel htmlFor="ai-features" mb="0" color={textColor} fontSize="sm">
                  <Flex align="center">
                    <FiCpu style={{ marginRight: '8px' }} />
                    AI Features
                  </Flex>
                </FormLabel>
                <Switch 
                  id="ai-features" 
                  isChecked={useAi}
                  onChange={toggleAI}
                  colorScheme="teal"
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel htmlFor="animations" mb="0" color={textColor} fontSize="sm">
                  <Flex align="center">
                    <FiZap style={{ marginRight: '8px' }} />
                    Animations
                  </Flex>
                </FormLabel>
                <Switch 
                  id="animations" 
                  isChecked={pulse}
                  onChange={togglePulse}
                  colorScheme="purple"
                />
              </FormControl>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <Box position="relative" width="100%" height="80vh" bg={bgColor} borderRadius="md" overflow="hidden">
      {/* Particle Background */}
      <ParticleBackground isZenMode={isZenMode} />
      
      <Flex 
        position="absolute" 
        top="0" 
        left="0" 
        right="0" 
        p={4} 
        zIndex="10" 
        justify="space-between"
        align="center"
        bg={`${bgColor}CC`}
        backdropFilter="blur(8px)"
        borderBottom="1px solid rgba(255,255,255,0.1)"
      >
        <HStack spacing={4}>
          <Heading size="md" color={textColor} fontFamily="'Space Grotesk', sans-serif">
            <HStack>
              <FiZap color="#3182CE" />
              <Text>Neural Bookmark Network</Text>
            </HStack>
          </Heading>
          
          <HStack>
            <FiFilter color={textColor} />
            <Select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              size="sm"
              borderRadius="md"
              width="150px"
              color={textColor}
              borderColor="rgba(255,255,255,0.3)"
              _hover={{ borderColor: "rgba(255,255,255,0.5)" }}
              bg="rgba(0,0,0,0.3)"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Select>
          </HStack>
        </HStack>
        
        <HStack>
          {/* Zen Mode Toggle */}
          <Tooltip label={isZenMode ? "Disable Zen Mode" : "Enable Zen Mode"}>
            <IconButton
              aria-label="Toggle Zen Mode"
              icon={isZenMode ? <FiMoon /> : <FiSun />}
              size="md"
              variant="ghost"
              colorScheme={isZenMode ? "purple" : "yellow"}
              onClick={toggleZenMode}
            />
          </Tooltip>
          
          {/* Sound Toggle */}
          <Tooltip label={isMuted ? "Enable Sounds" : "Mute Sounds"}>
            <IconButton
              aria-label="Toggle Sound"
              icon={isMuted ? <FiVolumeX /> : <FiVolume2 />}
              size="md"
              variant="ghost"
              colorScheme={isMuted ? "red" : "blue"}
              onClick={toggleSound}
            />
          </Tooltip>
          
          {/* Settings Panel */}
          {renderSettings()}
          
          <Button
            size="sm"
            leftIcon={<FiZap />}
            variant="outline"
            colorScheme="blue"
            onClick={togglePulse}
          >
            {pulse ? 'Stop Animation' : 'Start Animation'}
          </Button>
          
          <Button
            size="sm"
            leftIcon={<FiRefreshCw />}
            colorScheme="blue"
            onClick={handleResetZoom}
          >
            Reset View
          </Button>
        </HStack>
      </Flex>
      
      {/* AI Suggestions Panel */}
      {renderAiSuggestions()}
      
      {isLoading ? (
        <Flex height="100%" justify="center" align="center">
          <Spinner size="xl" color="blue.500" />
          <Text ml={4} color={textColor}>Loading bookmark network...</Text>
        </Flex>
      ) : filteredGraphData.nodes.length === 0 ? (
        <Flex height="100%" justify="center" align="center" direction="column">
          <Text mb={4} color={textColor}>No bookmarks to display.</Text>
        </Flex>
      ) : (
        <Box position="relative" width="100%" height="100%">
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredGraphData}
            nodeRelSize={6}
            nodeVal={(node: any) => node.val}
            nodeColor={(node: any) => node.color}
            linkWidth={1} // Set to base value, actual drawing handled in paintLink
            linkColor={(link: any) => link.color || '#CBD5E0'}
            nodeLabel={undefined} // Disable default tooltip
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            cooldownTime={isZenMode ? 3000 : 2000}
            linkDirectionalParticles={0} // Disable default particles, we'll draw our own
            nodeCanvasObject={paintNode}
            linkCanvasObject={paintLink}
            enableNodeDrag={true}
            enableZoomInteraction={true}
            enablePanInteraction={true}
            d3AlphaDecay={isZenMode ? 0.01 : 0.02}
            d3VelocityDecay={isZenMode ? 0.3 : 0.2}
            warmupTicks={50}
            cooldownTicks={100}
            backgroundColor={bgColor}
          />
          {hoverNode && renderTooltip()}
        </Box>
      )}
      
      {/* Modal with bookmark details */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay backdropFilter="blur(8px)" />
        <ModalContent 
          bg="rgba(20, 24, 45, 0.95)" 
          color={textColor} 
          borderRadius="xl" 
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.5)"
          border="1px solid rgba(255,255,255,0.1)"
        >
          {selectedNode && (
            <>
              <ModalHeader borderBottomWidth="1px" borderColor="rgba(255,255,255,0.1)">
                <Flex align="center">
                  {selectedNode.favicon && (
                    <Image 
                      src={selectedNode.favicon} 
                      boxSize="24px" 
                      mr={3}
                      fallbackSrc="https://via.placeholder.com/24"
                      borderRadius="sm" 
                    />
                  )}
                  <Text fontFamily="'Space Grotesk', sans-serif">{selectedNode.name}</Text>
                  {selectedNode.isFavorite && <FiStar color="#F6E05E" style={{ marginLeft: '12px' }} />}
                </Flex>
              </ModalHeader>
              <ModalCloseButton color={textColor} />
              
              <ModalBody py={6}>
                <VStack align="start" spacing={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.400" mb={1}>URL</Text>
                    <Link href={selectedNode.url} isExternal color="blue.300" fontSize="md">
                      {selectedNode.url} <FiExternalLink style={{ display: 'inline', marginLeft: '5px' }} />
                    </Link>
                  </Box>
                  
                  {selectedNode.description && (
                    <Box>
                      <Text fontSize="sm" color="gray.400" mb={1}>Description</Text>
                      <Text>{selectedNode.description}</Text>
                    </Box>
                  )}
                  
                  <Box w="100%">
                    <Text fontSize="sm" color="gray.400" mb={1}>Analiza zawartości</Text>
                    <BookmarkContentAnalysis 
                      bookmark={{
                        id: selectedNode.id,
                        title: selectedNode.name,
                        url: selectedNode.url,
                        description: selectedNode.description || '',
                        tags: selectedNode.tags || [],
                        folder: '',
                        favicon: selectedNode.favicon || '',
                        isFavorite: selectedNode.isFavorite || false,
                        isArchived: false,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      }}
                      isOpen={isOpen}
                    />
                  </Box>
                  
                  {selectedNode.tags && selectedNode.tags.length > 0 && (
                    <Box>
                      <Flex align="center" mb={2}>
                        <FiTag style={{ marginRight: '8px' }} />
                        <Text fontSize="sm" color="gray.400">Tags</Text>
                      </Flex>
                      <Flex flexWrap="wrap" gap={2}>
                        {selectedNode.tags.map(tag => (
                          <Badge 
                            key={tag} 
                            colorScheme={
                              Object.keys(CATEGORY_COLORS).includes(tag.toLowerCase()) 
                                ? getCategoryColorScheme(tag.toLowerCase()) 
                                : 'gray'
                            } 
                            borderRadius="full" 
                            px={2} 
                            py={1}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </Flex>
                    </Box>
                  )}
                </VStack>
              </ModalBody>
              
              <ModalFooter borderTopWidth="1px" borderColor="rgba(255,255,255,0.1)">
                <Button 
                  colorScheme="blue" 
                  leftIcon={<FiExternalLink />} 
                  onClick={() => handleOpenBookmark(selectedNode.url)}
                  mr={3}
                >
                  Open Bookmark
                </Button>
                <Button variant="ghost" onClick={onClose}>Close</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Box>
  );
};

// Helper function to map colors to Chakra UI color schemes
const getCategoryColorScheme = (category: string): string => {
  switch(category) {
    case 'ai': return 'teal';
    case 'business': return 'orange';
    case 'development': return 'purple';
    case 'science': return 'blue';
    case 'entertainment': return 'pink';
    case 'health': return 'green';
    case 'news': return 'yellow';
    case 'education': return 'cyan';
    case 'twitter': return 'twitter';
    case 'youtube': return 'red';
    case 'github': return 'gray';
    case 'facebook': return 'facebook';
    case 'linkedin': return 'linkedin';
    default: return 'gray';
  }
};

export default NeuronBookmarkView; 