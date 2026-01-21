import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiDownload, FiUser, FiCalendar, FiFileText, FiX } from 'react-icons/fi';
import { formatBytes, formatDate } from '../utils/formatters';
import { API } from '../config';
import './PublicFileView.css';

const PublicFileView = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPublicFile();
  }, [fileId]);

  const fetchPublicFile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/files/public/${fileId}`);
      setFile(res.data.file);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'File not found or not publicly shared');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (file?._id) {
      try {
        // Get download URL from backend (public endpoint - no auth required)
        const response = await fetch(`${API}/files/public/${file._id}/download`);
        const data = await response.json();
        const { url, filename } = data;
        
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
    }
  };

  if (loading) {
    return (
      <div className="public-file-view">
        <div className="public-loading">
          <div className="spinner"></div>
          <p>Loading file...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-file-view">
        <div className="public-error">
          <FiX size={64} />
          <h2>File Not Available</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/login')} className="back-btn">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!file) return null;

  const isImage = file.type === 'image';
  const isVideo = file.type === 'video';
  const isPDF = file.extension === 'pdf';

  return (
    <div className="public-file-view">
      <div className="public-file-container">
        <div className="public-file-header">
          <div className="file-info-header">
            <FiFileText size={32} />
            <div>
              <h1>{file.name}</h1>
              <p className="shared-by">
                <FiUser size={16} />
                Shared by {file.owner?.name || file.owner?.email || 'Unknown'}
              </p>
            </div>
          </div>
          <button onClick={handleDownload} className="download-btn">
            <FiDownload size={20} />
            Download
          </button>
        </div>

        <div className="public-file-content">
          {isImage && (
            <div className="image-preview">
              <img src={file.url} alt={file.name} />
            </div>
          )}

          {isVideo && (
            <div className="video-preview">
              <video controls>
                <source src={file.url} type={`video/${file.extension}`} />
                Your browser does not support video playback.
              </video>
            </div>
          )}

          {isPDF && (
            <div className="pdf-preview">
              <iframe
                src={file.url}
                title={file.name}
                width="100%"
                height="100%"
              />
            </div>
          )}

          {!isImage && !isVideo && !isPDF && (
            <div className="file-placeholder">
              <FiFileText size={64} />
              <p>Preview not available for this file type</p>
              <button onClick={handleDownload} className="download-placeholder-btn">
                Download to view
              </button>
            </div>
          )}
        </div>

        <div className="public-file-details">
          <div className="detail-item">
            <FiFileText size={18} />
            <div>
              <span className="detail-label">Size</span>
              <span className="detail-value">{formatBytes(file.size)}</span>
            </div>
          </div>
          <div className="detail-item">
            <FiCalendar size={18} />
            <div>
              <span className="detail-label">Shared</span>
              <span className="detail-value">{formatDate(file.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="public-file-footer">
          <p>
            Want to store and share your own files?{' '}
            <button onClick={() => navigate('/register')} className="register-link">
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicFileView;
