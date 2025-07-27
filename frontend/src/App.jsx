import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut, getAdditionalUserInfo } from "firebase/auth";
import { LoginScreen } from './screens/LoginScreen';
import { EditorScreen } from './screens/EditorScreen';
import { AdminDashboard } from './screens/AdminDashboard';
import { InputDialog } from './components/Modal';

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

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewUserSetup, setIsNewUserSetup] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('editor');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const tokenResult = await currentUser.getIdTokenResult();
        setIsAdmin(tokenResult.claims.role === 'admin');
      } else {
        setIsAdmin(false);
      }
      
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
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ displayName: newName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal memperbarui profil.");
      }
      
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
