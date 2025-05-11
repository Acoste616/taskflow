import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useColorMode } from "@chakra-ui/react";
import ForceGraph2D from 'react-force-graph-2d';
import { Box, Text, Spinner, useColorModeValue } from '@chakra-ui/react';
import type { Bookmark } from '../../../models/Bookmark';
import { soundEffectService, SoundEffectType } from '../../../services/soundEffectService';
import * as d3 from 'd3';

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
  vx?: number; // Velocity in x direction (used by d3-force)
  vy?: number; // Velocity in y direction (used by d3-force)
  isFavorite?: boolean;
  favicon?: string;
  tags?: string[];
  type?: string;
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

interface NeuralBookmarkVisualizationProps {
  bookmarks?: Bookmark[];
  onOpenBookmark?: (url: string) => void;
  isLoading?: boolean;
}

// Color mapping for categories (bright, vibrant colors for glow effects)
const CATEGORY_COLORS: Record<string, string> = {
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

// Glow intensities for different states
const GLOW_INTENSITY = {
  normal: 10,
  hover: 25,
  selected: 35
};

const NeuralBookmarkVisualization: React.FC<NeuralBookmarkVisualizationProps> = ({
  bookmarks = [],
  onOpenBookmark,
  isLoading = false
}) => {
  const fgRef = useRef<any>();
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<Link>>(new Set());
  const [hoverNode, setHoverNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [pulse, setPulse] = useState(true);

  // Color settings
  const bgColor = useColorModeValue('#f8fafc', '#0f172a'); // Light blue/gray or dark blue
  const nodeColor = useColorModeValue('#1e293b', '#475569'); // Dark or medium gray

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

    // First create category nodes as central hubs
    categories.forEach(category => {
      const categoryNodeId = `category-${category}`;
      const categoryNode: Node = {
        id: categoryNodeId,
        name: category.toUpperCase(),
        val: 20, // Larger size for category nodes
        color: CATEGORY_COLORS[category] || '#888888',
        url: '',
        category: category,
        type: 'category',
        // Position categories in a semicircle
        x: (Math.random() - 0.5) * 800,
        y: (Math.random() - 0.5) * 800
      };
      nodes.push(categoryNode);
      nodeMap.set(categoryNodeId, categoryNode);
      categoryNodes[category] = categoryNodeId;
    });

    // Create a central hub node
    const hubNode: Node = {
      id: 'hub',
      name: 'BOOKMARKS',
      val: 25,
      color: '#3182CE', // Blue color for the hub
      url: '',
      type: 'hub',
      x: 0,
      y: 0
    };
    nodes.push(hubNode);
    nodeMap.set('hub', hubNode);

    // Link categories to the hub
    categories.forEach(category => {
      links.push({
        source: categoryNodes[category],
        target: 'hub',
        value: 3,
        color: CATEGORY_COLORS[category] || '#888888'
      });
    });

    // Add bookmark nodes and link them to categories
    bookmarks.forEach(bookmark => {
      // Create node for the bookmark
      const bookmarkNode: Node = {
        id: bookmark.id,
        name: bookmark.title,
        val: 5 + (bookmark.isFavorite ? 3 : 0), // Size based on favorite status
        color: bookmark.isFavorite ? '#F6E05E' : nodeColor,
        url: bookmark.url,
        description: bookmark.description,
        isFavorite: bookmark.isFavorite,
        favicon: bookmark.favicon,
        tags: bookmark.tags,
        type: 'bookmark',
        // Initial position in a brain-like shape
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 600
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
            value: 1.5,
            color: CATEGORY_COLORS[category.toLowerCase()] || '#888888'
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
            // Only create links with probability to avoid too many connections
            if (Math.random() < commonTags.length / 10) {
              links.push({
                source: bookmark.id,
                target: otherBookmark.id,
                value: 0.5,
                color: '#a0aec0'
              });
            }
          }
        }
      });
    });

    // Add random connections for more neural network look (limited)
    const randomConnectionCount = Math.min(nodes.length * 0.2, 50);
    for (let i = 0; i < randomConnectionCount; i++) {
      const sourceIndex = Math.floor(Math.random() * nodes.length);
      const targetIndex = Math.floor(Math.random() * nodes.length);
      
      if (sourceIndex !== targetIndex) {
        const source = nodes[sourceIndex];
        const target = nodes[targetIndex];
        
        if (source.type === 'bookmark' && target.type === 'bookmark') {
          links.push({
            source: source.id,
            target: target.id,
            value: 0.3,
            color: '#a0aec0'
          });
        }
      }
    }

    setGraphData({ nodes, links });
  }, [bookmarks, categories, nodeColor]);
  
  // Handle node click
  const handleNodeClick = (node: Node) => {
    if (node.id === selectedNode?.id) {
      setSelectedNode(null);
    } else {
      setSelectedNode(node);
      soundEffectService.play(SoundEffectType.CLICK);
      
      // Zoom to node
      if (fgRef.current) {
        fgRef.current.centerAt(node.x, node.y, 1000);
        fgRef.current.zoom(2, 1000);
      }
      
      // If it's a bookmark (not a category or hub), open it
      if (node.type === 'bookmark' && onOpenBookmark) {
        onOpenBookmark(node.url);
      }
    }
  };

  // Handle node hover
  const handleNodeHover = (node: Node | null) => {
    // Play hover sound if node changed and not null
    if (node && (!hoverNode || node.id !== hoverNode.id)) {
      soundEffectService.play(SoundEffectType.HOVER);
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

  // Apply custom forces to the simulation for brain-like clustering
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      // Get the D3 force simulation
      const simulation = fgRef.current.d3Force();
      
      if (simulation) {
        // Customize forces for more organic, brain-like layout
        simulation
          .force('charge', d3.forceManyBody()
            .strength((d: any) => {
              if (d.type === 'category') return -300;
              if (d.type === 'hub') return -500;
              return -30;
            })
          )
          .force('link', d3.forceLink(graphData.links)
            .id((d: any) => d.id)
            .distance((link: any) => {
              // Make category links longer for better separation
              const source = link.source.type || '';
              const target = link.target.type || '';
              
              if (source === 'category' || target === 'category') return 80;
              if (source === 'hub' || target === 'hub') return 150;
              return 30;
            })
            .strength((link: any) => {
              // Make category links stronger
              const source = link.source.type || '';
              const target = link.target.type || '';
              
              if (source === 'category' || target === 'category') return 0.3;
              if (source === 'hub' || target === 'hub') return 0.4;
              return 0.05;
            })
          )
          .force('center', d3.forceCenter(0, 0).strength(0.05))
          .force('x', d3.forceX(0).strength(0.02))
          .force('y', d3.forceY(0).strength(0.02))
          // Custom clustering force
          .force('cluster', (alpha: number) => {
            const clusterStrength = 0.15;
            
            graphData.nodes.forEach(node => {
              if (node.type === 'bookmark') {
                // Find connected category nodes
                const connectedCategoryIds = graphData.links
                  .filter(link => {
                    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                    
                    return (sourceId === node.id && targetId.startsWith('category-')) || 
                           (targetId === node.id && sourceId.startsWith('category-'));
                  })
                  .map(link => {
                    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                    
                    return sourceId.startsWith('category-') ? sourceId : targetId;
                  });
                  
                if (connectedCategoryIds.length > 0) {
                  // Find actual category nodes
                  const categoryNodes = connectedCategoryIds
                    .map(id => graphData.nodes.find(n => n.id === id))
                    .filter(n => n !== undefined) as Node[];
                  
                  if (categoryNodes.length > 0) {
                    // Calculate center point of connected categories
                    const centerX = categoryNodes.reduce((sum, n) => sum + (n.x || 0), 0) / categoryNodes.length;
                    const centerY = categoryNodes.reduce((sum, n) => sum + (n.y || 0), 0) / categoryNodes.length;
                    
                    // Apply force toward category center
                    if (node.x !== undefined && node.y !== undefined) {
                      node.x = node.x || 0;
                      node.y = node.y || 0;
                      node.vx = node.vx || 0;
                      node.vy = node.vy || 0;
                      
                      node.vx += (centerX - node.x) * alpha * clusterStrength;
                      node.vy += (centerY - node.y) * alpha * clusterStrength;
                    }
                  }
                }
              }
            });
          });
        
        // Reheat the simulation
        simulation.alpha(1).restart();
      }
    }
  }, [graphData]);

  // Custom node rendering with glow effects
  const paintNode = useMemo(() => {
    return (node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (!node.x || !node.y) return; // Skip nodes without position
      
      // Node radius based on value
      const nodeR = Math.sqrt(node.val) * 3;
      
      // Get current time for animation
      const now = Date.now();
      
      // Generate a semi-random pulse based on node id (consistent per node)
      const nodeIdSum = node.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const pulseOffset = nodeIdSum % 2000; // Random offset between 0-2000ms
      const pulsePeriod = 2000 + (nodeIdSum % 1000); // Random period between 2000-3000ms
      
      // Calculate pulse factor (0-1-0) for organic pulsing
      const pulseTime = (now + pulseOffset) % pulsePeriod;
      const pulseFactor = pulse ? 
        Math.sin((pulseTime / pulsePeriod) * Math.PI) * 0.2 + 0.8 : 1; // 0.8-1.0 range
      
      // Apply pulse to radius and glow
      const pulsedRadius = nodeR * pulseFactor;
      
      // Check if this node is highlighted
      const isHighlighted = highlightNodes.has(node.id);
      const isHovered = hoverNode && hoverNode.id === node.id;
      const isSelected = selectedNode && selectedNode.id === node.id;
      
      ctx.save();
      
      // Different rendering based on node type
      if (node.type === 'category' || node.type === 'hub') {
        // Category nodes: larger with strong glow and text
        
        // Create outer glow
        const glowSize = node.type === 'hub' ? 40 : 30;
        const glowIntensity = isHighlighted ? 0.7 : 0.5;
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, glowSize * pulseFactor
        );
        
        gradient.addColorStop(0, `${node.color}ff`); // Full opacity at center
        gradient.addColorStop(0.4, `${node.color}aa`); // Partial opacity
        gradient.addColorStop(1, `${node.color}00`); // Transparent at edge
        
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(node.x, node.y, glowSize * pulseFactor, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw inner circle
        ctx.beginPath();
        ctx.fillStyle = node.color;
        ctx.arc(node.x, node.y, pulsedRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add subtle inner border
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.arc(node.x, node.y, pulsedRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Add text label
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(12, pulsedRadius / 2)}px 'Space Grotesk', Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.name, node.x, node.y);
      } else {
        // Bookmark nodes: smaller with subtle glow
        
        // Determine glow intensity
        let glowIntensity = GLOW_INTENSITY.normal;
        if (isHovered) glowIntensity = GLOW_INTENSITY.hover;
        if (isSelected) glowIntensity = GLOW_INTENSITY.selected;
        
        // Add glow for highlighted nodes
        if (isHighlighted || isHovered || isSelected) {
          const glowColor = isSelected ? '#ffffff' : isHovered ? '#63b3ed' : node.color;
          
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = glowIntensity * pulseFactor;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
        
        // Create gradient fill for bookmark node
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, pulsedRadius
        );
        
        // Determine color based on favorite status
        const mainColor = node.isFavorite ? '#F6E05E' : node.color;
        const secondaryColor = node.isFavorite ? '#FEFCBF' : adjustColor(node.color, 20);
        
        gradient.addColorStop(0, secondaryColor);
        gradient.addColorStop(0.7, mainColor);
        gradient.addColorStop(1, adjustColor(mainColor, -20));
        
        // Draw the node
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(node.x, node.y, pulsedRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add subtle inner border
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.arc(node.x, node.y, pulsedRadius * 0.9, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw favorite indicator (star shape) for favorites
        if (node.isFavorite) {
          const starSize = pulsedRadius * 0.5;
          drawStar(ctx, node.x, node.y, 5, starSize, starSize / 2);
        }
      }
      
      ctx.restore();
    };
  }, [highlightNodes, hoverNode, selectedNode, pulse]);

  // Custom link rendering with glow effects and particles
  const paintLink = useMemo(() => {
    return (link: Link, ctx: CanvasRenderingContext2D) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      // Find source and target nodes
      const source = graphData.nodes.find(node => node.id === sourceId);
      const target = graphData.nodes.find(node => node.id === targetId);
      
      if (!source || !target || !source.x || !source.y || !target.x || !target.y) return;
      
      // Check if link is highlighted
      const isHighlighted = highlightLinks.has(link);
      
      // Calculate distance
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 1) return; // Avoid rendering very short links
      
      ctx.save();
      
      // Determine if this is a category-bookmark link
      const isCategoryLink = sourceId.startsWith('category-') || 
                             targetId.startsWith('category-') ||
                             sourceId === 'hub' || 
                             targetId === 'hub';
      
      // Create gradient for the link
      const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
      const baseColor = link.color || '#a0aec0';
      
      // Set gradient colors with direction based on types
      if (isCategoryLink) {
        if (sourceId.startsWith('category-') || sourceId === 'hub') {
          // Category to bookmark: gradient flows outward
          gradient.addColorStop(0, `${baseColor}bb`); // 73% opacity
          gradient.addColorStop(1, `${baseColor}33`); // 20% opacity
        } else {
          // Bookmark to category: gradient flows inward
          gradient.addColorStop(0, `${baseColor}33`); // 20% opacity
          gradient.addColorStop(1, `${baseColor}bb`); // 73% opacity
        }
      } else {
        // Regular links between bookmarks
        gradient.addColorStop(0, `${baseColor}66`); // 40% opacity
        gradient.addColorStop(0.5, `${baseColor}99`); // 60% opacity
        gradient.addColorStop(1, `${baseColor}66`); // 40% opacity
      }
      
      // Set line style
      ctx.strokeStyle = gradient;
      ctx.lineWidth = isHighlighted ? (link.value * 1.5) : (link.value * 0.7);
      
      // Add glow for highlighted links
      if (isHighlighted) {
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 5;
        ctx.globalAlpha = 0.8;
      } else {
        ctx.globalAlpha = 0.6;
      }
      
      // Draw curved link for longer connections, straight for shorter ones
      ctx.beginPath();
      
      if (distance > 120 && !isHighlighted) {
        // Draw curved line for long connections
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        const curveFactor = 0.2;
        
        // Calculate control point perpendicular to the line
        const cpX = midX - dy * curveFactor;
        const cpY = midY + dx * curveFactor;
        
        ctx.moveTo(source.x, source.y);
        ctx.quadraticCurveTo(cpX, cpY, target.x, target.y);
      } else {
        // Draw straight line for short connections
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
      }
      
      ctx.stroke();
      
      // Add animated particles flowing along the link
      const now = Date.now() / 1000;
      const particleCount = Math.ceil(distance / 25); // One particle every ~25px
      
      // Determine particle flow direction based on node types
      let flowDirection = 1;
      if (sourceId.startsWith('category-') || sourceId === 'hub') {
        flowDirection = -1; // Flow from category/hub to bookmark
      }
      
      for (let i = 0; i < particleCount; i++) {
        // Calculate position along the link with time-based animation
        let t = ((now + i / particleCount) % 1);
        
        // Reverse direction based on flow
        if (flowDirection < 0) {
          t = 1 - t;
        }
        
        let x, y;
        if (distance > 120 && !isHighlighted) {
          // For curved links, calculate position along the curve
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          const curveFactor = 0.2;
          const cpX = midX - dy * curveFactor;
          const cpY = midY + dx * curveFactor;
          
          // Quadratic bezier formula for point at t
          const mt = 1 - t;
          x = mt * mt * source.x + 2 * mt * t * cpX + t * t * target.x;
          y = mt * mt * source.y + 2 * mt * t * cpY + t * t * target.y;
        } else {
          // For straight links, linear interpolation
          x = source.x + dx * t;
          y = source.y + dy * t;
        }
        
        // Draw particle
        ctx.beginPath();
        
        const particleSize = isHighlighted ? 2 : 1.5;
        ctx.fillStyle = isHighlighted ? 
          baseColor : 
          `${baseColor}${Math.round(Math.sin(t * Math.PI) * 128 + 127).toString(16).padStart(2, '0')}`;
        
        ctx.arc(x, y, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    };
  }, [graphData.nodes, highlightLinks]);

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

  // Reset zoom to fit all nodes
  const handleResetZoom = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 50);
    }
  };

  // Set initial zoom when graph data is loaded
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      // Small delay to ensure the graph has rendered
      setTimeout(() => {
        handleResetZoom();
      }, 500);
    }
  }, [graphData]);

  return (
    <Box position="relative" width="100%" height="80vh" bg={bgColor} borderRadius="md" overflow="hidden">
      {isLoading ? (
        <Box height="100%" display="flex" justifyContent="center" alignItems="center">
          <Spinner size="xl" color="blue.500" mr={4} />
          <Text color="gray.500">Loading bookmark network...</Text>
        </Box>
      ) : graphData.nodes.length === 0 ? (
        <Box height="100%" display="flex" justifyContent="center" alignItems="center">
          <Text color="gray.500">No bookmarks to display.</Text>
        </Box>
      ) : (
        <>
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeRelSize={6}
            nodeVal={(node: any) => node.val}
            nodeLabel={undefined} // We'll handle tooltips ourselves
            linkWidth={1} // Base width, actual drawing handled in paintLink
            linkDirectionalParticles={0} // We'll draw our own particles
            linkCurvature={0.25} // Add some curvature to links
            nodeCanvasObject={paintNode}
            linkCanvasObject={paintLink}
            onNodeHover={handleNodeHover}
            onNodeClick={handleNodeClick}
            cooldownTime={5000} // Longer cooldown for more stable layout
            d3AlphaDecay={0.01} // Slower decay for better layout
            d3VelocityDecay={0.1} // Lower value for more organic motion
            warmupTicks={100} // More initial ticks
            cooldownTicks={200} // More final ticks
            enableNodeDrag={true}
            enableZoomInteraction={true}
            enablePanInteraction={true}
            backgroundColor={bgColor}
          />
          
          {/* Node tooltip */}
          {hoverNode && hoverNode.type === 'bookmark' && (
            <Box
              position="absolute"
              top={`${hoverNode.y! + 20}px`}
              left={`${hoverNode.x! + 20}px`}
              bg="rgba(0, 0, 0, 0.8)"
              color="white"
              p={2}
              borderRadius="md"
              boxShadow="lg"
              zIndex={1000}
              maxWidth="250px"
              pointerEvents="none"
            >
              <Text fontWeight="bold">{hoverNode.name}</Text>
              {hoverNode.url && (
                <Text fontSize="xs" color="blue.200" mt={1}>
                  {hoverNode.url}
                </Text>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default NeuralBookmarkVisualization; 