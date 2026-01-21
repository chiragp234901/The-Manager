import { FiGrid, FiList, FiChevronDown } from 'react-icons/fi';
import './Toolbar.css';

const Toolbar = ({ viewMode, onViewModeChange, sortBy, onSortChange }) => {
  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'date', label: 'Last modified' },
    { value: 'size', label: 'File size' },
  ];

  return (
    <div className="toolbar">
      <div className="view-toggle">
        <button
          className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => onViewModeChange('grid')}
          title="Grid view"
        >
          <FiGrid size={18} />
        </button>
        <button
          className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => onViewModeChange('list')}
          title="List view"
        >
          <FiList size={18} />
        </button>
      </div>

      <div className="sort-dropdown">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="sort-select"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FiChevronDown className="dropdown-icon" size={16} />
      </div>
    </div>
  );
};

export default Toolbar;
