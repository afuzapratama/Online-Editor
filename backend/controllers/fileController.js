// backend/controllers/fileController.js
const firestoreService = require('../services/firestoreService');
const previewService = require('../services/previewService');

exports.getFiles = async (req, res) => {
    try {
        const fileTree = await firestoreService.getFiles(req.user.uid);
        res.json(fileTree);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data file.' });
    }
};

exports.getFileContent = async (req, res) => {
    try {
        const content = await firestoreService.getFileContent(req.user.uid, req.query.path);
        res.send(content);
    } catch (error) {
        res.status(404).json({ message: 'File tidak ditemukan.' });
    }
};

exports.createFile = async (req, res) => {
    try {
        const { path } = req.body;
        await firestoreService.createFile(req.user.uid, path);
        previewService.syncToLocalWorkspace(req.user.uid, 'create_file', { relativePath: path });
        res.status(201).json({ message: `File ${path} berhasil dibuat.` });
    } catch (error) {
        res.status(500).json({ message: 'Gagal membuat file.' });
    }
};

exports.createFolder = async (req, res) => {
    try {
        const { path } = req.body;
        await firestoreService.createFolder(req.user.uid, path);
        previewService.syncToLocalWorkspace(req.user.uid, 'create_folder', { relativePath: path });
        res.status(201).json({ message: `Folder ${path} berhasil dibuat.` });
    } catch (error) {
        res.status(500).json({ message: 'Gagal membuat folder.' });
    }
};

exports.saveFile = async (req, res) => {
    try {
        const { path, content } = req.body;
        await firestoreService.saveFile(req.user.uid, path, content);
        previewService.syncToLocalWorkspace(req.user.uid, 'save', { relativePath: path, content });
        res.json({ message: `File ${path} berhasil disimpan.` });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menyimpan file.' });
    }
};

exports.deleteFile = async (req, res) => {
    try {
        const { path } = req.body;
        await firestoreService.deleteFile(req.user.uid, path);
        previewService.syncToLocalWorkspace(req.user.uid, 'delete_file', { relativePath: path });
        res.json({ message: `File ${path} berhasil dihapus.` });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus file.' });
    }
};

exports.deleteFolder = async (req, res) => {
    try {
        const { path } = req.body;
        await firestoreService.deleteFolder(req.user.uid, path);
        previewService.syncToLocalWorkspace(req.user.uid, 'delete_folder', { relativePath: path });
        res.json({ message: `Folder ${path} berhasil dihapus.` });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus folder.' });
    }
};

exports.renameItem = async (req, res) => {
    try {
        const { oldPath, newName } = req.body;
        await firestoreService.renameItem(req.user.uid, oldPath, newName);
        previewService.syncToLocalWorkspace(req.user.uid, 'rename', { oldPath, newName });
        res.json({ message: `Berhasil mengganti nama menjadi ${newName}` });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengganti nama.' });
    }
};
