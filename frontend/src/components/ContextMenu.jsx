import { useEffect, useRef } from 'react';
import { FiEye, FiEdit2, FiTrash2, FiStar, FiShare2, FiDownload, FiMove, FiCopy } from 'react-icons/fi';
import './ContextMenu.css';

const ContextMenu = ({ x, y, onClose, items, onAction }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  const handleAction = (action) => {
    onAction(action);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ top: `${y}px`, left: `${x}px` }}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={`divider-${index}`} className="context-menu-divider" />;
        }

        const Icon = item.icon;

        return (
          <button
            key={item.label}
            className={`context-menu-item ${item.danger ? 'danger' : ''}`}
            onClick={() => handleAction(item.action)}
            disabled={item.disabled}
          >
            {Icon && <Icon size={16} />}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;
