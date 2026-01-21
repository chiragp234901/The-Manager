import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { FiEye, FiEdit2, FiTrash2, FiStar, FiShare2, FiDownload, FiRotateCcw } from "react-icons/fi";
import { API } from "../config";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Toolbar from "../components/Toolbar";
import FileItem from "../components/FileItem";
import FolderItem from "../components/FolderItem";
import FileItemList from "../components/FileItemList";
import FolderItemList from "../components/FolderItemList";
import FilePreviewModal from "../components/FilePreviewModal";
import CreateFolderModal from "../components/CreateFolderModal";
import UploadModal from "../components/UploadModal";
import ShareModal from "../components/ShareModal";
import ContextMenu from "../components/ContextMenu";
import BulkActionBar from "../components/BulkActionBar";
import MoveModal from "../components/MoveModal";

import "./MainDashboard.css";

export default function MainDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState("root");
  const [folderPath, setFolderPath] = useState([{ id: "root", name: "My Drive" }]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("my-drive");
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit, setStorageLimit] = useState(5 * 1024 * 1024 * 1024); // 5GB
  const [searchQuery, setSearchQuery] = useState("");

  const [previewFile, setPreviewFile] = useState(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [shareFile, setShareFile] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'date', 'size'
  
  // Context menu and bulk operations
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // Move functionality
  const [moveItem, setMoveItem] = useState(null);
  const [moveItemType, setMoveItemType] = useState(null); // 'file' or 'folder'
  
  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedItemType, setDraggedItemType] = useState(null);


  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Fetch storage usage
  const fetchStorageUsage = async () => {
    try {
      const res = await axiosInstance.get("/files/usage/me");
      setStorageUsed(res.data.used);
      setStorageLimit(res.data.limit);
    } catch (err) {
      console.error("Failed to fetch storage usage:", err);
    }
  };

  // Fetch files + folders
  const fetchData = useCallback(async (folderId = "root", folderName = "My Drive", updateBreadcrumb = true) => {
    try {
      setLoading(true);

      const filesRes = await axiosInstance.get(`/files?folder=${folderId}`);
      const foldersRes = await axiosInstance.get(`/folders?parent=${folderId}`);

      let filteredFiles = filesRes.data.files || [];
      let filteredFolders = foldersRes.data.folders || [];

      // Apply search filter
      if (searchQuery) {
        filteredFiles = filteredFiles.filter((file) =>
          file.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        filteredFolders = filteredFolders.filter((folder) =>
          folder.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setFiles(filteredFiles);
      setFolders(filteredFolders);
      setCurrentFolder(folderId);

      // Update breadcrumb only if navigating manually
      if (updateBreadcrumb) {
        setFolderPath((prev) => [...prev, { id: folderId, name: folderName }]);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchData("root", "My Drive", false);
      fetchStorageUsage();
    }
  }, [user]);

  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      if (activeSection === "my-drive") {
        fetchData(currentFolder, "", false);
      }
      return;
    }

    try {
      setLoading(true);
      const res = await axiosInstance.get(`/files/search/query?q=${encodeURIComponent(query)}`);
      setFiles(res.data.files || []);
      setFolders([]);
      setLoading(false);
    } catch (err) {
      console.error("Search error:", err);
      setLoading(false);
    }
  };

  // Refetch when returning to my-drive without search
  useEffect(() => {
    if (user && activeSection === "my-drive" && !searchQuery) {
      fetchData(currentFolder, "", false);
    }
  }, [user, activeSection, currentFolder, fetchData, searchQuery]);

  // Navigate using breadcrumb
  const goToFolder = (folderId, index) => {
    setFolderPath(folderPath.slice(0, index + 1));
    fetchData(folderId, "", false);
  };

  // Open folder (FolderItem click)
  const openFolder = (folderId, folderName) => {
    fetchData(folderId, folderName);
  };

  // Create folder
  const createFolder = async (folderName) => {
    try {
      const res = await axiosInstance.post("/folders", {
        name: folderName,
        parent: currentFolder === "root" ? null : currentFolder,
      });

      if (res.data) {
        fetchData(currentFolder, "", false);
      }
    } catch (err) {
      console.error("Folder creation failed:", err);
      alert("Failed to create folder. Please try again.");
    }
  };

  // Rename file
  const handleRename = async (fileId, newName) => {
    try {
      const res = await axiosInstance.put(`/files/${fileId}/rename`, { name: newName });

      if (res.data) {
        setFiles((prev) =>
          prev.map((file) => (file._id === fileId ? { ...file, name: newName } : file))
        );
      }
    } catch (err) {
      console.error("Rename error:", err);
    }
  };

  // Delete file (move to trash or restore)
  const handleDelete = async (fileId) => {
    try {
      if (activeSection === "trash") {
        // Restore from trash
        const res = await axiosInstance.put(`/files/${fileId}/restore`);
        if (res.data) {
          setFiles((prev) => prev.filter((file) => file._id !== fileId));
        }
      } else {
        // Move to trash
        const res = await axiosInstance.delete(`/files/${fileId}`);
        if (res.data) {
          setFiles((prev) => prev.filter((file) => file._id !== fileId));
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Rename folder
  const handleFolderRename = async (folderId, newName) => {
    try {
      const res = await axiosInstance.put(`/folders/${folderId}/rename`, { name: newName });

      if (res.data) {
        setFolders((prev) =>
          prev.map((folder) => (folder._id === folderId ? { ...folder, name: newName } : folder))
        );
      }
    } catch (err) {
      console.error("Folder rename error:", err);
      alert("Failed to rename folder. Please try again.");
    }
  };

  // Delete folder
  const handleFolderDelete = async (folderId) => {
    try {
      const res = await axiosInstance.delete(`/folders/${folderId}`);

      if (res.data) {
        setFolders((prev) => prev.filter((folder) => folder._id !== folderId));
      }
    } catch (err) {
      console.error("Folder delete error:", err);
      alert("Failed to delete folder. Please try again.");
    }
  };

  // Permanently delete file
  const handlePermanentDelete = async (fileId) => {
    try {
      const res = await axiosInstance.delete(`/files/${fileId}/permanent`);
      if (res.data) {
        setFiles((prev) => prev.filter((file) => file._id !== fileId));
        fetchStorageUsage();
      }
    } catch (err) {
      console.error("Permanent delete error:", err);
    }
  };

  // Toggle star
  const handleToggleStar = async (fileId) => {
    try {
      const res = await axiosInstance.put(`/files/${fileId}/star`);
      if (res.data) {
        setFiles((prev) =>
          prev.map((file) =>
            file._id === fileId ? { ...file, isStarred: res.data.file.isStarred } : file
          )
        );
      }
    } catch (err) {
      console.error("Star toggle error:", err);
    }
  };

  // Move file or folder
  const handleMove = (item, itemType) => {
    setMoveItem(item);
    setMoveItemType(itemType);
  };

  const handleMoveSuccess = () => {
    // Refresh current view after successful move
    if (activeSection === "my-drive") {
      fetchData(currentFolder, "", false);
    } else {
      handleSectionChange(activeSection);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, item, itemType) => {
    setDraggedItem(item);
    setDraggedItemType(itemType);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetFolder) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem) return;
    
    // Don't allow dropping on itself
    if (draggedItemType === 'folder' && draggedItem._id === targetFolder._id) {
      return;
    }
    
    try {
      if (draggedItemType === 'file') {
        await axiosInstance.put(`/files/${draggedItem._id}/move`, {
          newFolderId: targetFolder._id
        });
      } else if (draggedItemType === 'folder') {
        await axiosInstance.put(`/folders/${draggedItem._id}/move`, {
          newParent: targetFolder._id
        });
      }
      
      // Refresh the current view
      handleMoveSuccess();
    } catch (error) {
      console.error('Failed to move item:', error);
      alert('Failed to move item. Please try again.');
    } finally {
      setDraggedItem(null);
      setDraggedItemType(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedItemType(null);
  };

  // Download file
  const handleDownload = async (file) => {
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
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  };

  // Empty trash
  const handleEmptyTrash = async () => {
    if (!confirm("Permanently delete all files in trash? This cannot be undone.")) {
      return;
    }
    
    try {
      const res = await axiosInstance.delete("/files/trash/empty");
      if (res.data) {
        setFiles([]);
        fetchStorageUsage();
      }
    } catch (err) {
      console.error("Empty trash error:", err);
    }
  };

  // Context menu handlers
  const handleContextMenu = (e, file) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file: file
    });
  };

  const handleContextMenuAction = (action) => {
    if (!contextMenu || !contextMenu.file) return;
    
    const file = contextMenu.file;
    
    switch (action) {
      case 'preview':
        setPreviewFile(file);
        break;
      case 'star':
        handleToggleStar(file._id);
        break;
      case 'share':
        setShareFile(file);
        break;
      case 'download':
        handleDownload(file);
        break;
      case 'move':
        handleMove(file, 'file');
        break;
      case 'rename':
        const newName = prompt('Enter new file name:', file.name);
        if (newName && newName.trim() && newName !== file.name) {
          handleRename(file._id, newName.trim());
        }
        break;
      case 'delete':
        handleDelete(file._id);
        break;
      case 'restore':
        handleDelete(file._id); // In trash context, this restores
        break;
      case 'permanentDelete':
        handlePermanentDelete(file._id);
        break;
      default:
        break;
    }
  };

  // Bulk selection handlers
  const handleFileSelect = (fileId) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  const handleClearSelection = () => {
    setSelectedFiles([]);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedFiles.length} file(s)?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedFiles.map(fileId => axiosInstance.delete(`/files/${fileId}`))
      );
      
      setFiles(prev => prev.filter(file => !selectedFiles.includes(file._id)));
      setSelectedFiles([]);
    } catch (err) {
      console.error("Bulk delete error:", err);
    }
  };

  const handleBulkStar = async () => {
    try {
      await Promise.all(
        selectedFiles.map(fileId => axiosInstance.put(`/files/${fileId}/star`))
      );
      
      // Refresh the current view
      if (activeSection === "my-drive") {
        fetchData(currentFolder, "", false);
      } else {
        handleSectionChange(activeSection);
      }
      
      setSelectedFiles([]);
    } catch (err) {
      console.error("Bulk star error:", err);
    }
  };

  const handleBulkShare = () => {
    // For bulk share, we could show a modal with all selected files
    if (selectedFiles.length > 0) {
      const firstFile = files.find(f => f._id === selectedFiles[0]);
      if (firstFile) {
        setShareFile(firstFile);
      }
    }
  };

  const handleBulkDownload = () => {
    // Download each selected file
    selectedFiles.forEach(fileId => {
      const file = files.find(f => f._id === fileId);
      if (file && file.url) {
        window.open(file.url, '_blank');
      }
    });
  };

  // Handle section change
  const handleSectionChange = async (section) => {
    setActiveSection(section);
    setSearchQuery("");
    setLoading(true);
    setSelectedFiles([]);  // Clear selection when changing sections
    
    try {
      if (section === "my-drive") {
        fetchData("root", "My Drive", false);
      } else if (section === "recent") {
        const res = await axiosInstance.get("/files/recent/all");
        setFiles(res.data.files || []);
        setFolders([]);
        setLoading(false);
      } else if (section === "starred") {
        const [filesRes, foldersRes] = await Promise.all([
          axiosInstance.get("/files/starred/all"),
          axiosInstance.get("/folders/starred/all")
        ]);
        setFiles(filesRes.data.files || []);
        setFolders(foldersRes.data.folders || []);
        setLoading(false);
      } else if (section === "trash") {
        const res = await axiosInstance.get("/files/trash/all");
        setFiles(res.data.files || []);
        setFolders([]);
        setLoading(false);
      } else if (section === "shared") {
        const res = await axiosInstance.get("/files/shared/me");
        setFiles(res.data.files || []);
        setFolders([]);
        setLoading(false);
      } else {
        setFiles([]);
        setFolders([]);
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to load section:", err);
      setLoading(false);
    }
  };

  // Handle upload complete
  const handleUploadComplete = () => {
    fetchData(currentFolder, "", false);
    fetchStorageUsage();
  };

  // Get context menu items based on context
  const getContextMenuItems = (file) => {
    if (activeSection === "trash") {
      return [
        { label: 'Preview', icon: FiEye, action: 'preview' },
        { divider: true },
        { label: 'Restore', icon: FiRotateCcw, action: 'restore' },
        { label: 'Delete Permanently', icon: FiTrash2, action: 'permanentDelete', danger: true },
      ];
    }

    return [
      { label: 'Preview', icon: FiEye, action: 'preview' },
      { label: file?.isStarred ? 'Unstar' : 'Star', icon: FiStar, action: 'star' },
      { label: 'Share', icon: FiShare2, action: 'share' },
      { label: 'Download', icon: FiDownload, action: 'download' },
      { divider: true },
      { label: 'Move to...', icon: FiEdit2, action: 'move' },
      { label: 'Rename', icon: FiEdit2, action: 'rename' },
      { label: 'Move to Trash', icon: FiTrash2, action: 'delete', danger: true },
    ];
  };

  // Sort items with memoization
  const sortedFiles = useMemo(() => {
    const sorted = [...files];
    
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'date') {
      sorted.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    } else if (sortBy === 'size') {
      sorted.sort((a, b) => (b.size || 0) - (a.size || 0));
    }
    
    return sorted;
  }, [files, sortBy]);

  const sortedFolders = useMemo(() => {
    const sorted = [...folders];
    
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'date') {
      sorted.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    }
    
    return sorted;
  }, [folders, sortBy]);

  if (authLoading || loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="main-dashboard">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        storageUsed={storageUsed}
        storageLimit={storageLimit}
      />

      <div className="dashboard-content">
        <Header
          onSearch={handleSearch}
          onUploadClick={() => setShowUploadModal(true)}
        />

        <main className="content-area">
          {activeSection === "my-drive" && (
            <>
              <div className="content-header">
                <div className="breadcrumbs-new">
                  {folderPath.map((item, index) => (
                    <span key={item.id}>
                      <button
                        className="breadcrumb-btn"
                        onClick={() => goToFolder(item.id, index)}
                      >
                        {item.name}
                      </button>
                      {index < folderPath.length - 1 && <span className="separator">/</span>}
                    </span>
                  ))}
                </div>

                <button
                  className="new-folder-btn"
                  onClick={() => setShowCreateFolderModal(true)}
                >
                  + New Folder
                </button>
              </div>

              <Toolbar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />

              {viewMode === 'grid' ? (
                <div className="items-grid">
                  {sortedFolders.map((folder) => (
                    <FolderItem
                      key={folder._id}
                      folder={folder}
                      openFolder={() => openFolder(folder._id, folder.name)}
                      onRename={handleFolderRename}
                      onDelete={handleFolderDelete}
                      onMove={() => handleMove(folder, 'folder')}
                      onDragStart={(e) => handleDragStart(e, folder, 'folder')}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, folder)}
                      onDragEnd={handleDragEnd}
                      isDragTarget={draggedItem && draggedItem._id !== folder._id}
                    />
                  ))}

                  {sortedFiles.map((file) => (
                    <FileItem
                      key={file._id}
                      file={file}
                      onPreview={() => setPreviewFile(file)}
                      onRename={handleRename}
                      onDelete={handleDelete}
                      onStar={handleToggleStar}
                      onShare={setShareFile}
                      onContextMenu={handleContextMenu}
                      onSelect={handleFileSelect}
                      onMove={() => handleMove(file, 'file')}
                      onDragStart={(e) => handleDragStart(e, file, 'file')}
                      onDragEnd={handleDragEnd}
                      isSelected={selectedFiles.includes(file._id)}
                      isStarred={file.isStarred}
                    />
                  ))}
                </div>
              ) : (
                <div className="items-list">
                  <div className="list-header">
                    <div className="header-checkbox"></div>
                    <div className="header-icon"></div>
                    <div className="header-name">Name</div>
                    <div className="header-size">Size</div>
                    <div className="header-date">Modified</div>
                    <div className="header-actions"></div>
                  </div>
                  
                  {sortedFolders.map((folder) => (
                    <FolderItemList
                      key={folder._id}
                      folder={folder}
                      openFolder={() => openFolder(folder._id, folder.name)}
                      onRename={handleFolderRename}
                      onDelete={handleFolderDelete}
                      onMove={() => handleMove(folder, 'folder')}
                      onDragStart={(e) => handleDragStart(e, folder, 'folder')}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, folder)}
                      onDragEnd={handleDragEnd}
                      isDragTarget={draggedItem && draggedItem._id !== folder._id}
                    />
                  ))}

                  {sortedFiles.map((file) => (
                    <FileItemList
                      key={file._id}
                      file={file}
                      onPreview={() => setPreviewFile(file)}
                      onRename={handleRename}
                      onDelete={handleDelete}
                      onStar={handleToggleStar}
                      onShare={setShareFile}
                      onContextMenu={handleContextMenu}
                      onSelect={handleFileSelect}
                      onMove={() => handleMove(file, 'file')}
                      onDragStart={(e) => handleDragStart(e, file, 'file')}
                      onDragEnd={handleDragEnd}
                      isSelected={selectedFiles.includes(file._id)}
                      isStarred={file.isStarred}
                    />
                  ))}
                </div>
              )}

              {folders.length === 0 && files.length === 0 && (
                <div className="empty-state">
                  <p>No files or folders yet</p>
                  <button onClick={() => setShowUploadModal(true)} className="upload-first-btn">
                    Upload your first file
                  </button>
                </div>
              )}
            </>
          )}

          {activeSection !== "my-drive" && (
            <>
              <div className="content-header">
                <h2 className="section-title">
                  {activeSection === "recent" && "Recent"}
                  {activeSection === "starred" && "Starred"}
                  {activeSection === "trash" && "Trash"}
                  {activeSection === "shared" && "Shared with me"}
                </h2>

                {activeSection === "trash" && files.length > 0 && (
                  <button className="empty-trash-btn" onClick={handleEmptyTrash}>
                    Empty Trash
                  </button>
                )}
              </div>

              <Toolbar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />

              {viewMode === "grid" ? (
                <div className="items-grid">
                  {sortedFolders.map((folder) => (
                    <FolderItem
                      key={folder._id}
                      folder={folder}
                      openFolder={() => openFolder(folder._id, folder.name)}
                      onRename={handleFolderRename}
                      onDelete={handleFolderDelete}
                      onMove={() => handleMove(folder, 'folder')}
                      onDragStart={(e) => handleDragStart(e, folder, 'folder')}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, folder)}
                      onDragEnd={handleDragEnd}
                      isDragTarget={draggedItem && draggedItem._id !== folder._id}
                    />
                  ))}

                  {sortedFiles.map((file) => (
                    <FileItem
                      key={file._id}
                      file={file}
                      onPreview={() => setPreviewFile(file)}
                      onRename={handleRename}
                      onDelete={handleDelete}
                      onStar={handleToggleStar}
                      onShare={activeSection !== "trash" ? setShareFile : null}
                      onContextMenu={handleContextMenu}
                      onSelect={handleFileSelect}
                      onMove={activeSection !== "trash" ? () => handleMove(file, 'file') : null}
                      onDragStart={(e) => handleDragStart(e, file, 'file')}
                      onDragEnd={handleDragEnd}
                      onPermanentDelete={activeSection === "trash" ? handlePermanentDelete : null}
                      isTrash={activeSection === "trash"}
                      isSelected={selectedFiles.includes(file._id)}
                      isStarred={file.isStarred}
                    />
                  ))}
                </div>
              ) : (
                <div className="items-list">
                  <div className="list-header">
                    <div className="header-checkbox"></div>
                    <div className="header-icon"></div>
                    <div className="header-name">Name</div>
                    <div className="header-size">Size</div>
                    <div className="header-date">Modified</div>
                    <div className="header-actions"></div>
                  </div>

                  {sortedFolders.map((folder) => (
                    <FolderItemList
                      key={folder._id}
                      folder={folder}
                      openFolder={() => openFolder(folder._id, folder.name)}
                      onRename={handleFolderRename}
                      onDelete={handleFolderDelete}
                      onMove={() => handleMove(folder, 'folder')}
                      onDragStart={(e) => handleDragStart(e, folder, 'folder')}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, folder)}
                      onDragEnd={handleDragEnd}
                      isDragTarget={draggedItem && draggedItem._id !== folder._id}
                    />
                  ))}

                  {sortedFiles.map((file) => (
                    <FileItemList
                      key={file._id}
                      file={file}
                      onPreview={() => setPreviewFile(file)}
                      onRename={handleRename}
                      onDelete={handleDelete}
                      onStar={handleToggleStar}
                      onShare={activeSection !== "trash" ? setShareFile : null}
                      onContextMenu={handleContextMenu}
                      onSelect={handleFileSelect}
                      onMove={activeSection !== "trash" ? () => handleMove(file, 'file') : null}
                      onDragStart={(e) => handleDragStart(e, file, 'file')}
                      onDragEnd={handleDragEnd}
                      onPermanentDelete={activeSection === "trash" ? handlePermanentDelete : null}
                      isTrash={activeSection === "trash"}
                      isSelected={selectedFiles.includes(file._id)}
                      isStarred={file.isStarred}
                    />
                  ))}
                </div>
              )}

              {folders.length === 0 && files.length === 0 && !loading && (
                <div className="empty-state">
                  <p>
                    {activeSection === "recent" && "No recent files"}
                    {activeSection === "starred" && "No starred items"}
                    {activeSection === "trash" && "Trash is empty"}
                    {activeSection === "shared" && "No files shared with you"}
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

      {showCreateFolderModal && (
        <CreateFolderModal
          onCreate={createFolder}
          onClose={() => setShowCreateFolderModal(false)}
        />
      )}

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          currentFolder={currentFolder}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {shareFile && (
        <ShareModal
          file={shareFile}
          onClose={() => setShareFile(null)}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems(contextMenu.file)}
          onClose={() => setContextMenu(null)}
          onAction={handleContextMenuAction}
        />
      )}

      {selectedFiles.length > 0 && (
        <BulkActionBar
          selectedCount={selectedFiles.length}
          onClearSelection={handleClearSelection}
          onDelete={handleBulkDelete}
          onStar={activeSection !== "trash" ? handleBulkStar : null}
          onShare={activeSection !== "trash" ? handleBulkShare : null}
          onDownload={handleBulkDownload}
        />
      )}

      {moveItem && (
        <MoveModal
          isOpen={!!moveItem}
          onClose={() => setMoveItem(null)}
          item={moveItem}
          itemType={moveItemType}
          onMoveSuccess={handleMoveSuccess}
        />
      )}
    </div>
  );
}
