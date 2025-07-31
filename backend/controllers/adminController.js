// backend/controllers/adminController.js
const firestoreService = require('../services/firestoreService');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await firestoreService.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error("Error fetching all users:", error);
        res.status(500).json({ message: 'Gagal mengambil daftar pengguna.' });
    }
};

exports.getUserFiles = async (req, res) => {
    try {
        const { userId } = req.params;
        const fileTree = await firestoreService.getFiles(userId);
        res.json(fileTree);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data file pengguna.' });
    }
};

exports.getUserFileContent = async (req, res) => {
    try {
        const { userId } = req.params;
        const { path } = req.query;
        const content = await firestoreService.getFileContent(userId, path);
        res.send(content);
    } catch (error) {
        res.status(404).json({ message: 'File tidak ditemukan atau gagal dibaca.' });
    }
};
