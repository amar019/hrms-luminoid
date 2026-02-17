import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, Button, ProgressBar, Alert } from 'react-bootstrap';

const DragDropUpload = ({ onFileUpload, acceptedTypes = {}, maxSize = 5242880, multiple = false }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    setError('');
    
    if (rejectedFiles.length > 0) {
      setError(`File rejected: ${rejectedFiles[0].errors[0].message}`);
      return;
    }

    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await onFileUpload(acceptedFiles);
      
      clearInterval(interval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (err) {
      setError(err.message || 'Upload failed');
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxSize,
    multiple
  });

  return (
    <div>
      <Card 
        {...getRootProps()} 
        className={`drag-drop-zone ${isDragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        style={{ cursor: 'pointer', minHeight: '200px' }}
      >
        <Card.Body className="text-center d-flex flex-column justify-content-center">
          <input {...getInputProps()} />
          
          {uploading ? (
            <>
              <i className="fas fa-cloud-upload-alt fs-1 text-primary mb-3"></i>
              <h5>Uploading...</h5>
              <ProgressBar 
                now={uploadProgress} 
                label={`${uploadProgress}%`}
                className="mb-3"
                style={{ height: '8px' }}
              />
            </>
          ) : isDragActive ? (
            <>
              <i className="fas fa-cloud-upload-alt fs-1 text-success mb-3"></i>
              <h5 className="text-success">Drop files here</h5>
            </>
          ) : (
            <>
              <i className="fas fa-cloud-upload-alt fs-1 text-muted mb-3"></i>
              <h5>Drag & drop files here</h5>
              <p className="text-muted">or click to browse</p>
              <Button variant="outline-primary" size="sm">
                <i className="fas fa-folder-open me-2"></i>
                Browse Files
              </Button>
            </>
          )}
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" className="mt-3">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {acceptedFiles.length > 0 && !uploading && (
        <div className="mt-3">
          <h6>Selected Files:</h6>
          {acceptedFiles.map((file, index) => (
            <div key={index} className="d-flex align-items-center justify-content-between p-2 border rounded mb-2">
              <div>
                <i className="fas fa-file me-2 text-primary"></i>
                <span>{file.name}</span>
                <small className="text-muted ms-2">({(file.size / 1024 / 1024).toFixed(2)} MB)</small>
              </div>
              <i className="fas fa-check-circle text-success"></i>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DragDropUpload;