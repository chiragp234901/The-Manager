import { useState } from 'react';
import { FiX, FiMail, FiLink, FiCheck } from 'react-icons/fi';
import axiosInstance from '../api/axiosInstance';
import './ShareModal.css';

const ShareModal = ({ file, onClose }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('viewer');
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState('');
  const [publicLink, setPublicLink] = useState(file?.publicLink || '');
  const [isPublic, setIsPublic] = useState(file?.isPublic || false);
  const [copied, setCopied] = useState(false);

  const handleShare = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('Please enter an email address');
      return;
    }

    setSharing(true);
    setMessage('');

    try {
      const res = await axiosInstance.post(`/files/${file._id}/share`, {
        userEmail: email,
        permission,
      });

      if (res.data) {
        setMessage('File shared successfully!');
        setEmail('');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to share file');
    } finally {
      setSharing(false);
    }
  };

  const handleGeneratePublicLink = async () => {
    try {
      const res = await axiosInstance.post(`/files/${file._id}/public`);
      if (res.data.file) {
        setPublicLink(res.data.file.publicLink);
        setIsPublic(true);
        setMessage('Public link generated!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setMessage('Failed to generate link');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h3>Share "{file.name}"</h3>
          <button onClick={onClose} className="close-btn">
            <FiX size={24} />
          </button>
        </div>

        <div className="share-modal-body">
          {message && (
            <div className={`share-message ${message.includes('Failed') || message.includes('Please') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleShare} className="share-form">
            <div className="form-group">
              <label>Share with user</label>
              <div className="share-input-group">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="share-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Permission</label>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="share-select"
              >
                <option value="viewer">Viewer (can view only)</option>
                <option value="editor">Editor (can edit)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={sharing || !email.trim()}
              className="share-submit-btn"
            >
              {sharing ? 'Sharing...' : 'Share'}
            </button>
          </form>

          <div className="share-divider">
            <span>OR</span>
          </div>

          <div className="public-link-section">
            <label>Public Link</label>
            {isPublic && publicLink ? (
              <div className="link-display">
                <FiLink className="link-icon" />
                <input
                  type="text"
                  value={publicLink}
                  readOnly
                  className="link-input"
                />
                <button
                  onClick={handleCopyLink}
                  className="copy-link-btn"
                >
                  {copied ? <FiCheck size={18} /> : 'Copy'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleGeneratePublicLink}
                className="generate-link-btn"
              >
                Generate Public Link
              </button>
            )}
            <p className="link-help-text">
              Anyone with this link can view this file
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
