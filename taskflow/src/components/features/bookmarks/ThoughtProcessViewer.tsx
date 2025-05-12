import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  useColorModeValue,
  Divider
} from '@chakra-ui/react';

interface ThoughtProcessViewerProps {
  thoughtProcess?: {
    initial: string;
    refined: string;
  };
  confidence?: number;
}

const ThoughtProcessViewer: React.FC<ThoughtProcessViewerProps> = ({ 
  thoughtProcess, 
  confidence = 0 
}) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  
  if (!thoughtProcess) {
    return null;
  }
  
  // Funkcja do formatowania myśli z zachowaniem akapitów
  const formatThoughts = (thoughts: string) => {
    if (!thoughts) return null;
    
    return thoughts.split('\n').map((paragraph, index) => (
      paragraph.trim() ? (
        <Text key={index} mb={2}>
          {paragraph}
        </Text>
      ) : <Box key={index} h={2} />
    ));
  };
  
  // Określ kolor etykiety pewności
  const confidenceColor = 
    confidence >= 0.8 ? 'green' :
    confidence >= 0.6 ? 'blue' :
    confidence >= 0.4 ? 'yellow' :
    'red';

  // Check if we have both initial and refined thoughts
  const hasRefinedThoughts = thoughtProcess.refined && thoughtProcess.refined.trim().length > 0;

  return (
    <Box mt={4}>
      <Heading size="sm" mb={3} display="flex" alignItems="center">
        Proces myślowy LLM
        {confidence > 0 && (
          <Badge 
            ml={2} 
            colorScheme={confidenceColor}
            fontSize="0.7em"
          >
            Pewność: {(confidence * 100).toFixed(0)}%
          </Badge>
        )}
      </Heading>
      
      <Accordion allowToggle defaultIndex={[0]}>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontWeight="medium">
                {hasRefinedThoughts ? 'Początkowa analiza' : 'Analiza treści'}
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4} bg={bgColor} borderRadius="md">
            {formatThoughts(thoughtProcess.initial)}
          </AccordionPanel>
        </AccordionItem>

        {hasRefinedThoughts && (
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="medium">
                  Pogłębiona analiza
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} bg={bgColor} borderRadius="md">
              {formatThoughts(thoughtProcess.refined)}
            </AccordionPanel>
          </AccordionItem>
        )}
      </Accordion>
    </Box>
  );
};

export default ThoughtProcessViewer; 