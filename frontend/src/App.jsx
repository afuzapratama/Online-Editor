import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut, getAdditionalUserInfo } from "firebase/auth";
import { LoginScreen } from './screens/LoginScreen';
import { EditorScreen } from './screens/EditorScreen';
import { AdminDashboard } from './screens/AdminDashboard';
import { Modal, InputDialog } from './components/Modal';
import { apiRequest } from './utils/api';

// Komponen baru khusus untuk pemilihan kelas
const SelectClassModal = ({ onConfirm, onCancel }) => {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const data = await apiRequest('/classes');
                setClasses(data);
                if (data.length > 0) {
                    setSelectedClass(data[0].id);
                }
            } catch {
                toast.error("Gagal memuat daftar kelas.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchClasses();
    }, []);

    return (
        <Modal>
            <h3 className="text-lg font-semibold mb-4">Pilih Kelas Anda</h3>
            <p className="text-sm text-gray-400 mb-4">Anda harus memilih kelas untuk melanjutkan.</p>
            {isLoading ? <p>Memuat kelas...</p> : (
                <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full p-2 mb-4 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none"
                >
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                </select>
            )}
            <div className="flex justify-end gap-3">
                <button className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white" onClick={onCancel}>Logout</button>
                <button 
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-500" 
                    onClick={() => onConfirm(selectedClass)}
                    disabled={isLoading || !selectedClass}
                >
                    Simpan & Lanjutkan
                </button>
            </div>
        </Modal>
    );
};


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewUserSetup, setIsNewUserSetup] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('editor');
  const [needsToSelectClass, setNeedsToSelectClass] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Cek custom claims untuk peran admin
        const tokenResult = await currentUser.getIdTokenResult();
        const userIsAdmin = tokenResult.claims.role === 'admin';
        setIsAdmin(userIsAdmin);
        
        if (!userIsAdmin) {
            try {
                const profile = await apiRequest('/user/profile');
                if (!profile || !profile.classId) {
                    setNeedsToSelectClass(true);
                } else {
                    setNeedsToSelectClass(false);
                }
            } catch { 
                setNeedsToSelectClass(true);
            }
        } else {
            setNeedsToSelectClass(false);
        }
      } else {
        // Reset semua state jika tidak ada pengguna
        setIsAdmin(false);
        setNeedsToSelectClass(false);
      }
      
      // Hanya perbarui user jika tidak dalam proses setup pengguna baru
      if (!isNewUserSetup) {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isNewUserSetup]);

  const handleProfileUpdate = async (newName) => {
    if (!newName) {
      toast.error("Nama tidak boleh kosong.");
      return;
    }
    const loadingToast = toast.loading("Memperbarui nama...");
    try {
      await apiRequest('/user/profile', 'POST', { displayName: newName });
      
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser }); 

      toast.success("Nama berhasil diperbarui!", { id: loadingToast });
      setIsNewUserSetup(false); 
      setProfileModalOpen(false);

    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    }
  };

  const signInWithGoogle = () => {
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        const additionalInfo = getAdditionalUserInfo(result);
        if (additionalInfo?.isNewUser) {
          setUser(result.user);
          setIsNewUserSetup(true);
        } else {
          // Untuk pengguna lama, onAuthStateChanged akan menangani semuanya
          toast.success(`Selamat datang kembali, ${result.user.displayName}!`);
        }
      })
      .catch((error) => {
        toast.error("Gagal login: " + error.message);
      });
  };

  const signOutUser = () => {
    signOut(auth)
      .then(() => {
        setUser(null);
        setIsNewUserSetup(false);
        setView('editor');
        toast.success("Anda berhasil logout.");
      })
      .catch((error) => {
        toast.error("Gagal logout: " + error.message);
      });
  };

  const handleSelectClass = async (classId) => {
    const loadingToast = toast.loading("Menyimpan kelas...");
    try {
        await apiRequest('/user/select-class', 'POST', { classId });
        toast.success("Kelas berhasil disimpan!", { id: loadingToast });
        setNeedsToSelectClass(false); // Selesaikan alur
    } catch (error) {
        toast.error(error.message, { id: loadingToast });
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="w-screen h-screen bg-gray-900 flex items-center justify-center text-white">Memuat...</div>;
    }

    if (user && isNewUserSetup) {
      return (
        <div className="w-screen h-screen bg-gray-900">
          <InputDialog
            title="Selamat Datang! Silakan atur nama Anda."
            initialValue={user.displayName}
            onCancel={signOutUser}
            onConfirm={handleProfileUpdate}
          />
        </div>
      );
    }
    
    if (user && needsToSelectClass) {
        return (
            <div className="w-screen h-screen bg-gray-900">
                <SelectClassModal
                    onCancel={signOutUser}
                    onConfirm={handleSelectClass}
                />
            </div>
        );
    }
    
    if (user && profileModalOpen) {
       return (
         <>
          <EditorScreen 
            user={user} 
            onSignOut={signOutUser} 
            onUpdateProfile={() => setProfileModalOpen(true)}
            isAdmin={isAdmin}
            onGoToAdmin={() => setView('admin')}
          />
          <InputDialog
            title="Ganti Nama Tampilan Anda"
            initialValue={user.displayName}
            onCancel={() => setProfileModalOpen(false)}
            onConfirm={handleProfileUpdate}
          />
         </>
       );
    }

    if (user) {
      if (view === 'admin' && isAdmin) {
        return <AdminDashboard onBackToEditor={() => setView('editor')} />;
      }
      return <EditorScreen 
                user={user} 
                onSignOut={signOutUser} 
                onUpdateProfile={() => setProfileModalOpen(true)}
                isAdmin={isAdmin}
                onGoToAdmin={() => setView('admin')}
             />;
    }

    return <LoginScreen onSignIn={signInWithGoogle} />;
  };

  return (
    <>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff', }, }} />
      {renderContent()}
    </>
  );
}

export default App;
