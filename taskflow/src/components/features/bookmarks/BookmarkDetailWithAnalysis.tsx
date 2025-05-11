import React, { useState } from 'react';
import {
  Box,
  Button,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  IconButton,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { FiEdit, FiExternalLink, FiActivity } from 'react-icons/fi';
import EnhancedBookmarkAnalysis from './EnhancedBookmarkAnalysis';
import BookmarkForm from './BookmarkForm';
import type { Bookmark } from '../../../models/Bookmark';

interface BookmarkDetailWithAnalysisProps {
  bookmark: Bookmark;
  onClose: () => void;
  onUpdate: (id: string, bookmark: Partial<Bookmark>) => Promise<void>;
  isOpen: boolean;
  folders: string[];
}

const BookmarkDetailWithAnalysis: React.FC<BookmarkDetailWithAnalysisProps> = ({
  bookmark,
  onClose,
  onUpdate,
  isOpen,
  folders
}) => {
  const toast = useToast();
  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure();
  
  // Update bookmark tags
  const handleUpdateTags = async (bookmarkId: string, tags: string[]) => {
    try {
      await onUpdate(bookmarkId, { tags });
      toast({
        title: 'Tags updated',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Failed to update tags',
        status: 'error',
        duration: 3000,
      });
    }
  };
  
  // Handle bookmark update
  const handleSubmitEdit = async (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await onUpdate(bookmark.id, data);
      toast({
        title: 'Bookmark updated',
        status: 'success',
        duration: 2000,
      });
      onEditClose();
    } catch (error) {
      toast({
        title: 'Failed to update bookmark',
        status: 'error',
        duration: 3000,
      });
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxW="800px">
        <ModalHeader>
          <Flex justify="space-between" align="center">
            <Heading size="md" noOfLines={1}>
              {bookmark.title}
            </Heading>
            <Flex>
              <IconButton
                aria-label="Edit bookmark"
                icon={<FiEdit />}
                variant="ghost"
                mr={2}
                onClick={onEditOpen}
                size="sm"
              />
              <IconButton
                aria-label="Open bookmark"
                icon={<FiExternalLink />}
                variant="ghost"
                as="a"
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
              />
            </Flex>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Tabs variant="soft-rounded" colorScheme="blue">
            <TabList>
              <Tab>
                <Flex align="center">
                  <FiActivity style={{ marginRight: '8px' }} />
                  <span>Analysis</span>
                </Flex>
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <EnhancedBookmarkAnalysis 
                  bookmark={bookmark}
                  onUpdateTags={handleUpdateTags}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
      
      {/* Edit modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Bookmark</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <BookmarkForm
              initialData={bookmark}
              folders={folders}
              onSubmit={handleSubmitEdit}
              onCancel={onEditClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Modal>
  );
};

export default BookmarkDetailWithAnalysis; 