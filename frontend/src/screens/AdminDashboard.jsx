import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import { FileTree } from '../components/FileTree';
import { apiRequest } from '../utils/api';
import { InputDialog, ConfirmDialog } from '../components/Modal';
import { FaPlus, FaPencilAlt, FaTrash } from 'react-icons/fa';

export const AdminDashboard = ({ onBackToEditor }) => {
  // State untuk data
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  
  // State untuk UI
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFileTree, setUserFileTree] = useState([]);
  const [selectedFileContent, setSelectedFileContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false });

  // Fungsi untuk mengambil semua data awal
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersData, classesData] = await Promise.all([
        apiRequest('/admin/users'),
        apiRequest('/admin/classes')
      ]);
      setUsers(usersData);
      setClasses(classesData);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Efek untuk memfilter daftar murid
  useEffect(() => {
    let results = users;
    if (selectedClassId !== 'all') {
      results = results.filter(user => user.classId === selectedClassId);
    }
    if (searchTerm) {
      results = results.filter(user =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredUsers(results);
  }, [searchTerm, selectedClassId, users]);

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    setUserFileTree([]);
    setSelectedFileContent(null);
    try {
      const data = await apiRequest(`/admin/files/${user.uid}`);
      setUserFileTree(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleFileSelect = async (file) => {
    if (!selectedUser) return;
    try {
        setSelectedFileContent("Memuat konten...");
        const content = await apiRequest(`/admin/file-content/${selectedUser.uid}?path=${encodeURIComponent(file.path)}`);
        setSelectedFileContent(content);
    } catch (error) {
        toast.error(error.message);
        setSelectedFileContent("Gagal memuat konten file.");
    }
  };

  // --- FUNGSI BARU UNTUK MANAJEMEN KELAS ---
  const handleCreateClass = () => {
    setModal({ isOpen: true, type: 'input', props: { title: 'Buat Kelas Baru', onCancel: () => setModal({ isOpen: false }), onConfirm: async (name) => {
      if (!name) return;
      const promise = apiRequest('/admin/classes', 'POST', { name });
      toast.promise(promise, { loading: 'Membuat kelas...', success: 'Kelas berhasil dibuat!', error: 'Gagal membuat kelas.' });
      setModal({ isOpen: false });
      await promise;
      fetchData();
    }}});
  };

  const handleUpdateClass = (cls) => {
    setModal({ isOpen: true, type: 'input', props: { title: `Edit Nama Kelas`, initialValue: cls.name, onCancel: () => setModal({ isOpen: false }), onConfirm: async (name) => {
      if (!name || name === cls.name) return;
      const promise = apiRequest(`/admin/classes/${cls.id}`, 'PUT', { name });
      toast.promise(promise, { loading: 'Memperbarui kelas...', success: 'Kelas berhasil diperbarui!', error: 'Gagal memperbarui kelas.' });
      setModal({ isOpen: false });
      await promise;
      fetchData();
    }}});
  };

  const handleDeleteClass = (cls) => {
    setModal({ isOpen: true, type: 'confirm', props: { title: 'Hapus Kelas', message: `Yakin ingin menghapus kelas "${cls.name}"? Ini akan menghapus kelas dari semua murid yang terdaftar.`, onCancel: () => setModal({ isOpen: false }), onConfirm: async () => {
      const promise = apiRequest(`/admin/classes/${cls.id}`, 'DELETE');
      toast.promise(promise, { loading: 'Menghapus kelas...', success: 'Kelas berhasil dihapus!', error: 'Gagal menghapus kelas.' });
      setModal({ isOpen: false });
      await promise;
      fetchData();
    }}});
  };


  return (
    <div className="w-screen h-screen bg-gray-900 text-gray-300 font-sans flex overflow-hidden">
      {modal.isOpen && modal.type === 'input' && <InputDialog {...modal.props} />}
      {modal.isOpen && modal.type === 'confirm' && <ConfirmDialog {...modal.props} />}

      {/* Panel Kiri (Manajemen) */}
      <div className="w-1/3 max-w-sm bg-gray-800 p-3 border-r border-gray-700 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Dashboard Admin</h2>
          <button onClick={onBackToEditor} className="px-3 py-1 text-sm rounded bg-indigo-600 hover:bg-indigo-500 text-white">
            Kembali
          </button>
        </div>
        
        {/* Bagian Manajemen Kelas */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Manajemen Kelas</h3>
            <button onClick={handleCreateClass} className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300">
              <FaPlus /> Tambah
            </button>
          </div>
          <div className="bg-gray-900/50 p-2 rounded max-h-40 overflow-y-auto">
            {classes.map(cls => (
              <div key={cls.id} className="flex justify-between items-center p-1.5 rounded hover:bg-gray-700">
                <span>{cls.name}</span>
                <div className="flex gap-3">
                  <button onClick={() => handleUpdateClass(cls)} className="text-gray-400 hover:text-yellow-400"><FaPencilAlt /></button>
                  <button onClick={() => handleDeleteClass(cls)} className="text-gray-400 hover:text-red-400"><FaTrash /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bagian Daftar Murid */}
        <h3 className="font-semibold mt-2">Daftar Murid</h3>
        <div className="flex gap-2 my-2">
            <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-1/2 p-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none text-sm"
            >
                <option value="all">Semua Kelas</option>
                {classes.map(cls => ( <option key={cls.id} value={cls.id}>{cls.name}</option> ))}
            </select>
            <input
              type="text"
              placeholder="Cari murid..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-1/2 p-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none text-sm"
            />
        </div>
        <div className="flex-grow overflow-y-auto">
          {isLoading ? <p>Memuat...</p> : (
            filteredUsers.map(user => (
              <div 
                key={user.uid}
                onClick={() => handleUserSelect(user)}
                className={`flex items-center gap-3 p-2 rounded cursor-pointer mb-1 ${selectedUser?.uid === user.uid ? 'bg-blue-600/30' : 'hover:bg-gray-700'}`}
              >
                <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full" />
                <div className="overflow-hidden">
                  <p className="font-semibold truncate">{user.displayName}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Panel File & Pratinjau */}
      <div className="flex-1 flex">
        {selectedUser ? (
          <>
            <div className="w-64 bg-gray-800/50 p-3 border-r border-gray-700 overflow-y-auto">
              <h3 className="text-lg font-bold mb-2">File milik: {selectedUser.displayName}</h3>
              {userFileTree.length > 0 ? (
                <FileTree tree={userFileTree} onFileClick={handleFileSelect} onContextMenu={(e) => e.preventDefault()} />
              ) : (
                <p className="text-gray-500">Pengguna ini belum memiliki file.</p>
              )}
            </div>
            <div className="flex-1 flex flex-col">
                <div className="flex-grow relative bg-gray-900">
                    {selectedFileContent !== null ? (
                        <Editor
                            height="100%"
                            value={selectedFileContent}
                            theme="vs-dark"
                            options={{ readOnly: true, minimap: { enabled: false } }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <p>Pilih file untuk melihat isinya.</p>
                        </div>
                    )}
                </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <p>Pilih seorang murid dari panel kiri untuk memulai.</p>
          </div>
        )}
      </div>
    </div>
  );
};
