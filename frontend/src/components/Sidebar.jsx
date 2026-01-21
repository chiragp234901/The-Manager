import { FiHome, FiClock, FiStar, FiTrash2, FiUsers, FiHardDrive } from 'react-icons/fi';
import { formatBytes } from '../utils/formatters';
import './Sidebar.css';

const Sidebar = ({ activeSection, onSectionChange, storageUsed, storageLimit }) => {
  const menuItems = [
    { id: 'my-drive', label: 'My Drive', icon: FiHome },
    { id: 'recent', label: 'Recent', icon: FiClock },
    { id: 'starred', label: 'Starred', icon: FiStar },
    { id: 'trash', label: 'Trash', icon: FiTrash2 },
    { id: 'shared', label: 'Shared with me', icon: FiUsers },
  ];

  const usagePercentage = (storageUsed / storageLimit) * 100;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <FiHardDrive size={32} className="logo-icon" />
        <h1 className="logo-text">The Manager</h1>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => onSectionChange(item.id)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="storage-info">
        <div className="storage-header">
          <FiHardDrive size={16} />
          <span>Storage</span>
        </div>
        <div className="storage-bar">
          <div 
            className="storage-bar-fill" 
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
        <p className="storage-text">
          {formatBytes(storageUsed)} of {formatBytes(storageLimit)} used
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
