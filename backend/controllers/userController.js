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
        await auth.updateUser(userId, { displayName });
        await firestoreService.updateUserProfile(userId, { displayName });
        res.json({ message: 'Profil berhasil diperbarui.' });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: 'Gagal memperbarui profil.' });
    }
};

exports.selectClass = async (req, res) => {
    try {
        const { classId } = req.body;
        const userId = req.user.uid;
        if (!classId) {
            return res.status(400).json({ message: 'ID Kelas tidak boleh kosong.' });
        }
        await firestoreService.updateUserProfile(userId, { classId });
        res.json({ message: 'Kelas berhasil dipilih.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memilih kelas.' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.uid;
        const profile = await firestoreService.getUserProfile(userId);
        res.json(profile || {}); // Kirim objek kosong jika profil null
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil profil pengguna.' });
    }
};
