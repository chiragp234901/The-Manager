import { useState, useRef, useEffect } from "react";
import { FiMoreVertical, FiEdit2, FiTrash2 } from "react-icons/fi";

export default function FolderItem({ 
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
  const [showMenu, setShowMenu] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const menuRef = useRef(null);

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div 
      className={`relative flex justify-between items-center p-4 bg-yellow-50 border rounded-lg shadow-sm hover:shadow-md transition ${isDropTarget ? 'ring-2 ring-blue-500 bg-blue-100' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >

      {/* Folder Icon + Name */}
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => openFolder(folder._id)}
      >
        <span className="text-3xl">📁</span>
        <span className="font-semibold text-gray-800">{folder.name}</span>
      </div>

      {/* Menu Button */}
      <div className="relative" ref={menuRef}>
        <button
          className="p-1 hover:bg-gray-200 rounded-full transition"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          title="More actions"
        >
          <FiMoreVertical size={20} className="text-gray-600" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 text-sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowRename(true);
                setShowMenu(false);
              }}
            >
              <FiEdit2 size={16} className="text-green-600" />
              Rename
            </button>

            {onMove && (
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMove();
                  setShowMenu(false);
                }}
              >
                <FiEdit2 size={16} className="text-blue-600" />
                Move to...
              </button>
            )}

            <div className="border-t border-gray-200 my-1"></div>

            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 text-sm text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
                setShowMenu(false);
              }}
            >
              <FiTrash2 size={16} />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {showRename && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40"></div>

          <div className="fixed top-1/2 left-1/2 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-lg z-50">
            <h3 className="text-xl font-semibold mb-4">Rename Folder</h3>

            <input
              type="text"
              className="w-full border px-3 py-2 rounded mb-4"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setShowRename(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => {
                  onRename(folder._id, newName);
                  setShowRename(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40"></div>

          <div className="fixed top-1/2 left-1/2 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-lg z-50">
            <h3 className="text-xl font-semibold mb-2">Delete Folder?</h3>
            <p className="text-gray-600 mb-4">
              This will remove the folder and all files inside it.
            </p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => {
                  onDelete(folder._id);
                  setShowDeleteConfirm(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
