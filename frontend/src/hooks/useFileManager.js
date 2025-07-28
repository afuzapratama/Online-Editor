import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { apiRequest } from '../utils/api';

export const useFileManager = (user) => {
  const [fileTree, setFileTree] = useState([]);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTabPath, setActiveTabPath] = useState(null);
  const [fileContents, setFileContents] = useState({});
  const [dirtyFiles, setDirtyFiles] = useState(new Set());

  const fetchFileTree = async () => {
    try {
      const data = await apiRequest('/files');
      setFileTree(data);
    } catch { // PERBAIKAN: Hapus parameter 'error' yang tidak terpakai
      toast.error('Gagal memuat file Anda.');
    }
  };

  useEffect(() => {
    if (user) {
      fetchFileTree();
    }
  }, [user]);

  const handleFileClick = async (file) => {
    const isAlreadyOpen = openTabs.some(tab => tab.path === file.path);
    if (!isAlreadyOpen) {
      setOpenTabs(prevTabs => [...prevTabs, file]);
    }
    setActiveTabPath(file.path);

    if (fileContents[file.path] === undefined) {
      try {
        setFileContents(prev => ({ ...prev, [file.path]: "Memuat konten..." }));
        const content = await apiRequest(`/file-content?path=${encodeURIComponent(file.path)}`);
        setFileContents(prev => ({ ...prev, [file.path]: content }));
      } catch {
        setFileContents(prev => ({ ...prev, [file.path]: "Gagal memuat file." }));
      }
    }
    if (window.innerWidth < 768) {
      // This part could be handled by a separate UI state manager if needed
    }
  };

  const handleEditorChange = (value) => {
    if (activeTabPath) {
      setFileContents(prev => ({ ...prev, [activeTabPath]: value }));
      setDirtyFiles(prev => new Set(prev).add(activeTabPath));
    }
  };
  
  const closeTabAction = (path) => {
    const newTabs = openTabs.filter(tab => tab.path !== path);
    setOpenTabs(newTabs);
    const newContents = { ...fileContents };
    delete newContents[path];
    setFileContents(newContents);
    setDirtyFiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(path);
      return newSet;
    });
    if (activeTabPath === path) {
      setActiveTabPath(newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null);
    }
  };

  const showApiResult = (promise, messages, callback) => {
    toast.promise(promise, {
      loading: messages.loading || 'Memproses...',
      success: (data) => {
        fetchFileTree();
        if (callback) callback();
        return messages.success || data.message || 'Berhasil!';
      },
      error: (err) => messages.error || err.toString(),
    });
  };

  return {
    fileTree,
    openTabs,
    activeTabPath,
    setActiveTabPath,
    fileContents,
    dirtyFiles,
    setDirtyFiles, // PERBAIKAN: Ekspor setDirtyFiles
    handleFileClick,
    handleEditorChange,
    closeTabAction,
    showApiResult,
    fetchFileTree
  };
};
