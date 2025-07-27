// backend/controllers/adminController.js
const firestoreService = require('../services/firestoreService');

// Mengambil daftar semua pengguna
exports.getAllUsers = async (req, res) => {
    try {
        const users = await firestoreService.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error("Error fetching all users:", error);
        res.status(500).json({ message: 'Gagal mengambil daftar pengguna.' });
    }
};

// Mengambil struktur file dari pengguna tertentu
exports.getUserFiles = async (req, res) => {
    try {
        const { userId } = req.params;
        const fileTree = await firestoreService.getFiles(userId);
        res.json(fileTree);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data file pengguna.' });
    }
};

// --- FUNGSI BARU ---
// Mengambil isi file dari pengguna tertentu
exports.getUserFileContent = async (req, res) => {
    try {
        const { userId } = req.params;
        const { path } = req.query; // Ambil path file dari query parameter
        const content = await firestoreService.getFileContent(userId, path);
        res.send(content);
    } catch (error) {
        res.status(404).json({ message: 'File tidak ditemukan atau gagal dibaca.' });
    }
};
