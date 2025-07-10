import React, { useState } from 'react';
import { addCategory, addItemToCategory } from './dbUtils';
import styled from 'styled-components';

const FormContainer = styled.div`
  max-width: 600px;
  margin: 40px auto;
  padding: 32px;
  background: #f6f7fa;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(34,34,59,0.08);
`;

const FormTitle = styled.h2`
  text-align: center;
  color: #22223b;
  margin-bottom: 24px;
  font-size: 1.5rem;
  font-weight: 700;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #22223b;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e4ea;
  border-radius: 8px;
  font-size: 1rem;
  background: #fff;
  transition: border-color 0.15s ease;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e4ea;
  border-radius: 8px;
  font-size: 1rem;
  background: #fff;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.15s ease;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
  }
`;

const FileInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e4ea;
  border-radius: 8px;
  font-size: 1rem;
  background: #fff;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e4ea;
  border-radius: 8px;
  font-size: 1rem;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s ease;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
  }
  
  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`;

const UploadButton = styled.button`
  width: 100%;
  padding: 14px 24px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
  
  &:hover {
    background: #1e40af;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.div`
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 500;
  
  ${props => props.type === 'success' && `
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  `}
  
  ${props => props.type === 'error' && `
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  `}
  
  ${props => props.type === 'info' && `
    background: #dbeafe;
    color: #1e40af;
    border: 1px solid #93c5fd;
  `}
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 12px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: #2563eb;
  transition: width 0.3s ease;
  width: ${props => props.progress}%;
`;

function BulkUploadForm() {
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Sports');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [progress, setProgress] = useState(0);
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const categoryOptions = [
    { value: 'Sports', label: 'Sports' },
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Food', label: 'Food' },
    { value: 'Brands', label: 'Brands' },
    { value: 'Other', label: 'Other' }
  ];

  const handlePinSubmit = () => {
    if (pin === '8989') {
      setIsAuthenticated(true);
      setStatus({ type: 'success', message: 'PIN verified! You can now upload.' });
    } else {
      setStatus({ type: 'error', message: 'Incorrect PIN. Please try again.' });
      setPin('');
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (!isAuthenticated) {
      setStatus({ type: 'error', message: 'Please enter the correct PIN first.' });
      return;
    }

    if (!categoryName.trim() || !categoryDescription.trim() || selectedFiles.length === 0) {
      setStatus({ type: 'error', message: 'Please fill in all fields and select at least one image.' });
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setStatus({ type: 'info', message: 'Starting upload...' });

    try {
      // Create category with the selected category type
      setStatus({ type: 'info', message: 'Creating category...' });
      setProgress(10);
      
      const categoryId = await addCategory(categoryName, categoryDescription, selectedCategory);
      
      setStatus({ type: 'info', message: `Category created. Uploading ${selectedFiles.length} images...` });
      setProgress(20);

      // Process each image
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Create item name from filename (remove extension)
        const itemName = file.name.replace(/\.[^/.]+$/, "");
        
        // Create image URL (this would be the path where images are stored)
        const imageUrl = `/uploads/${categoryName.toLowerCase().replace(/\s+/g, '_')}/${file.name}`;
        
        // Add item to category with default index score of 1000
        await addItemToCategory(categoryId, {
          name: itemName,
          picture: imageUrl,
          indexScore: 1000
        });

        // Update progress
        const progressPercent = 20 + ((i + 1) / selectedFiles.length) * 80;
        setProgress(progressPercent);
        setStatus({ 
          type: 'info', 
          message: `Uploaded ${i + 1} of ${selectedFiles.length} images...` 
        });
      }

      setProgress(100);
      setStatus({ 
        type: 'success', 
        message: `Successfully uploaded category "${categoryName}" to ${selectedCategory} with ${selectedFiles.length} images!` 
      });

      // Reset form
      setCategoryName('');
      setCategoryDescription('');
      setSelectedCategory('Sports');
      setSelectedFiles([]);

    } catch (error) {
      console.error('Upload error:', error);
      setStatus({ 
        type: 'error', 
        message: `Upload failed: ${error.message}` 
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <FormContainer>
      <FormTitle>Bulk Category Upload</FormTitle>
      
      {!isAuthenticated ? (
        <>
          <FormGroup>
            <Label htmlFor="pin">Enter PIN to Access Upload</Label>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              onKeyPress={(e) => e.key === 'Enter' && handlePinSubmit()}
            />
          </FormGroup>

          <UploadButton 
            onClick={handlePinSubmit} 
            disabled={isUploading}
          >
            Verify PIN
          </UploadButton>
        </>
      ) : (
        <>
          <FormGroup>
            <Label htmlFor="categoryName">Category Name</Label>
            <Input
              id="categoryName"
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Enter category name"
              disabled={isUploading}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="categoryDescription">Category Description</Label>
            <TextArea
              id="categoryDescription"
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
              placeholder="Enter category description"
              disabled={isUploading}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="categoryType">Category Type</Label>
            <Select
              id="categoryType"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={isUploading}
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="images">Images</Label>
            <FileInput
              id="images"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            {selectedFiles.length > 0 && (
              <div style={{ marginTop: 8, fontSize: '0.9rem', color: '#666' }}>
                Selected {selectedFiles.length} image(s)
              </div>
            )}
          </FormGroup>

          <UploadButton 
            onClick={handleUpload} 
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Category'}
          </UploadButton>
        </>
      )}

      {isUploading && (
        <ProgressBar>
          <ProgressFill progress={progress} />
        </ProgressBar>
      )}

      {status.message && (
        <StatusMessage type={status.type}>
          {status.message}
        </StatusMessage>
      )}
    </FormContainer>
  );
}

export default BulkUploadForm; 