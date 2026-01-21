import React from 'react';
import { FiX, FiDownload } from 'react-icons/fi';
import './FilePreviewModal.css';
import axiosInstance from '../api/axiosInstance';
import { API } from '../config';

const FilePreviewModal = ({ file, onClose }) => {
  if (!file) return null;

  const handleDownload = async () => {
    try {
      // Get download URL from backend (authenticated request)
      const response = await axiosInstance.get(`/files/${file._id}/download`);
      const { url, filename } = response.data;
      
      // Fetch file from Cloudinary as blob
      const fileResponse = await fetch(url);
      const blob = await fileResponse.blob();
      
      // Create blob URL and download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  };

  const renderPreview = () => {
    if (!file.type) {
      return (
        <div className="preview-message">
          <p>Preview not available for this file type</p>
        </div>
      );
    }

    // Image preview
    if (file.type === 'image') {
      return (
        <div className="preview-image-container">
          <img src={file.url} alt={file.name} className="preview-image" />
        </div>
      );
    }

    // Video preview
    if (file.type === 'video') {
      return (
        <div className="preview-video-container">
          <video controls className="preview-video">
            <source src={file.url} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // PDF preview
    if (file.type === 'pdf') {
      return (
        <div className="preview-pdf-container">
          <iframe
            src={file.url}
            title={file.name}
            className="preview-pdf"
          />
        </div>
      );
    }

    // Other file types
    return (
      <div className="preview-message">
        <p>Preview not available for this file type</p>
        <p className="file-info">
          <strong>Name:</strong> {file.name}
        </p>
        <p className="file-info">
          <strong>Type:</strong> {file.extension}
        </p>
        <p className="file-info">
          <strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{file.name}</h3>
          <div className="modal-actions">
            <button
              className="modal-action-btn download-btn"
              onClick={handleDownload}
              title="Download"
            >
              <FiDownload size={20} />
            </button>
            <button
              className="modal-action-btn close-btn"
              onClick={onClose}
              title="Close"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>
        <div className="modal-body">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
