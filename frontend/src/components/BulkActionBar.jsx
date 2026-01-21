import { FiX, FiTrash2, FiStar, FiShare2, FiDownload } from 'react-icons/fi';
import './BulkActionBar.css';

const BulkActionBar = ({ selectedCount, onClearSelection, onDelete, onStar, onShare, onDownload }) => {
  return (
    <div className="bulk-action-bar">
      <div className="bulk-info">
        <span className="selected-count">{selectedCount} selected</span>
        <button className="clear-selection-btn" onClick={onClearSelection}>
          <FiX size={18} />
        </button>
      </div>

      <div className="bulk-actions">
        {onStar && (
          <button className="bulk-action-btn" onClick={onStar} title="Star selected">
            <FiStar size={18} />
            <span>Star</span>
          </button>
        )}

        {onShare && (
          <button className="bulk-action-btn" onClick={onShare} title="Share selected">
            <FiShare2 size={18} />
            <span>Share</span>
          </button>
        )}

        {onDownload && (
          <button className="bulk-action-btn" onClick={onDownload} title="Download selected">
            <FiDownload size={18} />
            <span>Download</span>
          </button>
        )}

        {onDelete && (
          <button className="bulk-action-btn danger" onClick={onDelete} title="Delete selected">
            <FiTrash2 size={18} />
            <span>Delete</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default BulkActionBar;
