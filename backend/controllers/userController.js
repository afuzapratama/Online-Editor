// backend/controllers/userController.js
const { auth } = require('../config/firebase');
const firestoreService = require('../services/firestoreService');

exports.updateProfile = async (req, res) => {
    try {
        const { displayName } = req.body;
        const userId = req.user.uid;

        if (!displayName) {
            return res.status(400).json({ message: 'Nama tampilan tidak boleh kosong.' });
        }

        // 1. Perbarui nama di Firebase Authentication
        await auth.updateUser(userId, { displayName });

        // 2. Simpan/Perbarui profil di Firestore
        // PERBAIKAN: Menggunakan nama fungsi yang benar 'updateUserProfile'
        await firestoreService.updateUserProfile(userId, { displayName });

        res.json({ message: 'Profil berhasil diperbarui.' });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: 'Gagal memperbarui profil.' });
    }
};
