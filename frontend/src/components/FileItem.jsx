// src/components/FileItem.jsx
import { useState, useRef, useEffect } from "react";
import { FiMoreVertical, FiTrash2, FiEdit2, FiEye, FiStar, FiRotateCcw, FiShare2, FiDownload } from "react-icons/fi";
import { getFileIcon } from '../utils/formatters';
import axiosInstance from '../api/axiosInstance';
import { API } from '../config';

export default function FileItem({ 
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
  const menuRef = useRef(null);

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
    if (e.target.type === 'checkbox' || e.target.closest('.checkbox-wrapper')) {
      return;
    }
    if (onSelect && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSelect(file._id);
    }
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDownload = async () => {
    try {
      // Get download URL from backend (authenticated request)
      const response = await axiosInstance.get(`/files/${file._id}/download`);
      const { url, filename } = response.data;
      
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
      
      setShowMenu(false);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
      setShowMenu(false);
    }
  };

  // Determine file type based on MIME type or name
  const getFileType = () => {
    const mimeType = file.type || '';
    const fileName = file.name || '';
    
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) return 'pdf';
    if (mimeType.includes('document') || fileName.match(/\.(doc|docx|txt)$/i)) return 'document';
    if (mimeType.includes('spreadsheet') || fileName.match(/\.(xls|xlsx|csv)$/i)) return 'spreadsheet';
    if (mimeType.includes('presentation') || fileName.match(/\.(ppt|pptx)$/i)) return 'presentation';
    if (fileName.match(/\.(zip|rar|7z|tar|gz)$/i)) return 'archive';
    if (fileName.match(/\.(js|jsx|ts|tsx|py|java|cpp|html|css)$/i)) return 'code';
    
    return 'file';
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
      className={`group p-4 border rounded-lg shadow-sm hover:shadow-md transition bg-white flex justify-between items-center relative ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
      onContextMenu={handleContextMenu}
      onClick={handleSelect}
      draggable={!isTrash}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-center gap-3">
        {onSelect && (
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(file._id)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        <div className="text-3xl">
          {getFileIcon(getFileType())}
        </div>

        {isRenaming ? (
          <input
            className="border px-2 py-1 rounded"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') setIsRenaming(false);
            }}
            autoFocus
          />
        ) : (
          <span className="font-medium">{file.name}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!isTrash && onStar && (
          <FiStar
            className={`cursor-pointer ${isStarred || file.isStarred ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
            size={20}
            onClick={(e) => {
              e.stopPropagation();
              onStar(file._id);
            }}
            title={isStarred || file.isStarred ? "Remove from starred" : "Add to starred"}
          />
        )}
        
        <div className="relative" ref={menuRef}>
          <button
            onClick={toggleMenu}
            className="p-1 hover:bg-gray-100 rounded-full transition"
            title="More actions"
          >
            <FiMoreVertical size={20} className="text-gray-600" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 text-sm"
              >
                <FiEye size={16} className="text-blue-600" />
                Preview
              </button>

              {!isTrash && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRenaming(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 text-sm"
                  >
                    <FiEdit2 size={16} className="text-green-600" />
                    Rename
                  </button>

                  {onMove && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMove();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 text-sm"
                    >
                      <FiEdit2 size={16} className="text-blue-600" />
                      Move to...
                    </button>
                  )}

                  {onShare && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShare(file);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 text-sm"
                    >
                      <FiShare2 size={16} className="text-purple-600" />
                      Share
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload();
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 text-sm"
                  >
                    <FiDownload size={16} className="text-indigo-600" />
                    Download
                  </button>

                  <div className="border-t border-gray-200 my-1"></div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(file._id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 text-sm text-red-600"
                  >
                    <FiTrash2 size={16} />
                    Move to Trash
                  </button>
                </>
              )}

              {isTrash && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(file._id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 text-sm text-green-600"
                  >
                    <FiRotateCcw size={16} />
                    Restore
                  </button>

                  {onPermanentDelete && (
                    <>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPermanentDelete(file._id);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 text-sm text-red-600"
                      >
                        <FiTrash2 size={16} />
                        Delete Permanently
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
