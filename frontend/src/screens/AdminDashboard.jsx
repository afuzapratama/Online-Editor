import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import { auth } from '../firebase';
import { FileTree } from '../components/FileTree';

// --- DEFINISIKAN BASE URL API DARI .ENV ---
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthHeaders = async () => {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const AdminDashboard = ({ onBackToEditor }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFileTree, setUserFileTree] = useState([]);
  const [selectedFileContent, setSelectedFileContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/admin/users`, { headers });
        if (!response.ok) throw new Error('Gagal mengambil daftar pengguna.');
        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const results = users.filter(user =>
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(results);
  }, [searchTerm, users]);

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    setUserFileTree([]);
    setSelectedFileContent(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/admin/files/${user.uid}`, { headers });
      if (!response.ok) throw new Error('Gagal mengambil file pengguna.');
      const data = await response.json();
      setUserFileTree(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleFileSelect = async (file) => {
    if (!selectedUser) return;
    try {
        setSelectedFileContent("Memuat konten...");
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/admin/file-content/${selectedUser.uid}?path=${encodeURIComponent(file.path)}`, { headers });
        if (!response.ok) throw new Error('Gagal memuat konten file.');
        const content = await response.text();
        setSelectedFileContent(content);
    } catch (error) {
        toast.error(error.message);
        setSelectedFileContent("Gagal memuat konten file.");
    }
  };

  return (
    <div className="w-screen h-screen bg-gray-900 text-gray-300 font-sans flex overflow-hidden">
      <div className="w-80 bg-gray-800 p-3 border-r border-gray-700 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">Dashboard Admin</h2>
          <button onClick={onBackToEditor} className="px-3 py-1 text-sm rounded bg-indigo-600 hover:bg-indigo-500 text-white">
            Kembali
          </button>
        </div>
        <input
          type="text"
          placeholder="Cari nama atau email murid..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 mb-3 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex-grow overflow-y-auto">
          {isLoading ? <p>Memuat daftar murid...</p> : (
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
