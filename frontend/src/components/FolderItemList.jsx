import { useState } from "react";
import { FiFolder, FiMoreVertical, FiEdit2, FiTrash2 } from "react-icons/fi";
import { formatDate } from '../utils/formatters';
import './FolderItemList.css';

export default function FolderItemList({ 
  folder, 
  openFolder, 
  onRename, 
  onDelete,
  onMove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragTarget = false
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [showMenu, setShowMenu] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);

  const handleRenameSubmit = () => {
    if (onRename && newName.trim()) {
      onRename(folder._id, newName);
      setIsRenaming(false);
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm(`Delete folder "${folder.name}" and all its contents?`)) {
      onDelete(folder._id);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDropTarget(false);
    if (onDrop && isDragTarget) {
      onDrop(e);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDragTarget) {
      setIsDropTarget(true);
      if (onDragOver) {
        onDragOver(e);
      }
    }
  };

  const handleDragLeave = () => {
    setIsDropTarget(false);
  };

  return (
    <div 
      className={`folder-item-list ${isDropTarget ? 'drop-target' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="folder-icon-cell">
        <FiFolder size={24} className="folder-icon-svg" />
      </div>

      <div className="folder-name-cell" onClick={openFolder}>
        {isRenaming ? (
          <input
            className="rename-input-list"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') setIsRenaming(false);
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="folder-name-text">{folder.name}</span>
        )}
      </div>

      <div className="folder-size-cell">
        —
      </div>

      <div className="folder-date-cell">
        {formatDate(folder.updatedAt || folder.createdAt)}
      </div>

      <div className="folder-actions-cell">
        {onRename && onDelete && (
          <>
            <button 
              className="action-btn-list" 
              onClick={() => setIsRenaming(true)} 
              title="Rename"
            >
              <FiEdit2 size={18} />
            </button>
            {onMove && (
              <button 
                className="action-btn-list" 
                onClick={onMove} 
                title="Move to..."
              >
                <FiFolder size={18} />
              </button>
            )}
            <button 
              className="action-btn-list delete" 
              onClick={handleDelete} 
              title="Delete"
            >
              <FiTrash2 size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
