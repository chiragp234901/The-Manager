import { useState, useRef } from 'react';
import { FiUpload, FiX, FiFile } from 'react-icons/fi';
import axiosInstance from '../api/axiosInstance';
import { formatBytes } from '../utils/formatters';
import './UploadModal.css';

const UploadModal = ({ onClose, currentFolder, onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const validateFiles = (files) => {
    const validFiles = [];
    let errorMsg = '';

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        errorMsg = `File "${file.name}" exceeds 100MB limit`;
        continue;
      }
      validFiles.push(file);
    }

    if (errorMsg) {
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    }

    return validFiles;
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = validateFiles(files);
    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files || []);
    const validFiles = validateFiles(files);
    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderId', currentFolder === 'root' ? '' : currentFolder);

      try {
        setUploadProgress((prev) => ({ ...prev, [i]: 0 }));

        await axiosInstance.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress((prev) => ({ ...prev, [i]: percentCompleted }));
          },
        });

        setUploadProgress((prev) => ({ ...prev, [i]: 100 }));
      } catch (err) {
        setError(`Failed to upload "${file.name}"`);
        setUploadProgress((prev) => ({ ...prev, [i]: -1 }));
      }
    }

    setUploading(false);
    onUploadComplete();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upload-modal-header">
          <h3>Upload Files</h3>
          <button onClick={onClose} className="close-btn">
            <FiX size={24} />
          </button>
        </div>

        <div
          className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <FiUpload size={48} className="upload-icon" />
          <p className="upload-text">
            Drag and drop files here or <span className="upload-link">browse</span>
          </p>
          <p className="upload-hint" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Maximum file size: 100MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {error && (
          <div style={{
            padding: '12px',
            margin: '12px 0',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '4px',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="selected-files">
            <h4>Selected Files ({selectedFiles.length})</h4>
            <div className="file-list">
              {selectedFiles.map((file, index) => (
                <div key={index} className="file-item-upload">
                  <FiFile className="file-icon" />
                  <div className="file-info-upload">
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">{formatBytes(file.size)}</p>
                    {uploadProgress[index] !== undefined && (
                      <div className="upload-progress-bar">
                        <div
                          className="upload-progress-fill"
                          style={{ width: `${uploadProgress[index]}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {!uploading && (
                    <button
                      onClick={() => removeFile(index)}
                      className="remove-file-btn"
                    >
                      <FiX size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="upload-modal-footer">
          <button onClick={onClose} disabled={uploading} className="cancel-btn">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="upload-submit-btn"
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
