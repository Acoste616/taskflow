import * as storageService from './storageService';

export const exportData = (): void => {
  try {
    // Get data as blob from storage service
    const dataBlob = storageService.exportData();
    
    // Create download link
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    
    // Set file name with date
    const date = new Date().toISOString().split('T')[0];
    link.download = `taskflow_backup_${date}.json`;
    
    // Trigger download
    link.href = url;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export data:', error);
    throw new Error('Failed to export data');
  }
};

export const importData = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        const success = storageService.importData(fileContent);
        resolve(success);
      } catch (error) {
        console.error('Error processing imported file:', error);
        reject(new Error('Failed to import data: Invalid file format'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the file'));
    };
    
    reader.readAsText(file);
  });
};

export const validateImportFile = (file: File): boolean => {
  // Check file extension
  if (!file.name.endsWith('.json')) {
    return false;
  }
  
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return false;
  }
  
  return true;
}; 