// frontend/src/components/MoveModal.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import './MoveModal.css';

const MoveModal = ({ isOpen, onClose, item, itemType, onMoveSuccess }) => {
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFolders(null);
    }
  }, [isOpen]);

  const loadFolders = async (parent) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/folders${parent ? `?parent=${parent}` : ''}`);
      
      // Filter out the item being moved (can't move into itself)
      const filteredFolders = response.data.folders.filter(folder => 
        !(itemType === 'folder' && folder._id === item._id)
      );
      
      setFolders(filteredFolders);
      setCurrentFolder(parent);
    } catch (error) {
      console.error('Failed to load folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = async (folder) => {
    const newPath = folder ? [...folderPath, { _id: folder._id, name: folder.name }] : [];
    setFolderPath(newPath);
    await loadFolders(folder ? folder._id : null);
  };

  const navigateToPathItem = async (index) => {
    if (index === -1) {
      setFolderPath([]);
      await loadFolders(null);
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setFolderPath(newPath);
      await loadFolders(newPath[newPath.length - 1]._id);
    }
  };

  const handleMove = async () => {
    try {
      const endpoint = itemType === 'file' ? `/files/${item._id}/move` : `/folders/${item._id}/move`;
      const payload = itemType === 'file' 
        ? { newFolderId: currentFolder } 
        : { newParent: currentFolder };

      await axiosInstance.put(endpoint, payload);
      
      onMoveSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to move item:', error);
      alert('Failed to move item. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="move-modal-overlay" onClick={onClose}>
      <div className="move-modal" onClick={(e) => e.stopPropagation()}>
        <div className="move-modal-header">
          <h2>Move "{item?.name}"</h2>
          <button className="move-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="move-modal-body">
          <div className="move-breadcrumb">
            <button onClick={() => navigateToPathItem(-1)} className="breadcrumb-item">
              My Drive
            </button>
            {folderPath.map((folder, index) => (
              <React.Fragment key={folder._id}>
                <span className="breadcrumb-separator">/</span>
                <button onClick={() => navigateToPathItem(index)} className="breadcrumb-item">
                  {folder.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="move-folder-list">
            {loading ? (
              <div className="move-loading">Loading folders...</div>
            ) : folders.length === 0 ? (
              <div className="move-empty">No folders here</div>
            ) : (
              folders.map((folder) => (
                <div
                  key={folder._id}
                  className="move-folder-item"
                  onDoubleClick={() => navigateToFolder(folder)}
                >
                  <span className="folder-icon">📁</span>
                  <span className="folder-name">{folder.name}</span>
                  <button
                    className="folder-enter-btn"
                    onClick={() => navigateToFolder(folder)}
                  >
                    →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="move-modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-move" onClick={handleMove}>
            Move Here
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveModal;
