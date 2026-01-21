import { useState } from "react";
import { FiMoreVertical, FiTrash2, FiEdit2, FiEye, FiFile, FiStar, FiRotateCcw, FiShare2 } from "react-icons/fi";
import { formatBytes, formatDate, getFileIcon } from '../utils/formatters';
import './FileItemList.css';

export default function FileItemList({ 
  file, 
  onPreview, 
  onRename, 
  onDelete, 
  onStar,
  onPermanentDelete,
  onShare,
  onContextMenu,
  onMove,
  onDragStart,
  onDragEnd,
  isTrash = false,
  isStarred = false,
  isSelected = false,
  onSelect
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const [showMenu, setShowMenu] = useState(false);

  const handleRenameSubmit = () => {
    onRename(file._id, newName);
    setIsRenaming(false);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (onContextMenu) {
      onContextMenu(e, file);
    }
  };

  const handleSelect = (e) => {
    if (e.target.type === 'checkbox' || e.target.closest('.checkbox-cell')) {
      return;
    }
    if (onSelect && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSelect(file._id);
    }
  };

  return (
    <div 
      className={`file-item-list ${isSelected ? 'selected' : ''}`}
      onContextMenu={handleContextMenu}
      onClick={handleSelect}
      draggable={!isTrash}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {onSelect && (
        <div className="checkbox-cell">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(file._id)}
            className="file-checkbox"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className="file-icon-cell">
        <span className="file-emoji">{getFileIcon(file.type)}</span>
      </div>

      <div className="file-name-cell">
        {isRenaming ? (
          <input
            className="rename-input-list"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
            autoFocus
          />
        ) : (
          <span className="file-name-text">{file.name}</span>
        )}
      </div>

      <div className="file-size-cell">
        {formatBytes(file.size || 0)}
      </div>

      <div className="file-date-cell">
        {formatDate(file.updatedAt || file.createdAt)}
      </div>

      <div className="file-actions-cell">
        <button className="action-btn-list" onClick={onPreview} title="Preview">
          <FiEye size={18} />
        </button>
        
        {!isTrash && onStar && (
          <button 
            className="action-btn-list" 
            onClick={() => onStar(file._id)} 
            title={isStarred || file.isStarred ? "Unstar" : "Star"}
          >
            <FiStar 
              size={18} 
              className={isStarred || file.isStarred ? 'text-yellow-500 fill-yellow-500' : ''}
            />
          </button>
        )}

        {!isTrash && (
          <button className="action-btn-list" onClick={() => setIsRenaming(true)} title="Rename">
            <FiEdit2 size={18} />
          </button>
        )}

        {!isTrash && onMove && (
          <button className="action-btn-list" onClick={onMove} title="Move to...">
            <FiFile size={18} />
          </button>
        )}

        {!isTrash && onShare && (
          <button className="action-btn-list" onClick={() => onShare(file)} title="Share">
            <FiShare2 size={18} />
          </button>
        )}

        {isTrash ? (
          <>
            <button 
              className="action-btn-list" 
              onClick={() => onDelete(file._id)} 
              title="Restore"
            >
              <FiRotateCcw size={18} />
            </button>
            {onPermanentDelete && (
              <button 
                className="action-btn-list delete" 
                onClick={() => onPermanentDelete(file._id)} 
                title="Delete Permanently"
              >
                <FiTrash2 size={18} />
              </button>
            )}
          </>
        ) : (
          <button className="action-btn-list delete" onClick={() => onDelete(file._id)} title="Delete">
            <FiTrash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
